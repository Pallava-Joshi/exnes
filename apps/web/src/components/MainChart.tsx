// MainChart.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Chart, CandlestickSeries } from "lightweight-charts-react-components";
import type { CandlestickData, UTCTimestamp } from "lightweight-charts";

export type CandleApiResponse = {
  time: string | number; // ISO string or timestamp
  open: number;
  high: number;
  low: number;
  close: number;
};

type CandleChartData = CandlestickData<UTCTimestamp>;

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

type DurationSelectorProps = {
  value: (typeof DURATIONS)[number];
  onChange: (val: (typeof DURATIONS)[number]) => void;
};

const DurationSelector: React.FC<DurationSelectorProps> = ({
  value,
  onChange,
}) => (
  <div style={{ marginBottom: 8, display: "flex", gap: 6 }}>
    {DURATIONS.map((d) => (
      <button
        key={d}
        onClick={() => onChange(d)}
        style={{
          padding: "4px 8px",
          background: d === value ? "#4caf50" : "#222",
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
);

// Convert duration string to seconds
const durationToSeconds = (duration: string) => {
  const num = parseInt(duration);
  if (duration.endsWith("m")) return num * 60;
  if (duration.endsWith("h")) return num * 60 * 60;
  if (duration.endsWith("d")) return num * 24 * 60 * 60;
  return 60; // default 1m
};

type MainChartProps = { asset: string };

const MainChart: React.FC<MainChartProps> = ({ asset }) => {
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>("1m");
  const [candles, setCandles] = useState<CandleChartData[]>([]);
  const seriesRef = useRef<React.ElementRef<typeof CandlestickSeries>>(null);

  const fetchCandles = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost:3001/candles?asset=${asset}&duration=${duration}`
      );
      const data: CandleApiResponse[] = await res.json();

      const formatted: CandleChartData[] = data
        .map((c) => {
          const ts = Math.floor(
            typeof c.time === "number"
              ? c.time / 1000
              : new Date(c.time).getTime() / 1000
          ) as UTCTimestamp;
          if (isNaN(ts)) return null;
          return {
            time: ts,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          };
        })
        .filter(Boolean) as CandleChartData[];

      setCandles(formatted.sort((a, b) => a.time - b.time));
    } catch (err) {
      console.error("Failed to fetch candles", err);
    }
  }, [asset, duration]);

  useEffect(() => {
    fetchCandles();
  }, [fetchCandles]);

  // WebSocket trade aggregation based on selected duration
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    const durationSec = durationToSeconds(duration);

    ws.onopen = () => console.log("WS connected");
    ws.onmessage = (event) => {
      try {
        const trade = JSON.parse(event.data) as {
          s: string;
          p: string;
          E: number;
        };

        // Only process trades for the selected asset
        if (trade.s !== asset) return;

        const price = parseFloat(trade.p);
        if (isNaN(price)) return;

        const ts = (Math.floor(trade.E / 1000 / durationSec) *
          durationSec) as UTCTimestamp;

        setCandles((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.time === ts) {
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                high: Math.max(last.high, price),
                low: Math.min(last.low, price),
                close: price,
              },
            ];
          }

          const newCandle: CandleChartData = {
            time: ts,
            open: prev.length > 0 ? prev[prev.length - 1].close : price,
            high: price,
            low: price,
            close: price,
          };
          return [...prev, newCandle];
        });
      } catch (err) {
        console.error("WS parse error", err);
      }
    };

    ws.onerror = (err) => console.error("WS error", err);
    ws.onclose = () => console.log("WS closed");

    return () => ws.close();
  }, [asset, duration]);

  return (
    <div
      style={{
        height: "520px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <DurationSelector value={duration} onChange={setDuration} />
      <Chart
        options={{
          layout: { background: { color: "#0e0f14" }, textColor: "#DDD" },
          grid: {
            vertLines: { color: "#2c2f3a", style: 1 },
            horzLines: { color: "#2c2f3a", style: 1 },
          },
          rightPriceScale: {
            visible: true,
            borderVisible: true,
            borderColor: "#555",
            scaleMargins: { top: 0.2, bottom: 0.2 }, // more room for candles
          },
          timeScale: {
            borderVisible: true,
            borderColor: "#555",
            timeVisible: true,
            barSpacing: 70, // smaller spacing = bigger candles
            minBarSpacing: 3,
            fixLeftEdge: true,
            fixRightEdge: false,
          },
          crosshair: {
            mode: 1,
            vertLine: {
              visible: true,
              style: 1,
              color: "#AAA",
              width: 1,
              labelVisible: true,
            },
            horzLine: {
              visible: true,
              style: 1,
              color: "#AAA",
              width: 1,
              labelVisible: true,
            },
          },
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
          },
          handleScale: {
            axisPressedMouseMove: true,
            mouseWheel: true,
            pinch: true,
          },
        }}
        containerProps={{
          style: {
            flexGrow: 1,
            height: "100%",
            borderRadius: 12,
            padding: "16px", // adds padding around the chart
            boxShadow: "0 2px 12px rgba(0,0,0,0.6)",
          },
        }}
      >
        <CandlestickSeries
          ref={seriesRef}
          data={candles}
          options={{
            upColor: "#26a69a",
            borderUpColor: "#26a69a",
            wickUpColor: "#26a69a",
            downColor: "#ef5350",
            borderDownColor: "#ef5350",
            wickDownColor: "#ef5350",
            borderVisible: true,
            wickVisible: true,
          }}
        />
      </Chart>
    </div>
  );
};

export default MainChart;
