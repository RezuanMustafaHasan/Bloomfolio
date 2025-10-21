import { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { createChart, CrosshairMode, CandlestickSeries } from 'lightweight-charts';
import './StockChart.css';

const RANGES = [
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
  { label: '2Y', months: 24 },
  { label: '5Y', months: 60 },
];

export default function CandlestickChart({ apiBase = 'http://localhost:8000' }) {
  const { tradingCode: routeCode } = useParams();
  const symbol = (routeCode || 'CITYBANK').toUpperCase();

  const [months, setMonths] = useState(24);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candlesRef = useRef(null);
  const resizeObserverRef = useRef(null);

  // Fetch historical OHLC data
  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/api/history?symbol=${symbol}&months=${months}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(json => { setRows(json.data || []); setErr(''); })
      .catch(e => setErr(e.message || 'Failed to load history'))
      .finally(() => setLoading(false));
  }, [apiBase, symbol, months]);

  // Initialize chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: { textColor: '#111827', background: { color: '#ffffff' } },
      grid: { vertLines: { color: '#e5e7eb' }, horzLines: { color: '#e5e7eb' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true },
    });
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    candlesRef.current = series;

    const ro = new ResizeObserver(() => chart.applyOptions({ autoSize: true }));
    ro.observe(containerRef.current);
    resizeObserverRef.current = ro;

    return () => { ro.disconnect(); chart.remove(); };
  }, []);

  // Push data to candlestick series
  useEffect(() => {
    if (!rows.length || !candlesRef.current) return;

    const data = rows.map(d => {
      const open = Number(d.open ?? d.o ?? d.Open ?? d.OPEN ?? d.close);
      const high = Number(d.high ?? d.h ?? d.High ?? d.HIGH ?? Math.max(open, Number(d.close)));
      const low = Number(d.low ?? d.l ?? d.Low ?? d.LOW ?? Math.min(open, Number(d.close)));
      const close = Number(d.close ?? d.c ?? d.Close ?? d.CLOSE ?? open);
      return { time: d.date, open, high, low, close };
    }).filter(p => Number.isFinite(p.open) && Number.isFinite(p.high) && Number.isFinite(p.low) && Number.isFinite(p.close));

    candlesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [rows]);

  const RangeButtons = useMemo(() => (
    <div className="chart-period-buttons">
      {RANGES.map(r => (
        <button key={r.label} onClick={() => setMonths(r.months)}
          className={`period-btn ${months===r.months ? 'active' : ''}`}>{r.label}</button>
      ))}
    </div>
  ), [months]);

  return (
    <div className="stock-chart-card card">
      <div className="card-header chart-header d-flex justify-content-between align-items-center">
        <h5 className="m-0">Candlestick — {symbol}</h5>
        {RangeButtons}
      </div>
      <div className="card-body">
        <div className="chart-container">
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </div>
        {loading && <div className="text-muted">Loading chart…</div>}
        {err && <div className="text-danger">{err}</div>}
      </div>
    </div>
  );
}