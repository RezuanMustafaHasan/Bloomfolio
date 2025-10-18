import { useEffect, useRef, useState, useMemo } from "react";
import { createChart, CrosshairMode, LineSeries } from "lightweight-charts";

const DEFAULT_SYMBOLS = ["CITYBANK", "GP", "ACI", "BSCCL", "BEXIMCO", "SQURPHARMA"];
const RANGES = [
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
  { label: "2Y", months: 24 },
  { label: "5Y", months: 60 },
];

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function PerformanceChart({ apiBase = "http://localhost:8000" }) {
  const [symbol, setSymbol] = useState("CITYBANK");
  const [months, setMonths] = useState(24);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [hoveredData, setHoveredData] = useState(null);

  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const lineSeriesRef = useRef(null);
  const resizeObserverRef = useRef(null);

  // Fetch data
  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/api/history?symbol=${symbol}&months=${months}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        setRows(json.data || []);
        setErr("");
      })
      .catch(e => setErr(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [apiBase, symbol, months]);

  // Build chart once
  useEffect(() => {
    if (!containerRef.current) return;

    // init chart with dark theme
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: { 
        textColor: "#ffffff",
        background: { color: "#1a1a1a" }
      },
      grid: { 
        vertLines: { color: "#333333" }, 
        horzLines: { color: "#333333" } 
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { 
        borderVisible: false,
        textColor: "#ffffff"
      },
      timeScale: { 
        borderVisible: false, 
        fixLeftEdge: true, 
        fixRightEdge: true,
        textColor: "#ffffff"
      },
    });
    chartRef.current = chart;

    // line series
    const lineSeries = chart.addSeries(LineSeries, {
      color: "#8b5cf6",
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 6,
      crosshairMarkerBorderColor: "#8b5cf6",
      crosshairMarkerBackgroundColor: "#8b5cf6",
    });
    lineSeriesRef.current = lineSeries;

    // Add crosshair move handler for tooltip
    chart.subscribeCrosshairMove((param) => {
      if (param.point === undefined || !param.time || param.point.x < 0 || param.point.y < 0) {
        setHoveredData(null);
        return;
      }

      const data = param.seriesData.get(lineSeries);
      if (data) {
        const date = new Date(param.time * 1000);
        const monthName = MONTH_NAMES[date.getMonth()];
        setHoveredData({
          month: monthName,
          price: Math.round(data.value),
          x: param.point.x,
          y: param.point.y
        });
      }
    });

    // resize
    const ro = new ResizeObserver(() => {
      chart.applyOptions({ autoSize: true });
    });
    ro.observe(containerRef.current);
    resizeObserverRef.current = ro;

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, []);

  // Push data to series when rows change
  useEffect(() => {
    if (!rows.length || !lineSeriesRef.current) return;

    const lineData = rows.map(d => ({
      time: d.date,
      value: +d.close,
    }));

    lineSeriesRef.current.setData(lineData);
    chartRef.current.timeScale().fitContent();
  }, [rows]);

  const SymbolPicker = useMemo(() => (
    <div className="flex flex-wrap gap-2">
      {DEFAULT_SYMBOLS.map(s => (
        <button
          key={s}
          onClick={() => setSymbol(s)}
          className={`px-3 py-1 rounded border ${symbol===s ? "bg-purple-600 text-white border-purple-600" : "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"}`}
          title={`Load ${s}`}
        >
          {s}
        </button>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const v = e.currentTarget.elements.namedItem("customSymbol").value.trim().toUpperCase();
          if (v) setSymbol(v);
        }}
        className="flex gap-2 items-center"
      >
        <input 
          name="customSymbol" 
          placeholder="Custom symbol…" 
          className="px-2 py-1 border rounded bg-gray-700 text-white border-gray-600 placeholder-gray-400" 
        />
        <button className="px-3 py-1 rounded border bg-gray-700 text-white border-gray-600 hover:bg-gray-600">Load</button>
      </form>
    </div>
  ), [symbol]);

  const RangePicker = useMemo(() => (
    <div className="flex gap-2">
      {RANGES.map(r => (
        <button
          key={r.label}
          onClick={() => setMonths(r.months)}
          className={`px-3 py-1 rounded border ${months===r.months ? "bg-purple-600 text-white border-purple-600" : "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"}`}
        >
          {r.label}
        </button>
      ))}
    </div>
  ), [months]);

  return (
    <div className="w-full bg-gray-900 rounded-lg p-6" style={{ backgroundColor: "#1a1a1a" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="text-xl font-bold text-white">{symbol} Performance</div>
        {RangePicker}
      </div>
      {SymbolPicker}
      {loading && <div className="mt-4 text-white">Loading…</div>}
      {err && !loading && <div className="mt-4 text-red-400">Error: {err}</div>}
      <div className="relative">
        <div 
          ref={containerRef} 
          style={{ 
            width: "100%", 
            height: 400, 
            marginTop: 12, 
            borderRadius: 8,
            backgroundColor: "#1a1a1a"
          }} 
        />
        {hoveredData && (
          <div
            className="absolute pointer-events-none z-10 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-600"
            style={{
              left: Math.min(hoveredData.x + 10, containerRef.current?.offsetWidth - 120 || 0),
              top: Math.max(hoveredData.y - 60, 10),
            }}
          >
            <div className="text-sm text-gray-300">{hoveredData.month}</div>
            <div className="text-sm">
              <span className="text-purple-400">price : </span>
              <span className="font-mono">{hoveredData.price}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}