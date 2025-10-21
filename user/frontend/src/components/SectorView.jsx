import React, { useEffect, useMemo, useState } from 'react';
import { stockAPI } from '../services/api';
import './StockTable.css';
import './SectorView.css';

const SectorView = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSectors, setExpandedSectors] = useState(new Set());

  useEffect(() => {
    // restore expanded sectors from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('sector-expanded') || '[]');
      if (Array.isArray(saved)) setExpandedSectors(new Set(saved));
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchAllStocks();
  }, []);

  useEffect(() => {
    // persist expanded sectors
    localStorage.setItem('sector-expanded', JSON.stringify(Array.from(expandedSectors)));
  }, [expandedSectors]);

  const fetchAllStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await stockAPI.getAllStocks();
      const stocksData = response.data || [];
      setStocks(stocksData);
      // initialize expanded sectors to show all by default if none persisted
      setExpandedSectors(prev => {
        if (prev.size) return prev;
        const uniqueSectors = Array.from(new Set(stocksData.map(s => s.sector || 'Uncategorized')));
        return new Set(uniqueSectors);
      });
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setError('Failed to fetch stocks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatChange = (change, changePercentage) => {
    if (change === null || change === undefined) return 'N/A';
    const isPositive = change >= 0;
    const changeClass = isPositive ? 'positive' : 'negative';
    return (
      <span className={`change ${changeClass}`}>
        {isPositive ? '+' : ''}{formatNumber(change)} ({isPositive ? '+' : ''}{formatNumber(changePercentage)}%)
      </span>
    );
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span className="sort-icon">↕</span>;
    }
    return sortConfig.direction === 'asc'
      ? <span className="sort-icon active">↑</span>
      : <span className="sort-icon active">↓</span>;
  };

  const sortedAndFilteredStocks = useMemo(() => {
    let filteredStocks = stocks.filter(stock =>
      stock.tradingCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.sector?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key) {
      filteredStocks.sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filteredStocks;
  }, [stocks, sortConfig, searchTerm]);

  // Summary across all filtered stocks
  const summary = useMemo(() => {
    const list = sortedAndFilteredStocks;
    const totals = { totalTrade: 0, tradeValue: 0, totalVolume: 0, gainers: 0, losers: 0, unchanged: 0 };
    for (const s of list) {
      const mi = s.marketInformation || {};
      totals.totalTrade += mi.daysTradeCount || 0;
      totals.tradeValue += mi.daysValue || 0;
      totals.totalVolume += mi.daysVolume || 0;
      const cp = mi.changePercentage;
      if (cp > 0) totals.gainers++;
      else if (cp < 0) totals.losers++;
      else totals.unchanged++;
    }
    totals.tradeValueMn = totals.tradeValue / 1000000;
    const totalCount = Math.max(1, totals.gainers + totals.losers + totals.unchanged);
    totals.gPct = Math.round((totals.gainers / totalCount) * 100);
    totals.lPct = Math.round((totals.losers / totalCount) * 100);
    totals.uPct = 100 - totals.gPct - totals.lPct;
    return totals;
  }, [sortedAndFilteredStocks]);

  const groupBySector = (list) => {
    const map = new Map();
    for (const stock of list) {
      const sector = stock.sector || 'Uncategorized';
      if (!map.has(sector)) map.set(sector, []);
      map.get(sector).push(stock);
    }
    // sort sectors alphabetically for consistent order
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const toggleSector = (sector) => {
    setExpandedSectors(prev => {
      const next = new Set(prev);
      if (next.has(sector)) next.delete(sector);
      else next.add(sector);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="stock-table-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading stock data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stock-table-container">
        <div className="error-message">
          <h3>Error Loading Stocks</h3>
          <p>{error}</p>
          <button onClick={fetchAllStocks} className="refresh-button">Retry</button>
        </div>
      </div>
    );
  }

  const sectorGroups = groupBySector(sortedAndFilteredStocks);

  return (
    <div className="sector-view">
      <div className="stock-table-container">
        <div className="table-header">
          <div className="header-info">
            <h2>Market Overview by Sector</h2>
            <div className="market-summary">
              <div className="summary-item">
                <span className="label">Total Trade</span>
                <span className="value">{summary.totalTrade.toLocaleString()}</span>
              </div>
              <div className="summary-item">
                <span className="label">Trade Value (mn)</span>
                <span className="value">{formatNumber(summary.tradeValueMn)}</span>
              </div>
              <div className="summary-item">
                <span className="label">Total Volume</span>
                <span className="value">{summary.totalVolume.toLocaleString()}</span>
              </div>
              <div className="summary-item">
                <span className="label">Gainers / Losers / Unchanged</span>
                <div className="dist-bar">
                  <div className="bar-segment gains" style={{ width: `${summary.gPct}%` }}></div>
                  <div className="bar-segment losses" style={{ width: `${summary.lPct}%` }}></div>
                  <div className="bar-segment unchanged" style={{ width: `${summary.uPct}%` }}></div>
                </div>
                <div className="dist-labels">
                  <span className="gains">{summary.gainers}</span>
                  <span className="losses">{summary.losers}</span>
                  <span className="unchanged">{summary.unchanged}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="table-controls">
            <input
              type="text"
              placeholder="Search by trading code, company, sector"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="search-input"
            />
            <button onClick={fetchAllStocks} className="refresh-button">Refresh</button>
          </div>
        </div>

        <div className="stock-table-wrapper">
          <table className="stock-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('tradingCode')}>
                  Trading Code {getSortIcon('tradingCode')}
                </th>
                <th onClick={() => handleSort('marketInformation.lastTradingPrice')}>
                  LTP {getSortIcon('marketInformation.lastTradingPrice')}
                </th>
                <th onClick={() => handleSort('marketInformation.changePercentage')}>
                  % {getSortIcon('marketInformation.changePercentage')}
                </th>
                <th onClick={() => handleSort('marketInformation.openingPrice')}>
                  Open {getSortIcon('marketInformation.openingPrice')}
                </th>
                <th onClick={() => handleSort('marketInformation.daysRange.high')}>
                  High {getSortIcon('marketInformation.daysRange.high')}
                </th>
                <th onClick={() => handleSort('marketInformation.daysRange.low')}>
                  Low {getSortIcon('marketInformation.daysRange.low')}
                </th>
                <th onClick={() => handleSort('marketInformation.closingPrice')}>
                  Close {getSortIcon('marketInformation.closingPrice')}
                </th>
                <th onClick={() => handleSort('marketInformation.yesterdaysClosingPrice')}>
                  YCP {getSortIcon('marketInformation.yesterdaysClosingPrice')}
                </th>
                <th onClick={() => handleSort('marketInformation.change')}>
                  Change {getSortIcon('marketInformation.change')}
                </th>
                <th onClick={() => handleSort('marketInformation.daysTradeCount')}>
                  Trade {getSortIcon('marketInformation.daysTradeCount')}
                </th>
                <th onClick={() => handleSort('marketInformation.daysValue')}>
                  Value(MN) {getSortIcon('marketInformation.daysValue')}
                </th>
                <th onClick={() => handleSort('marketInformation.daysVolume')}>
                  Volume {getSortIcon('marketInformation.daysVolume')}
                </th>
                <th onClick={() => handleSort('basicInformation.marketCategory')}>
                  Cat {getSortIcon('basicInformation.marketCategory')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sectorGroups.map(([sector, sectorStocks]) => {
                const isOpen = expandedSectors.has(sector);
                return (
                  <React.Fragment key={sector}>
                    <tr className="sector-header" onClick={() => toggleSector(sector)}>
                      <td colSpan={13}>
                        <span className={`chevron ${isOpen ? 'open' : ''}`}>▶</span>
                        <span className="sector-name">{sector}</span>
                        <span className="sector-count">{sectorStocks.length} stocks</span>
                      </td>
                    </tr>
                    {sectorStocks.map((stock) => (
                      <tr key={stock.tradingCode} className={`sector-stock-row ${isOpen ? 'visible' : 'hidden'}`}>
                        <td>
                          <a href={`/stocks/${stock.tradingCode}`} className="trading-code-link">
                            {stock.tradingCode}
                          </a>
                        </td>
                        <td className="price">{formatNumber(stock.marketInformation?.lastTradingPrice)}</td>
                        <td className={`percentage ${stock.marketInformation?.changePercentage >= 0 ? 'positive' : 'negative'}`}>
                          {stock.marketInformation?.changePercentage >= 0 ? '+' : ''}{formatNumber(stock.marketInformation?.changePercentage)}
                        </td>
                        <td>{formatNumber(stock.marketInformation?.openingPrice)}</td>
                        <td>{formatNumber(stock.marketInformation?.daysRange?.high)}</td>
                        <td>{formatNumber(stock.marketInformation?.daysRange?.low)}</td>
                        <td>{formatNumber(stock.marketInformation?.closingPrice)}</td>
                        <td>{formatNumber(stock.marketInformation?.yesterdaysClosingPrice)}</td>
                        <td>
                          {formatChange(
                            stock.marketInformation?.change,
                            stock.marketInformation?.changePercentage
                          )}
                        </td>
                        <td>{stock.marketInformation?.daysTradeCount?.toLocaleString() || 'N/A'}</td>
                        <td>{formatNumber(stock.marketInformation?.daysValue / 1000000)}</td>
                        <td>{stock.marketInformation?.daysVolume?.toLocaleString() || 'N/A'}</td>
                        <td className="category">{stock.basicInformation?.marketCategory || 'N/A'}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SectorView;