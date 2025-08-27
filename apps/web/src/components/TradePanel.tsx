import { useState } from "react";

export default function OrderPanel() {
  const [volume, setVolume] = useState(0.01);

  return (
    <div className="bg-gray-900 p-4 rounded-2xl shadow-lg text-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">₿</span>
          <span className="font-semibold">BTC</span>
        </div>
        <select className="bg-gray-800 text-xs rounded px-2 py-1">
          <option>Regular form</option>
          <option>OCO</option>
        </select>
      </div>

      {/* Buy / Sell prices */}
      <div className="flex justify-between mb-2">
        <div className="flex flex-col items-start border border-red-600 rounded p-2 w-[48%]">
          <span className="text-red-400 font-bold text-sm">Sell</span>
          <span className="text-red-300 text-sm">111,691.18</span>
        </div>
        <div className="flex flex-col items-end border border-blue-600 rounded p-2 w-[48%]">
          <span className="text-blue-400 font-bold text-sm">Buy</span>
          <span className="text-blue-300 text-sm">111,712.78</span>
        </div>
      </div>

      {/* Balance bar */}
      <div className="flex items-center text-gray-400 text-[10px] mb-3">
        <span className="text-red-400 mr-1">23%</span>
        <div className="flex-1 h-1 bg-gray-800 mx-1 relative">
          <div className="absolute left-0 top-0 h-1 bg-red-600" style={{ width: "23%" }} />
          <div className="absolute right-0 top-0 h-1 bg-blue-600" style={{ width: "77%" }} />
        </div>
        <span className="text-blue-400 ml-1">77%</span>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-3">
        <button className="flex-1 bg-gray-800 py-1 rounded">Market</button>
        <button className="flex-1 bg-gray-800 py-1 rounded">Pending</button>
      </div>

      {/* Form */}
      <div className="space-y-2">
        {/* Volume */}
        <div className="flex items-center justify-between">
          <label>Volume</label>
          <div className="flex items-center space-x-1">
            <input
              type="number"
              value={volume}
              step="0.01"
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 bg-gray-800 text-right px-2 py-1 rounded"
            />
            <span>Lots</span>
          </div>
        </div>

        {/* Take Profit */}
        <div className="flex items-center justify-between">
          <label>Take Profit</label>
          <select className="bg-gray-800 px-2 py-1 rounded">
            <option>Not set</option>
          </select>
        </div>

        {/* Stop Loss */}
        <div className="flex items-center justify-between">
          <label>Stop Loss</label>
          <select className="bg-gray-800 px-2 py-1 rounded">
            <option>Not set</option>
          </select>
        </div>
      </div>
    </div>
  );
}
