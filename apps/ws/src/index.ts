import { redisClient } from "@repo/redis/client";
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });
const channels = ["trade-data"];

(async () => {
  try {
    await redisClient.subscribe(...channels);
    console.log("[redis] subscribed:", channels.join(", "));
  } catch (error) {
    console.error("[redis] subscription error:", error);
    process.exit(1);
  }
})();

wss.on("connection", (ws) => {
  console.log("Streaming pricing for the new client");

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
    ws.on("close", () => console.log("Client disconnected"));
  });
});
