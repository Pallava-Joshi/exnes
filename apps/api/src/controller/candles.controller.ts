// controller/candles.controller.ts
import { Request, Response } from "express";
import { getCandles, getSymbols } from "@repo/db/trades";

// --------------------
// Explicit mapping of intervals
// --------------------
const durationMap: Record<
  string,
  (symbol: string, start?: number, end?: number) => Promise<any[]>
> = {
  "1m": (symbol, start, end) => getCandles(symbol, "1m", start, end),
  "5m": (symbol, start, end) => getCandles(symbol, "5m", start, end),
  "15m": (symbol, start, end) => getCandles(symbol, "15m", start, end),
  "30m": (symbol, start, end) => getCandles(symbol, "30m", start, end),
  "1h": (symbol, start, end) => getCandles(symbol, "1h", start, end),
  "4h": (symbol, start, end) => getCandles(symbol, "4h", start, end),
  "1d": (symbol, start, end) => getCandles(symbol, "1d", start, end),
};

// --------------------
// Helper: normalize asset
// --------------------
function normalizeAsset(asset?: string) {
  if (!asset) throw new Error("Missing required param: asset");
  return asset.toUpperCase();
}

// --------------------
// Get candles
// --------------------
export const candles = async (req: Request, res: Response) => {
  try {
    const asset = normalizeAsset(req.query.asset as string);
    const ts = (req.query.ts as string)?.toLowerCase();
    if (!ts)
      return res.status(400).json({ error: "Missing required param: ts" });

    const startTime = req.query.startTime
      ? Number(req.query.startTime) * 1000
      : undefined;
    const endTime = req.query.endTime
      ? Number(req.query.endTime) * 1000
      : undefined;

    const fetchCandles = durationMap[ts];
    if (!fetchCandles)
      return res.status(400).json({ error: `Invalid ts: ${ts}` });

    const rawCandles = await fetchCandles(asset, startTime, endTime);

    // map to standard output
    const candles = rawCandles.map((c) => ({
      timestamp: Math.floor(new Date(c.bucket).getTime() / 1000),
      open: parseFloat(c.open),
      high: parseFloat(c.high),
      low: parseFloat(c.low),
      close: parseFloat(c.close),
    }));

    return res.status(200).json({ candles });
  } catch (err: any) {
    console.error("Error fetching candles:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
};

// --------------------
// Get symbols
// --------------------
export const symbols = async (req: Request, res: Response) => {
  try {
    const data = await getSymbols();
    return res.status(200).json({ symbols: data });
  } catch (err: any) {
    console.error("Error fetching symbols:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
