import { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { createChart, CrosshairMode, LineSeries } from 'lightweight-charts';
import { stockAPI } from '../services/api';
import './StockChart.css';

const RANGES = [
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
  { label: '2Y', months: 24 },
  { label: '5Y', months: 60 },
];

export default function StockChart({ apiBase = 'http://localhost:8000' }) {
  const { tradingCode: routeCode } = useParams();
  const symbol = (routeCode || 'CITYBANK').toUpperCase();

  const [months, setMonths] = useState(24);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [ohlc, setOhlc] = useState({
    open: null,
    high: null,
    low: null,
    last: null,
  });

  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const lineSeriesRef = useRef(null);
  const resizeObserverRef = useRef(null);

  // Fetch realtime OHLC via existing stock API
  useEffect(() => {
    let ignore = false;
    let timer;

    const load = async () => {
      const r = await stockAPI.getStockByCode(symbol);
      const mi = r?.data?.marketInformation || {};
      if (!ignore) {
        setOhlc({
          open: Number(mi.openingPrice) || null,
          high: Number(mi.daysRange?.high) || null,
          low: Number(mi.daysRange?.low) || null,
          last: Number(mi.lastTradingPrice) || null,
        });
      }
    };

    load();
    // refresh every 30s to approximate realtime
    timer = setInterval(load, 30000);

    return () => { ignore = true; clearInterval(timer); };
  }, [symbol]);

  // Fetch historical data for chart
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

    const line = chart.addSeries(LineSeries, {
      color: '#00c805',
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: '#00c805',
      crosshairMarkerBackgroundColor: '#00c805',
    });
    lineSeriesRef.current = line;

    const ro = new ResizeObserver(() => chart.applyOptions({ autoSize: true }));
    ro.observe(containerRef.current);
    resizeObserverRef.current = ro;

    return () => { ro.disconnect(); chart.remove(); };
  }, []);

  // Push data to series
  useEffect(() => {
    if (!rows.length || !lineSeriesRef.current) return;
    lineSeriesRef.current.setData(rows.map(d => ({ time: d.date, value: +d.close })));
    chartRef.current?.timeScale().fitContent();
  }, [rows]);

  const fmt = (n) => (Number.isFinite(n) ? n.toFixed(2) : 'N/A');

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
        <h5 className="m-0">Price History — {symbol}</h5>
        {RangeButtons}
      </div>
      <div className="card-body">
        <div className="chart-container">
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </div>
        {loading && <div className="text-muted">Loading chart…</div>}
        {err && <div className="text-danger">{err}</div>}
        <div className="chart-footer">
          <div className="d-flex justify-content-center gap-4">
            <span><strong>LTP:</strong> {fmt(ohlc.last)}</span>
            <span><strong>Open:</strong> {fmt(ohlc.open)}</span>
            <span><strong>High:</strong> {fmt(ohlc.high)}</span>
            <span><strong>Low:</strong> {fmt(ohlc.low)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}