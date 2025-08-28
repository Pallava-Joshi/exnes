import Redis from "ioredis";

export const redis = new Redis("http://localhost:6379");

redis.on("error", (e) => console.log("[redis:error]", e));
redis.on("connect", () => console.log("[redis] connected"));
redis.on("reconnecting", () => console.log("[redis] reconnecting"));
