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
// import stockData from './assets/stockData'
import sd from './assets/stockData'


function App() {
  // Get the tradingCode from URL parameters
  const { tradingCode } = useParams();
  const [stockData, setStockData] = useState(sd);

  useEffect(() => {
    if (tradingCode) {
      axios.get(`http://localhost:8080/fetch-details/${tradingCode}`)
        .then((res) => {
          console.log('API Response:', res.data);
          const stockDataObject = res.data.data;

          
          console.log('Transformed Stock Data:', stockDataObject);
          setStockData(stockDataObject);
        })
        .catch((err) => console.error("Error:", err));
    }
  }, [tradingCode]);


  // Display the trading code from URL (you can use this for API calls or other logic)
  console.log('Trading Code from URL:', tradingCode);
  console.log('Stock Data:', stockData);

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
