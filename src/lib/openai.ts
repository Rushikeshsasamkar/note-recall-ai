import OpenAI from "openai";

const apiKey = process.env.GROK_API_KEY;

if (!apiKey) {
  throw Error("GROK_API_KEY is not set");
}

const providerHint =
  (process.env.GROK_PROVIDER ||
    (apiKey.startsWith("gsk_") ? "groq" : "xai")) as string;
const provider = providerHint.toLowerCase() === "groq" ? "groq" : "xai";

const baseURL =
  process.env.GROK_BASE_URL ||
  (provider === "groq" ? "https://api.groq.com/openai/v1" : "https://api.x.ai/v1");

export const chatModel =
  process.env.GROK_CHAT_MODEL ||
  (provider === "groq" ? "llama-3.1-8b-instant" : "grok-2-latest");

export const embeddingModel =
  process.env.GROK_EMBEDDING_MODEL ||
  (provider === "xai" ? "text-embedding-3-small" : "");

const embeddingDimensions = Number(
  process.env.GROK_EMBEDDING_DIM ||
    process.env.PINECONE_EMBEDDING_DIM ||
    "1536",
);

const openai = new OpenAI({ apiKey, baseURL });

export default openai;

export async function getEmbedding(text: string) {
  if (provider === "groq" && !embeddingModel) {
    return hashEmbedding(text, embeddingDimensions);
  }

  const response = await openai.embeddings.create({
    model: embeddingModel,
    input: text,
  });

  const embedding = response.data[0]?.embedding;

  if (!embedding) throw Error("Error generating embedding.");

  return embedding;
}

function hashEmbedding(text: string, dimensions: number) {
  const size = Number.isFinite(dimensions) && dimensions > 0 ? dimensions : 1536;
  const vector = Array.from({ length: size }, () => 0);
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

  for (const token of tokens) {
    const idx = fnv1a(token) % size;
    vector[idx] += 1;
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (norm > 0) {
    for (let i = 0; i < vector.length; i += 1) {
      vector[i] = vector[i] / norm;
    }
  }

  return vector;
}

function fnv1a(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
