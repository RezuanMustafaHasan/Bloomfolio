import React from 'react';
import TopNavbar from './components/Navbar';
import StockHeader from './components/StockHeader';
import StockChart from './components/StockChart';
import StockInfoCards from './components/StockInfoCards';
import CorporateActions from './components/CorporateActions';
import FinancialPerformance from './components/FinancialPerformance';
import './App.css';
import stockData from './assets/stockData'


function App() {
  return (
    <div className="App">
        <div className="container main-content">
          <StockHeader stockData={stockData} />
          <StockChart />
          <StockInfoCards stockData={stockData} />
          <CorporateActions stockData={stockData} />
          <FinancialPerformance stockData={stockData} />
        </div>
      </div>
  );
}

export default App;
