import Split from "react-split";
import SidebarOrderbook from "./components/SidebarOrderbook";
import MainChart from "./components/MainChart";
import TradePanel from "./components/TradePanel";

function App() {
  return (
    <div className="bg-black h-screen text-white flex flex-col">
      {/* Header */}
      <header className="h-14 bg-gray-950 border-b border-gray-800 flex items-center px-6">
        <h1 className="text-lg font-bold">Crypto Exchange Dashboard</h1>
      </header>

      {/* Main Split Layout */}
      <Split
        className="flex flex-grow"
        sizes={[15, 70, 15]}
        minSize={100}
        gutterSize={12}
        gutterAlign="center"
        snapOffset={30}
        gutter={() => {
          const el = document.createElement("div");
          el.className =
            "bg-gray-700 hover:bg-gray-500 transition-all cursor-col-resize";
          return el;
        }}
      >
        <SidebarOrderbook />
        <MainChart asset="BTCUSDT" />
        <TradePanel />
      </Split>

      {/* Keep cursor consistent */}
      <style>{`
        .gutter {
          cursor: col-resize !important;
        }
        .gutter:hover {
          cursor: col-resize !important;
        }
      `}</style>
    </div>
  );
}

export default App;
