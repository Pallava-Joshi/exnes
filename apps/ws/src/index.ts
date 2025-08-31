import WebSocket, { WebSocketServer } from "ws";
import { redisClient } from "@repo/redis/client";

const wss = new WebSocketServer({ port: 8080 });
const channels = ["trade-data"];

// Subscribe to Redis
(async () => {
  try {
    await redisClient.subscribe(...channels);
    console.log("[redis] subscribed(WS):", channels.join(", "));
  } catch (error) {
    console.error("[redis] subscription error:", error);
    process.exit(1);
  }
})();

// Relay Redis messages to all WS clients
redisClient.on("message", (channel, message) => {
  let activeClients = 0;
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
        activeClients++;
      } catch (error) {
        console.error("[ws] send error:", error);
      }
    }
  }
  if (activeClients > 0) {
    console.log(`[ws] sent to ${activeClients} client(s)`);
  }
});

// Handle new WebSocket connections
wss.on("connection", (ws) => {
  console.log("[ws] new client connected");

  ws.on("close", () => {
    console.log("[ws] client disconnected");
  });
});
