import express, { Request, Response } from "express";
import {
  getCandles_5m,
  getCandles_15m,
  getCandles_1h,
  getCandles_1d,
  getCandles_7d,
} from "@repo/db/trades";

const app = express();
const port = 3001;

app.get("/candles", async (req: Request, res: Response) => {
  const asset = (req.query.asset as string) || "";
  const duration = (req.query.duration as string) || "5m";

  let candles;
  if (duration === "5m") {
    candles = await getCandles_5m(asset);
  } else if (duration === "15m") {
    candles = await getCandles_15m(asset);
  } else if (duration === "1h") {
    candles = await getCandles_1h(asset);
  } else if (duration === "1d") {
    candles = await getCandles_1d(asset);
  } else if (duration === "7d") {
    candles = await getCandles_7d(asset);
  } else {
    return res.status(400).send("Invalid duration");
  }

  res.json(candles);
});

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
