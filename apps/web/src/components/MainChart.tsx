import { useEffect, useState } from "react";
import {
  Chart,
  TimeScale,
  CandlestickSeries,
  TimeScaleFitContentTrigger,
} from "lightweight-charts-react-components";
import type { UTCTimestamp } from "lightweight-charts";

type CandleApiResponse = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

type CandleChartData = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
};

const DURATIONS = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "4h",
  "1d",
  "7d",
  "30d",
] as const;

export default function MainChart({ asset }: { asset: string }) {
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>("1m");
  const [candles, setCandles] = useState<CandleChartData[]>([]);

  useEffect(() => {
    async function fetchCandles() {
      try {
        const res = await fetch(
          `http://localhost:3001/candles?asset=${asset}&duration=${duration}`
        );
        const data: CandleApiResponse[] = await res.json();

        const formatted: CandleChartData[] = data.map((c) => ({
          time: Math.floor(new Date(c.time).getTime() / 1000) as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        setCandles(formatted.sort((a, b) => a.time - b.time));
      } catch (err) {
        console.error("Failed to fetch candles", err);
      }
    }

    fetchCandles();
  }, [asset, duration]);

  return (
    <div style={{ height: "520px", width: "100%" }}>
      {/* Duration Buttons */}
      <div style={{ marginBottom: 8, display: "flex", gap: 6 }}>
        {DURATIONS.map((d) => (
          <button
            key={d}
            onClick={() => setDuration(d)}
            style={{
              padding: "4px 8px",
              background: d === duration ? "#4caf50" : "#222",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Chart */}
      <Chart
        options={{
          layout: {
            background: { color: "#0e0f14" },
            textColor: "white",
          },
          rightPriceScale: { visible: true, borderVisible: true },
          crosshair: { mode: 1 },
          grid: {
            vertLines: { visible: false },
            horzLines: { visible: false },
          },
        }}
        containerProps={{ style: { flexGrow: 1, height: "100%" } }}
      >
        <CandlestickSeries data={candles} />
        <TimeScale>
          <TimeScaleFitContentTrigger deps={[candles]} />
        </TimeScale>
      </Chart>
    </div>
  );
}
