import fs from 'fs';
import path from 'path';
import { upsert } from './vectorStore.js';

let initialized = false;

/** খুব সিম্পল টোকেনাইজার */
function tokens(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

/** লোকাল 256-ডাইমেনশন হ্যাশ এম্বেডিং (API দরকার নেই) */
function localEmbed(text: string, dim = 256) {
    const vec = new Array(dim).fill(0);
    for (const t of tokens(text)) {
        // সহজ deterministic hash
        let h = 2166136261;
        for (let i = 0; i < t.length; i++) {
            h ^= t.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
        const idx = h % dim;
        vec[idx] += 1;
    }
    // L2 normalize
    let norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
    return vec.map((x) => x / norm);
}

function chunkText(text: string, sz = 800) {
    const lines = text.split(/\n+/);
    const chunks: string[] = [];
    let buf = '';
    for (const ln of lines) {
        const next = buf ? buf + '\n' + ln : ln;
        if (next.length > sz) {
            if (buf.trim()) chunks.push(buf.trim());
            buf = ln;
        } else {
            buf = next;
        }
    }
    if (buf.trim()) chunks.push(buf.trim());
    return chunks;
}

export async function ensurePolicyEmbeddings() {
    if (initialized) return;
    const policyPath = path.resolve(process.cwd(), 'policy.md');
    const raw = fs.readFileSync(policyPath, 'utf8');
    const chunks = chunkText(raw);

    for (const ch of chunks) {
        const emb = localEmbed(ch);
        upsert(ch, emb);
    }
    initialized = true;
}

/** প্রশ্নের জন্যও একই লোকাল এম্বেডার এক্সপোর্ট করি */
export function embedQuestionLocal(q: string) {
    return localEmbed(q);
}
