import React from 'react';
import './StockHeader.css';

const StockHeader = ({ stockData }) => {
  const { companyName, tradingCode, marketInformation } = stockData;
  const { lastTradingPrice, change, changePercentage } = marketInformation;
  
  const isPositive = change >= 0;
  
  return (
    <div className="container-fluid stock-header">
      <div className="row">
        <div className="col">
          <div className="stock-title">
            <h1 className="company-name">{companyName}</h1>
            <span className="trading-code">{tradingCode}</span>
          </div>
          <div className="stock-price-info">
            <span className="current-price">${lastTradingPrice.toFixed(2)}</span>
            <span className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}{change.toFixed(2)} ({changePercentage.toFixed(2)}%)
            </span>
          </div>
          <div className="market-status">
            <span className="status-indicator"></span>
            <span className="status-text">Market Open</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockHeader;