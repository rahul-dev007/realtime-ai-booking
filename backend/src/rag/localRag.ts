// backend/src/rag/localRag.ts
import fs from "fs";
import path from "path";
import { upsert } from "./vectorStore.js";

// --- internal state ---
let initialized = false;
let lastLoadedMtimeMs = 0;

// ---------- utils ----------
/** Unicode normalize (NFKC) to keep things consistent across scripts (Bangla-friendly). */
function norm(s: string): string {
  return s.normalize("NFKC");
}

/**
 * Unicode/Bangla-friendly tokenizer.
 * Splits on any non-letter/number; keeps all scripts (Bangla, Latin, etc).
 */
function tokens(s: string): string[] {
  const cleaned = norm(s).toLowerCase();
  // split on non-letter/number (Unicode aware)
  return cleaned
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** Local 256-dim hash embedding (no external API) */
function localEmbed(text: string, dim = 256): number[] {
  const vec = new Array<number>(dim).fill(0);
  for (const t of tokens(text)) {
    // simple deterministic FNV-like hash
    let h = 2166136261 >>> 0;
    for (let i = 0; i < t.length; i++) {
      h ^= t.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    const idx = h % dim;
    vec[idx] += 1;
  }
  // L2 normalize
  let norm2 = 0;
  for (let i = 0; i < dim; i++) norm2 += vec[i] * vec[i];
  const denom = Math.sqrt(norm2) || 1;
  for (let i = 0; i < dim; i++) vec[i] = vec[i] / denom;
  return vec;
}

/**
 * Chunk by character length but try to keep line boundaries.
 * Falls back safely if a single line exceeds chunk size.
 */
function chunkText(text: string, sz = 800): string[] {
  const lines = norm(text).split(/\r?\n/);
  const chunks: string[] = [];
  let buf = "";

  const pushBuf = () => {
    const trimmed = buf.trim();
    if (trimmed) chunks.push(trimmed);
    buf = "";
  };

  for (const ln of lines) {
    if (!ln) {
      if (buf.length >= sz * 0.8) pushBuf(); // paragraph-ish split
      else buf += "\n";
      continue;
    }
    const candidate = buf ? `${buf}\n${ln}` : ln;
    if (candidate.length > sz) {
      if (buf.trim()) pushBuf();
      // line itself too big: hard-slice
      let i = 0;
      while (i < ln.length) {
        const end = Math.min(i + sz, ln.length);
        chunks.push(ln.slice(i, end).trim());
        i = end;
      }
      buf = "";
    } else {
      buf = candidate;
    }
  }
  if (buf.trim()) pushBuf();
  return chunks;
}

// ---------- public API ----------
/**
 * Ensure policy embeddings are loaded into vector store.
 * - idempotent (checks mtime)
 * - Bangla safe
 * - keeps original upsert(text, embedding) calling convention
 */
export async function ensurePolicyEmbeddings(policyPathInput?: string): Promise<void> {
  try {
    const policyPath =
      policyPathInput ||
      // prefer repo root policy.md; fallback to current working directory
      path.resolve(process.cwd(), "policy.md");

    if (!fs.existsSync(policyPath)) {
      // Try one more common fallback (project root two-levels up)
      const alt = path.resolve(process.cwd(), "../../policy.md");
      if (fs.existsSync(alt)) {
        await embedPolicyFile(alt);
        return;
      }
      throw new Error(`policy.md not found at: ${policyPath}`);
    }

    const stat = fs.statSync(policyPath);
    const mtimeMs = stat.mtimeMs;

    // If already initialized and file unchanged, skip
    if (initialized && mtimeMs === lastLoadedMtimeMs) return;

    await embedPolicyFile(policyPath, mtimeMs);
  } catch (err) {
    console.error("[RAG] ensurePolicyEmbeddings failed:", err);
    // Do not throw in prod/MVP; caller can still run app without RAG
  }
}

/** Public helper: embed a question locally (Bangla/Unicode-safe). */
export function embedQuestionLocal(q: string): number[] {
  return localEmbed(q);
}

// ---------- internals ----------
async function embedPolicyFile(policyPath: string, mtimeMs?: number) {
  const raw = fs.readFileSync(policyPath, "utf8");
  const chunks = chunkText(raw, 800);

  // (re)index: simple strategy—upsert all chunks
  for (const ch of chunks) {
    const emb = localEmbed(ch);
    // keep original vectorStore upsert API (text, embedding)
    upsert(ch, emb);
  }

  initialized = true;
  if (mtimeMs) lastLoadedMtimeMs = mtimeMs;

  console.log(`[RAG] policy indexed: ${chunks.length} chunks from ${policyPath}`);
}
