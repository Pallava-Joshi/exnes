"use client";
import React from "react";
import { useWs } from "../hooks/useWs";

interface TradeData {
  e: string;
  E: number;
  a: number;
  s: string;
  p: string;
  q: string;
  f: number;
  l: number;
  T: number;
  m: boolean;
  bid: number;
  ask: number;
  timestamp: string;
}

interface TickerItemProps {
  symbol: string;
  price: string;
  bid: number | null | undefined;
  ask: number | null | undefined;
  isUp: boolean;
}

const TickerItem: React.FC<TickerItemProps> = ({ symbol, bid, ask, isUp }) => {
  return (
    <div className="p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="font-medium text-gray-900 text-sm">
          {symbol.toUpperCase()}
        </span>
        {/* <div className={`text-sm font-mono ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                    ${parseFloat(price).toFixed(2)}
                </div> */}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs">Bid</span>
          <span className="font-mono text-green-600">
            ${bid != null ? bid.toFixed(4) : "---"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs">Ask</span>
          <span className="font-mono text-red-600">
            ${ask != null ? ask.toFixed(4) : "---"}
          </span>
        </div>
      </div>

      <div className="mt-2 flex justify-between items-center text-xs">
        <div
          className={`text-xs ${isUp ? "text-green-600" : "text-red-600"}`}
        ></div>
      </div>
    </div>
  );
};

const LeftSideBar: React.FC = () => {
  const { messages, isConnected } = useWs();

  const symbolData = React.useMemo(() => {
    const dataMap = new Map<string, TradeData>();

    messages.forEach((message) => {
      try {
        const parsed: TradeData = JSON.parse(message);

        // console.log(parsed.s);
        if (parsed && parsed.s) {
          dataMap.set(parsed.s, parsed);
        }
      } catch (error) {
        console.error("Error parsing websocket message:", error);
      }
    });

    // Sort symbols alphabetically to maintain consistent positioning
    return Array.from(dataMap.values()).sort((a, b) => a.s.localeCompare(b.s));
  }, [messages]);

  const [priceChanges, setPriceChanges] = React.useState<Map<string, boolean>>(
    new Map()
  );

  React.useEffect(() => {
    // console.log(messages);
    const newChanges = new Map<string, boolean>();

    symbolData.forEach((data) => {
      const currentPrice = parseFloat(data.p);
      const symbol = data.s;
      // console.log(symbol);

      const isUp = data.bid < currentPrice;
      newChanges.set(symbol, isUp);
    });

    setPriceChanges(newChanges);
  }, [symbolData]);

  return (
    <div className="hidden lg:flex w-80 bg-white border-r border-gray-200 h-full flex-col">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 font-ibm-plex-mono">
          Live Ticker
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {symbolData.length} symbols active
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {symbolData.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-black-500 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm">Waiting for live data...</p>
          </div>
        ) : (
          symbolData.map((data) => (
            <TickerItem
              key={data.s}
              symbol={data.s}
              price={data.p}
              bid={data.bid}
              ask={data.ask}
              isUp={priceChanges.get(data.s) || false}
            />
          ))
        )}
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Real-time data</span>
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            ></div>
            <span>{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftSideBar;
