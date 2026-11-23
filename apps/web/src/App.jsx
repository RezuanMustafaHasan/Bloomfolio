import { API_BASE } from './services/config';
import React from 'react';
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from 'react-router-dom';
import StockHeader from './components/StockHeader';
import StockChart from './components/StockChart';
import StockInfoCards from './components/StockInfoCards';
import CorporateActions from './components/CorporateActions';
import FinancialPerformance from './components/FinancialPerformance';
import CandlestickChart from './components/CandlestickChart';
import './App.css';


function App() {
  // Get the tradingCode from URL parameters
  const { tradingCode } = useParams();
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStockData(null);
    setError('');
    if (tradingCode) {
      axios.get(`${API_BASE}/fetch-details/${tradingCode}`)
        .then((res) => {
          if (!cancelled) setStockData(res.data.data);
        })
        .catch((err) => { if (!cancelled) setError(err.response?.data?.message || 'Stock details are unavailable.'); });
    }
    return () => { cancelled = true; };
  }, [tradingCode]);


  if (error) return <div className="container my-4 alert alert-warning" role="alert">{error}</div>;
  if (!stockData) return <div className="container my-4">Loading stock details…</div>;

  return (
    <div className="App">
        <div className="container main-content">
          <StockHeader stockData={stockData}/>
          <StockChart />
          <StockInfoCards stockData={stockData}/>
          <CorporateActions stockData={stockData}/>
          <FinancialPerformance stockData={stockData}/>
          {/* Candlestick chart right after financial performance */}
          <CandlestickChart />
        </div>
      </div>
  );
}

export default App;
