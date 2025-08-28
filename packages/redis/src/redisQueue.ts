import { redis } from "./index";

// Blocking pop (waits for data, returns [key, value] or null)
export async function redisPop(queueKey: string, blockTimeout = 5) {
  return await redis.brpop(queueKey, blockTimeout);
}

// Push item to queue
export async function redisPush(queueKey: string, value: any) {
  return await redis.lpush(queueKey, JSON.stringify(value));
}

// Get queue length
export async function redisLength(queueKey: string) {
  return await redis.llen(queueKey);
}
