"use client";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
} from "lightweight-charts";

const Chart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const [interval, setInterval] = useState("5m");
  const [candles, setCandles] = useState<CandlestickData[]>([]);

  // Fetch candles whenever interval changes
  useEffect(() => {
    async function fetchCandles() {
      try {
        const res = await axios.get(
          `http://localhost:3001/candles?asset=BTCUSDT&duration=5m`
        );
        console.log(res)
        // Map API response -> lightweight-charts format
        const formatted: CandlestickData[] = res.data.map((c: any) => ({
          time: Math.floor(new Date(c.time).getTime() / 1000), // unix timestamp (seconds)
          open: Number(c.open),
          high: Number(c.high),
          low: Number(c.low),
          close: Number(c.close),
        }));
        setCandles(formatted);
      } catch (err) {
        console.error("Error fetching candles", err);
      }
    }

    fetchCandles();
  }, [interval]);

  // Initialize chart once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "black" },
        textColor: "white",
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
    });

    // Resize handler
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chartRef.current?.remove();
    };
  }, []);

  // Update data whenever candles change
  useEffect(() => {
    if (seriesRef.current && candles.length > 0) {
      seriesRef.current.setData(candles);
    }
  }, [candles]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Dropdown for interval selection */}
      <div className="p-2 bg-gray-800 text-white text-sm">
        <select
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          className="bg-gray-900 border border-gray-600 rounded p-1"
        >
          <option value="5m">5m</option>
          <option value="15m">15m</option>
          <option value="1h">1h</option>
          <option value="1d">1d</option>
          <option value="7d">7d</option>
        </select>
      </div>

      {/* Chart container */}
      <div ref={chartContainerRef} className="flex-1" />
    </div>
  );
};

export default Chart;
