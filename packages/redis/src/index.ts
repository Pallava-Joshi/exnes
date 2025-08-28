import Redis from "ioredis";

const redisClient = new Redis("redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redisClient.on("error", (e) => console.log("[redis:error]", e));
redisClient.on("connect", () => console.log("[redis] connected"));
redisClient.on("reconnecting", () => console.log("[redis] reconnecting"));

export { redisClient };
