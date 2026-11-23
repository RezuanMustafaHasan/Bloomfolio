import { MARKET_DATA_BASE } from '../services/config';
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

export default function StockChart({ apiBase = MARKET_DATA_BASE, stockData }) {
  const { tradingCode: routeCode } = useParams();
  const symbol = (routeCode || 'CITYBANK').toUpperCase();

  const [months, setMonths] = useState(6);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [source, setSource] = useState(null);

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

  // Reuse the detail response so quote labels and the company header agree.
  useEffect(() => {
    if(stockData?.marketInformation) {
      const mi=stockData.marketInformation;
      setOhlc({open:mi.openingPrice,high:mi.daysRange?.high,low:mi.daysRange?.low,last:mi.lastTradingPrice});
      return;
    }
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
  }, [symbol, stockData]);

  // Fetch historical data for chart
  useEffect(() => {
    let active = true;
    setRows([]);
    setLoading(true);
    fetch(`${apiBase}/api/history?symbol=${symbol}&months=${months}`)
      .then(async r => { const body = await r.json(); if (!r.ok) throw new Error(body.detail || `HTTP ${r.status}`); return body; })
      .then(json => { if(active) {setRows(json.data || []); setSource(json.source); setErr('');} })
      .catch(e => {if(active) setErr(e.message || 'Failed to load history');})
      .finally(() => {if(active) setLoading(false);});
    return () => {active=false;};
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
    <div className="stock-chart-card card" data-testid="price-chart" data-bars={rows.length}>
      <div className="card-header chart-header d-flex justify-content-between align-items-center">
        <h5 className="m-0">Price History — {symbol}</h5>
        {RangeButtons}
      </div>
      <div className="card-body">
        <div className="chart-container">
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </div>
        {loading && <div className="text-muted">Loading chart…</div>}
        {err && <div className="text-danger" role="alert">{err}</div>}
        {rows.length>0 && <div className="chart-provenance">{rows.length} daily bars · {rows[0].date} to {rows.at(-1).date} · {source?.stale ? 'Saved' : 'Source'}: {source?.name}</div>}
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