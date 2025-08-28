import WebSocket from "ws";
import { pushTradeDataToDb, schema, TradeData } from "@repo/db/trades";
import { redisClient } from "@repo/redis/client";

async function publish(trade: TradeData) {
  redisClient.publish("trade-data", JSON.stringify(trade));
}

let tradeBuffer: TradeData[] = [];

async function flushTrades(trade: TradeData) {
  if (tradeBuffer.length >= 500) {
    await pushTradeDataToDb(trade);
    console.log(`Saved trade: ${trade.s} @ ${trade.p} x ${trade.q}`);
    tradeBuffer = [];
  }
  tradeBuffer.push(trade);
}

const ws = new WebSocket(
  "wss://stream.binance.com:9443/stream?streams=btcusdt@trade/ethusdt@trade/solusdt@trade"
);

ws.on("error", console.error);

ws.on("open", async () => {
  await schema();
  console.log("WebSocket connected & schema ensured");
});

ws.on("message", async (data) => {
  const parseData = JSON.parse(data.toString());
  const trade: TradeData = parseData.data;
  try {
    flushTrades(trade);
    publish(trade);
  } catch (err) {
    console.error("Error inserting trade:", err);
  }
});
