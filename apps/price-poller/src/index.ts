import WebSocket from "ws";
import { pushTradeDataToDb, schema, TradeData } from "@repo/db/trades";

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
    await pushTradeDataToDb(trade);
    console.log(`Saved trade: ${trade.s} @ ${trade.p} x ${trade.q}`);
  } catch (err) {
    console.error("Error inserting trade:", err);
  }
});
