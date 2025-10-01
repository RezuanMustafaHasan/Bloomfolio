import React from 'react';
import TopNavbar from './components/Navbar';
import StockHeader from './components/StockHeader';
import StockChart from './components/StockChart';
import './App.css';
import stockData from './assets/stockData'


function App() {
  return (
    <div className="App">
        <div className="container main-content">
          <StockHeader stockData={stockData} />
          <StockChart />
        </div>
      </div>
  );
}

export default App;
