import React, { useState, useEffect, useMemo } from 'react';
import { stockAPI } from '../services/api';
import './StockTable.css';

const StockTable = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  useEffect(() => {
    fetchAllStocks();
  }, []);

  const fetchAllStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await stockAPI.getAllStocks();
      setStocks(response.data || []);
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
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredStocks;
  }, [stocks, sortConfig, searchTerm]);

  const paginatedStocks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredStocks.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredStocks, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedAndFilteredStocks.length / itemsPerPage);

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
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
    return sortConfig.direction === 'asc' ? 
      <span className="sort-icon active">↑</span> : 
      <span className="sort-icon active">↓</span>;
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
          <button onClick={fetchAllStocks} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stocks || stocks.length === 0) {
    return (
      <div className="stock-table-container">
        <div className="error-message">
          <h3>No Stocks Found</h3>
          <p>No stock data available in the database.</p>
          <button className="retry-button" onClick={fetchAllStocks}>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-table-container">
      <div className="table-header">
        <div className="header-info">
          <h2>Latest Share Price</h2>
          <div className="market-summary">
            <div className="summary-item">
              <span className="label">Total Stocks:</span>
              <span className="value">{stocks.length}</span>
            </div>
            <div className="summary-item">
              <span className="label">Showing:</span>
              <span className="value">{sortedAndFilteredStocks.length}</span>
            </div>
          </div>
        </div>
        
        <div className="table-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
          </div>
          <button onClick={fetchAllStocks} className="refresh-button">
            Refresh Data
          </button>
        </div>
      </div>

      <div className="table-wrapper">
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
              <th onClick={() => handleSort('sector')}>
                Sector {getSortIcon('sector')}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedStocks.map((stock) => (
              <tr key={stock.tradingCode}>
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
                <td className="sector">{stock.sector}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          
          <div className="pagination-info">
            Page {currentPage} of {totalPages} 
            ({sortedAndFilteredStocks.length} stocks)
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default StockTable;