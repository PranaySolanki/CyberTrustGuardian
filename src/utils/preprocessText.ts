import vocab from '../../assets/models/vocab.json';

const VOCAB: Record<string, number> = vocab as Record<string, number>;
const MAX_LEN = 200;
const OOV_TOKEN = '<OOV>';

function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/https?:\/\/\S+|www\.\S+/g, '<URL>')
    .replace(/\S+@\S+/g, '<EMAIL>')
    .replace(/\b\d{10,}\b/g, '<PHONE>')
    .replace(/[^a-z0-9\s<>_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function preprocessText(text: string): Float32Array {
  const cleaned = cleanText(text);
  const words = cleaned.split(' ').filter(w => w.length > 0);
  const oovId = VOCAB[OOV_TOKEN] ?? 1;
  const sequence = words.map(word => VOCAB[word] ?? oovId);
  const padded = new Float32Array(MAX_LEN).fill(0);
  const len = Math.min(sequence.length, MAX_LEN);
  for (let i = 0; i < len; i++) {
    padded[i] = sequence[i];
  }
  return padded;
}