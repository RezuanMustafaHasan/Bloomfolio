import React from 'react';
import StockTable from './StockTable';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h1>Welcome to Bloomfolio</h1>
      <p>Your personal stock portfolio tracker</p>
      <StockTable />
    </div>
  );
};

export default Dashboard;