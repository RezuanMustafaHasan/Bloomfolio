import React, { useEffect, useMemo, useState } from 'react';
import { stockAPI } from '../services/api';
import './Dashboard.css';

// Utility: build a semicircle segment path
function polarToCartesian(cx, cy, r, angleInDeg) {
  const angleInRad = (angleInDeg - 180) * Math.PI / 180.0;
  return {
    x: cx + r * Math.cos(angleInRad),
    y: cy + r * Math.sin(angleInRad)
  };
}

function semicircleSegmentPath(cx, cy, outerR, innerR, startAngle, endAngle) {
  const startOuter = polarToCartesian(cx, cy, outerR, endAngle);
  const endOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const startInner = polarToCartesian(cx, cy, innerR, endAngle);
  const endInner = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    'M', startOuter.x, startOuter.y,
    'A', outerR, outerR, 0, largeArc, 0, endOuter.x, endOuter.y,
    'L', endInner.x, endInner.y,
    'A', innerR, innerR, 0, largeArc, 1, startInner.x, startInner.y,
    'Z'
  ].join(' ');
}

const DashboardOverview = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await stockAPI.getAllStocks();
        setStocks(res.data || []);
      } catch (err) {
        console.error('Error fetching stocks:', err);
        setError('Failed to fetch overview metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const metrics = useMemo(() => {
    const totals = { trades: 0, value: 0, volume: 0, gainers: 0, losers: 0, unchanged: 0 };
    for (const s of stocks) {
      const mi = s.marketInformation || {};
      totals.trades += mi.daysTradeCount || 0;
      totals.value += mi.daysValue || 0;
      totals.volume += mi.daysVolume || 0;
      const cp = mi.changePercentage;
      if (cp > 0) totals.gainers++;
      else if (cp < 0) totals.losers++;
      else totals.unchanged++;
    }
    
    const count = Math.max(1, totals.gainers + totals.losers + totals.unchanged);
    const gainsPct = (totals.gainers / count) * 100;
    const lossesPct = (totals.losers / count) * 100;
    const unchangedPct = 100 - gainsPct - lossesPct;
    return {
      ...totals,
      valueMn: totals.value / 1_000_000,
      gainsPct,
      lossesPct,
      unchangedPct
    };
  }, [stocks]);

  const segments = useMemo(() => {
    // Create semicircle segments from 180° (left) to 0° (right) across the top
    const totalDeg = 180;
    const gainsDeg = totalDeg * (metrics.gainsPct / 100);
    const lossesDeg = totalDeg * (metrics.lossesPct / 100);
    const unchangedDeg = Math.max(0, totalDeg - gainsDeg - lossesDeg);

    let currentAngle = 0; // Start from 0 degrees
    
    const cx = 200;
    const cy = 200;
    const outerR = 180;
    const innerR = 120;

    const segments = [];
    
    // Gainer segment (green)
    if (gainsDeg > 0) {
      const startAngle = currentAngle;
      const endAngle = currentAngle + gainsDeg;
      segments.push({
        d: semicircleSegmentPath(cx, cy, outerR, innerR, startAngle, endAngle),
        color: '#2ecc71',
        label: 'Gainer'
      });
      currentAngle = endAngle;
    }

    // Loser segment (pink)
    if (lossesDeg > 0) {
      const startAngle = currentAngle;
      const endAngle = currentAngle + lossesDeg;
      segments.push({
        d: semicircleSegmentPath(cx, cy, outerR, innerR, startAngle, endAngle),
        color: '#ce1a53ff',
        label: 'Loser'
      });
      currentAngle = endAngle;
    }

    // Unchanged segment (blue)
    if (unchangedDeg > 0) {
      const startAngle = currentAngle;
      const endAngle = 180;
      segments.push({
        d: semicircleSegmentPath(cx, cy, outerR, innerR, startAngle, endAngle),
        color: '#5dade2',
        label: 'Unchanged'
      });
    }

    return segments;
  }, [metrics.gainsPct, metrics.lossesPct, metrics.unchangedPct]);

  return (
    <div className="dashboard-overview">
      <div className="overview-grid">
        <div className="strength-card">
          <div className="strength-header">
            <div className="legend">
              <span><span className="legend-dot" style={{ background: '#2ecc71' }}></span> Gainer</span>
              <span><span className="legend-dot" style={{ background: '#f01a5eff' }}></span> Loser</span>
              <span><span className="legend-dot" style={{ background: '#5dade2' }}></span> Unchanged</span>
            </div>
          </div>
          <svg className="semi-donut" viewBox="0 0 400 220" role="img" aria-label="Market strength gauge">
            {/* Base background arc */}
            <path d={semicircleSegmentPath(200, 200, 180, 120, 180, 0)} fill="#e9edf3" />
            {segments.map((seg, i) => (
              <path key={i} d={seg.d} fill={seg.color} />
            ))}
            {/* Center label */}
            <text x="200" y="170" textAnchor="middle" className="gauge-title">DSEX</text>
            <text x="200" y="195" textAnchor="middle" className="gauge-subtitle">Strength</text>
          </svg>
          <div className="gauge-counts">
            <div className="count gains">{metrics.gainers.toLocaleString()}</div>
            <div className="count losses">{metrics.losers.toLocaleString()}</div>
            <div className="count unchanged">{metrics.unchanged.toLocaleString()}</div>
          </div>
        </div>

        <div className="kpi-grid">
          <div className="kpi">
            <div className="kpi-label">Total Trades</div>
            <div className="kpi-value">{metrics.trades.toLocaleString()}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Aggregate Trade Value (mn)</div>
            <div className="kpi-value">{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(metrics.valueMn)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Cumulative Volume</div>
            <div className="kpi-value">{metrics.volume.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;