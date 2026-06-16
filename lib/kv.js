import { Redis } from '@upstash/redis';

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  throw new Error('Upstash Redis env vars missing (KV_REST_API_URL/TOKEN or UPSTASH_REDIS_REST_URL/TOKEN).');
}

const redis = new Redis({ url, token });

const barKey = (name) => `bar:${name.trim().toLowerCase()}`;

export async function getBar(name) {
  if (!name) return null;
  return await redis.get(barKey(name));
}

export async function putBar(name, data) {
  const key = barKey(name);
  await redis.set(key, data);
  return key;
}

export async function barExists(name) {
  return (await redis.exists(barKey(name))) === 1;
}
