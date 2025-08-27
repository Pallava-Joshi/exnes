type Row = {
  symbol: string;
  bid: string;
  ask: string;
};

const data: Row[] = [
  { symbol: "BTC", bid: "32442", ask: "3242343" },
  { symbol: "SOL/USDT", bid: "142.40", ask: "142.70" },
  { symbol: "ETH", bid: "3249.80", ask: "3250.50" },
];

export default function SidebarOrderbook() {
  return (
    <div className="bg-gray-900 p-3 rounded-2xl shadow-lg overflow-hidden">
      <h2 className="text-sm font-semibold mb-2">Orderbook</h2>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="text-gray-400 border-b border-gray-700">
            <th className="p-1 text-left">Symbol</th>
            <th className="p-1 text-right">Bid</th>
            <th className="p-1 text-right">Ask</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="hover:bg-gray-800 border-b border-gray-800"
            >
              <td className="p-1 font-medium">{row.symbol}</td>
              <td className="p-1 text-right text-green-400">{row.bid}</td>
              <td className="p-1 text-right text-red-400">{row.ask}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
