import WebSocket from "ws";
import { pushTradeDataToDb, schema, TradeData } from "@repo/db/trades";
import { redisClient } from "@repo/redis/client";

async function publish(trade: TradeData) {
  const currentPrice = trade.p;
  const timeStamp = trade.t;
  //@TODO - don't send the whole data
  redisClient.publish("trade-data", JSON.stringify(trade));
  redisClient.set(
    `last:price:${trade.s}`,
    JSON.stringify({ currentPrice, timeStamp })
  );
}

let tradeBuffer: TradeData[] = [];

async function flushTrades(trade: TradeData) {
  if (tradeBuffer.length >= 500) {
    await pushTradeDataToDb(trade);
    console.log(`Saved trade: ${trade.s} @ ${trade.p} x ${trade.q}`);
    // console.log(trade);
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
  const price = parseFloat(parseData.data.p);
  const ask = price * 1.01;
  const trade: TradeData = {
    ...parseData.data,
    ask,
    bid: price,
  };
  // console.log(trade);
  try {
    flushTrades(trade);
    publish(trade);
  } catch (err) {
    console.error("Error inserting trade:", err);
  }
});
