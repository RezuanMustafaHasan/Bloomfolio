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
          <p className="source-note">Quotes dated {stockData.marketInformation.asOfDate?.slice(0,10)} · {stockData.dataSource?.stale ? 'Saved source data' : 'Latest available source data'} · <a href="https://www.stockchartbd.com/developers.php" target="_blank" rel="noreferrer">DSE Intelligence</a> / dsebd.org</p>
          <div className="charts-grid"><StockChart stockData={stockData} /><CandlestickChart /></div>
          <StockInfoCards stockData={stockData}/>
          <CorporateActions stockData={stockData}/>
          <FinancialPerformance stockData={stockData}/>

        </div>
      </div>
  );
}

export default App;
