import './Profile.css';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { stockAPI } from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [holdings, setHoldings] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let ignore = false;

    (async () => {
      try {
        setError(null);
        setLoading(true);
        const res = await axios.get(`http://localhost:8080/users/${userId}`, {
          withCredentials: true,
        });
        const profile = res.data;
        if (!ignore) setUser(profile);

        // Build holdings with market data
        const portfolio = Array.isArray(profile?.portfolio) ? profile.portfolio : [];
        if (portfolio.length > 0) {
          const prices = await Promise.all(
            portfolio.map(async (p) => {
              const code = String(p.stock).toUpperCase();
              const r = await stockAPI.getStockByCode(code);
              const ltp = Number(r?.data?.marketInformation?.lastTradingPrice);
              return { code, ltp: Number.isFinite(ltp) ? ltp : null };
            })
          );
          const priceMap = Object.fromEntries(prices.map(({ code, ltp }) => [code, ltp]));
          const computed = portfolio.map((p) => {
            const code = String(p.stock).toUpperCase();
            const qty = Number(p.quantity) || 0;
            const avgRate = Number(p.buyPrice) || 0;
            const totalCost = qty * avgRate;
            const marketRate = Number(priceMap[code]);
            const marketValue = Number.isFinite(marketRate) ? qty * marketRate : null;
            const profit = Number.isFinite(marketValue) ? (marketValue - totalCost) : null;
            const gainPct = Number.isFinite(marketValue) && totalCost > 0 ? ((marketValue - totalCost) / totalCost) * 100 : null;
            return {
              instrument: code,
              qty,
              avgRate,
              totalCost,
              marketRate,
              marketValue,
              profit,
              gainPct,
            };
          });
          if (!ignore) setHoldings(computed);
        } else {
          if (!ignore) setHoldings([]);
        }
      } catch (e) {
        if (!ignore) setError('Failed to load profile');
        if (e?.response?.status === 401) navigate('/login');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [userId, navigate]);

  const overallGain = useMemo(() => {
    return holdings.reduce((sum, h) => sum + (Number.isFinite(h.profit) ? h.profit : 0), 0);
  }, [holdings]);

  const overallMarketValue = useMemo(() => {
    return holdings.reduce((sum, h) => sum + (Number.isFinite(h.marketValue) ? h.marketValue : 0), 0);
  }, [holdings]);

  const formatNumber = (n) => {
    if (n === null || n === undefined) return '—';
    const num = Number(n);
    if (!Number.isFinite(num)) return '—';
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const formatPercent = (n) => {
    if (n === null || n === undefined) return '—';
    const num = Number(n);
    if (!Number.isFinite(num)) return '—';
    const val = Math.abs(num).toLocaleString(undefined, { maximumFractionDigits: 2 });
    return `${num >= 0 ? '+' : '-'}${val}%`;
  };

  return (
    <div className="profile">
      <h1>Profile</h1>
      <div className="container">
        <div className="row">
          <div className="col-6">
            <h3>Purchase Power : ৳{formatNumber(user?.purchasePower)}</h3>
          </div>
          <div className="col-6 add-fund-container">
            <button className="btn btn-primary add-fund-btn" onClick={() => navigate('/money-request')}>Add Funds</button>
          </div>
        </div>
        {error && <p className="text-danger">{error}</p>}

        <div className="stock-table-container">
          <div className="table-header">
            <h2>Your Portfolio</h2>
            <div className="d-flex gap-3 align-items-center">
              <div className="summary-item">
                <span className="label">Portfolio Size:</span>
                <span className="value"> ৳{formatNumber(overallMarketValue)}</span>
              </div>
              <div className="summary-item">
                <span className="label">Overall Gain/Loss: </span>
                <span className={`value ${overallGain >= 0 ? 'positive' : 'negative'}`}> ৳{formatNumber(overallGain)}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading portfolio...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table performance-table">
                <thead>
                  <tr>
                    <th>Instrument</th>
                    <th>Total Qty</th>
                    <th>Avg. Rate</th>
                    <th>Total Cost</th>
                    <th>Market Rate</th>
                    <th>Market Value</th>
                    <th>Profit</th>
                    <th>Gain %</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center' }}>No holdings</td>
                    </tr>
                  ) : (
                    holdings.map((h) => (
                      <tr key={h.instrument}>
                        <td><Link to={`/stocks/${h.instrument}`} className="trading-code-link">{h.instrument}</Link></td>
                        <td>{formatNumber(h.qty)}</td>
                        <td>{formatNumber(h.avgRate)}</td>
                        <td>{formatNumber(h.totalCost)}</td>
                        <td>{formatNumber(h.marketRate)}</td>
                        <td>{formatNumber(h.marketValue)}</td>
                        <td className={Number(h.profit) >= 0 ? 'positive' : 'negative'}>{formatNumber(h.profit)}</td>
                        <td className={Number(h.gainPct) >= 0 ? 'positive' : 'negative'}>{formatPercent(h.gainPct)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}