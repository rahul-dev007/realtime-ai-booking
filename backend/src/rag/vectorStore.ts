import crypto from 'crypto';

export type Embedding = { id: string; text: string; vector: number[] };
const store: Embedding[] = [];

export function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export function upsert(text: string, vector: number[]) {
  const id = crypto.createHash('sha1').update(text).digest('hex');
  const i = store.findIndex(e => e.id === id);
  const rec = { id, text, vector };
  if (i === -1) store.push(rec); else store[i] = rec;
}

export function topK(queryVec: number[], k = 3) {
  return [...store]
    .map(e => ({ ...e, score: cosine(queryVec, e.vector) }))
    .sort((a,b) => b.score - a.score)
    .slice(0, k);
}
