import express, { Request, Response } from "express";
import cors from "cors";
import {
  getCandles_1m,
  getCandles_5m,
  getCandles_15m,
  getCandles_30m,
  getCandles_1h,
  getCandles_4h,
  getCandles_1d,
  getCandles_7d,
  getCandles_30d,
} from "@repo/db/trades";

const app = express();
const port = 3001;
app.use(cors());

// Map query duration to DB function
const durationMap: Record<string, (symbol: string) => Promise<any[]>> = {
  "1m": getCandles_1m,
  "5m": getCandles_5m,
  "15m": getCandles_15m,
  "30m": getCandles_30m,
  "1h": getCandles_1h,
  "4h": getCandles_4h,
  "1d": getCandles_1d,
  "7d": getCandles_7d,
  "30d": getCandles_30d,
};

app.get("/candles", async (req: Request, res: Response) => {
  const asset = (req.query.asset as string)?.toUpperCase() || "";
  const duration = (req.query.duration as string) || "5m";

  const fetchCandles = durationMap[duration];
  if (!fetchCandles) {
    return res.status(400).json({ error: "Invalid duration" });
  }

  try {
    const rawCandles = await fetchCandles(asset);
    console.log(rawCandles);
    const candles = rawCandles.map((c) => ({
      time: c.bucket,
      open: parseFloat(c.open),
      high: parseFloat(c.high),
      low: parseFloat(c.low),
      close: parseFloat(c.close),
    }));

    res.json(candles);
  } catch (err) {
    console.error("Error fetching candles:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
