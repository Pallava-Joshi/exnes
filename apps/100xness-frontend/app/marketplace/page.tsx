"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createChart,
  CrosshairMode,
  IChartApi,
  CandlestickData,
  UTCTimestamp,
  CandlestickSeries,
} from "lightweight-charts";
import { useGetCandles, useGetSymbols } from "../hooks/useCandles";
import { Candle } from "../types/candle.type";
import IntervalSelector from "../components/IntervalSelector";
import LeftSideBar from "../components/LeftSideBar";
import RightSideBar from "../components/RightSideBar";
import OrdersSection from "../components/OrdersSection";

const Marketplace = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ReturnType<IChartApi["addSeries"]> | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [balance] = useState(10000);
  const [selectedInterval, setSelectedInterval] = useState("1m");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const endTime = Math.floor(Date.now() / 1000);
  const startTime = endTime - 30 * 24 * 60 * 60;
  const [symbol, setSymbol] = useState("btcusdt");
  const { data: symbols, isLoading: symbolsLoading } = useGetSymbols();

  const { data, isLoading, isError } = useGetCandles(
    selectedInterval,
    startTime,
    endTime,
    symbol
  );

  useEffect(() => {
    if (!containerRef.current) return;

    // Add a small delay to ensure container has dimensions
    const timer = setTimeout(() => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth || 800;
      const containerHeight = containerRef.current.clientHeight || 400;

      const chart = createChart(containerRef.current, {
        width: containerWidth,
        height: containerHeight,
        layout: { background: { color: "#ffffff" }, textColor: "#374151" },
        crosshair: { mode: CrosshairMode.Normal },
        grid: {
          vertLines: { color: "#e5e7eb" },
          horzLines: { color: "#e5e7eb" },
        },
        timeScale: { borderColor: "#d1d5db" },
        rightPriceScale: { borderColor: "#d1d5db" },
      });

      chartRef.current = chart;

      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#00b050",
        downColor: "#ff4976",
        borderDownColor: "#ff4976",
        borderUpColor: "#00b050",
        wickDownColor: "#838ca1",
        wickUpColor: "#838ca1",
      });
      seriesRef.current = series;

      const ro = new ResizeObserver((entries) => {
        if (entries[0]) {
          const { width, height } = entries[0].contentRect;
          if (width > 0 && height > 0) {
            chart.applyOptions({ width, height });
            chart.timeScale().fitContent();
          }
        }
      });
      ro.observe(containerRef.current);
      resizeObserverRef.current = ro;

      // Force initial resize after a brief moment
      setTimeout(() => {
        if (containerRef.current) {
          const newWidth = containerRef.current.clientWidth;
          const newHeight = containerRef.current.clientHeight;
          if (newWidth > 0 && newHeight > 0) {
            chart.applyOptions({ width: newWidth, height: newHeight });
            chart.timeScale().fitContent();
          }
        }
      }, 100);
    }, 50);

    return () => {
      clearTimeout(timer);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !data || isLoading || isError) return;

    console.log("data", data);

    const mapped: CandlestickData[] = data.map((row: Candle) => ({
      time: row.timestamp as UTCTimestamp,
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume),
    }));
    console.log(mapped);
    mapped.sort((a, b) => (a.time as number) - (b.time as number));

    seriesRef.current.setData(mapped);
    chartRef.current?.timeScale().fitContent();
  }, [data, isLoading, isError]);

  return (
    <div className="w-full h-screen bg-white flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 md:px-6 lg:px-8">
        <div className="mx-auto">
          <div className="flex items-center justify-between mb-4 md:mb-0">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <h1 className="text-xl font-semibold text-black font-ibm-plex-mono">
                100xness
              </h1>
            </div>

            <button
              className="md:hidden p-2 text-gray-600 hover:text-black"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          <div className="hidden md:flex md:items-center md:justify-between">
            <div className="flex items-center gap-6 lg:gap-8">
              <nav className="flex items-center gap-6 lg:gap-8">
                <Link
                  href="/"
                  className="text-gray-600 hover:text-black transition-colors font-instrument-sans"
                >
                  Home
                </Link>
                <Link
                  href="/trade"
                  className="text-gray-600 hover:text-black transition-colors font-instrument-sans"
                >
                  Trade
                </Link>
                <Link
                  href="/marketplace"
                  className="text-black font-semibold font-instrument-sans"
                >
                  Marketplace
                </Link>
              </nav>

              <div className="flex items-center gap-4 lg:gap-6 pl-6 lg:pl-8 border-l border-gray-300">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Symbol:</span>
                  <select
                    className="bg-white text-black text-sm px-3 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    disabled={symbolsLoading}
                  >
                    {symbolsLoading ? (
                      <option>Loading symbols...</option>
                    ) : (
                      (symbols || []).map((symbolItem: string) => (
                        <option
                          key={symbolItem}
                          value={symbolItem}
                          className="bg-white text-black"
                        >
                          {symbolItem.toUpperCase()}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Timeframe:</span>
                  <IntervalSelector
                    selectedInterval={selectedInterval}
                    onIntervalChange={setSelectedInterval}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 lg:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Balance:</span>
                <span className="text-lg font-semibold text-black font-ibm-plex-mono">
                  ${balance.toLocaleString()}
                </span>
              </div>
              <button className="bg-black text-white text-sm px-6 py-2 rounded-lg font-medium transition-colors hover:bg-gray-800 cursor-pointer">
                Deposit
              </button>
            </div>
          </div>

          <div className={`md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}>
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <nav className="flex flex-col gap-3 pb-4 border-b border-gray-200">
                <Link
                  href="/"
                  className="text-gray-600 hover:text-black transition-colors font-instrument-sans"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/trade"
                  className="text-gray-600 hover:text-black transition-colors font-instrument-sans"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Trade
                </Link>
                <Link
                  href="/marketplace"
                  className="text-black font-semibold font-instrument-sans"
                >
                  Marketplace
                </Link>
                {/* <Link 
                                    href="/login" 
                                    className="text-gray-600 hover:text-black transition-colors font-instrument-sans"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Login
                                </Link> */}
              </nav>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Symbol:</span>
                  <select
                    className="bg-white text-black text-sm px-3 py-2 rounded-lg border border-gray-300 transition-colors"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    disabled={symbolsLoading}
                  >
                    {symbolsLoading ? (
                      <option>Loading symbols...</option>
                    ) : (
                      (symbols || []).map((symbolItem: string) => (
                        <option
                          key={symbolItem}
                          value={symbolItem}
                          className="bg-white text-black"
                        >
                          {symbolItem.toUpperCase()}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Balance:</span>
                  <span className="text-lg font-semibold text-white font-ibm-plex-mono">
                    ${balance.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm text-gray-600">Timeframe:</span>
                  <IntervalSelector
                    selectedInterval={selectedInterval}
                    onIntervalChange={setSelectedInterval}
                    className="w-full"
                  />
                </div>

                <div className="pt-2">
                  <button className="w-full bg-black text-white text-sm px-4 py-3 rounded-lg font-medium transition-colors hover:bg-gray-800">
                    Deposit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <LeftSideBar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative overflow-hidden bg-white">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                <div className="text-center">
                  <div className="text-black text-lg mb-2">
                    Loading chart data...
                  </div>
                  <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              </div>
            )}
            {isError && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                <div className="text-center p-4">
                  <div className="text-red-600 text-lg mb-2">
                    Error loading chart data
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-white border-2 border-black text-black px-4 py-2 rounded-lg text-sm transition-colors hover:bg-black hover:text-white"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            <div
              ref={containerRef}
              className="w-full h-full"
              style={{ minHeight: "400px" }}
            />
          </div>

          <div className="h-80 flex-shrink-0 border-t border-gray-200">
            <OrdersSection />
          </div>
        </div>

        <div className="hidden lg:block">
          <RightSideBar selectedSymbol={symbol} />
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
