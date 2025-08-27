import { useEffect, useState } from "react";
import {
  Chart,
  CandlestickSeries,
  TimeScale,
  TimeScaleFitContentTrigger,
} from "lightweight-charts-react-components";

type Candle = {
  bucket: string; // timestamp from Postgres
  open: number;
  high: number;
  low: number;
  close: number;
};

const durations = ["5m", "15m", "1h", "1d", "7d"] as const;
type Duration = (typeof durations)[number];

const CandleChart = () => {
  const [candles, setCandles] = useState<any[]>([]);
  const [duration, setDuration] = useState<Duration>("15m");

  useEffect(() => {
    async function fetchCandles() {
      const res = await fetch(
        `http://localhost:3001/candles?asset=BTCUSDT&duration=${duration}`
      );
      const data: Candle[] = await res.json();

      const formatted = data.map((c) => ({
        time: new Date(c.bucket).getTime() / 1000, // UNIX seconds
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      }));

      setCandles(formatted);
    }

    fetchCandles();
  }, [duration]);

  return (
    <div
      style={{
        width: "100%",
        height: "600px",
        background: "#0e1117",
        color: "#fff",
        padding: "1rem",
      }}
    >
      {/* Duration Selector */}
      <div style={{ marginBottom: "0.75rem", fontSize: "0.85rem" }}>
        {durations.map((d) => (
          <button
            key={d}
            onClick={() => setDuration(d)}
            style={{
              marginRight: "0.4rem",
              padding: "0.35rem 0.75rem",
              borderRadius: "4px",
              border: "1px solid #333",
              background: duration === d ? "#2563eb" : "#1e293b",
              color: "#fff",
              fontSize: "0.8rem",
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
          layout: { background: { color: "#0e1117" }, textColor: "#d1d5db" },
          grid: {
            vertLines: { color: "#1f2937" },
            horzLines: { color: "#1f2937" },
          },
          rightPriceScale: { borderColor: "#374151" },
          timeScale: { borderColor: "#374151" },
        }}
        containerProps={{ style: { width: "100%", height: "100%" } }}
      >
        <CandlestickSeries data={candles} />
        <TimeScale>
          <TimeScaleFitContentTrigger deps={[candles]} />
        </TimeScale>
      </Chart>
    </div>
  );
};

export default CandleChart;
