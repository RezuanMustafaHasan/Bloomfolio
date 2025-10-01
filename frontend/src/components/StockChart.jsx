import React from 'react';
import './StockChart.css';

const StockChart = () => {
  // Static chart data points for demonstration
  const chartData = [
    { x: 0, y: 60 },
    { x: 50, y: 45 },
    { x: 100, y: 70 },
    { x: 150, y: 55 },
    { x: 200, y: 80 },
    { x: 250, y: 65 },
    { x: 300, y: 90 },
    { x: 350, y: 75 },
    { x: 400, y: 95 },
    { x: 450, y: 85 },
    { x: 500, y: 100 }
  ];

  // Create SVG path from data points
  const createPath = (points) => {
    const pathData = points.map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${point.x} ${point.y}`;
    }).join(' ');
    return pathData;
  };

  const pathData = createPath(chartData);

  return (
    <div className="card stock-chart-card">
      <div className="card-body">
        <div className="chart-header">
          <div className="chart-period-buttons">
            <button className="period-btn">1D</button>
            <button className="period-btn">1W</button>
            <button className="period-btn active">1M</button>
            <button className="period-btn">3M</button>
            <button className="period-btn">1Y</button>
            <button className="period-btn">5Y</button>
          </div>
        </div>
        
        <div className="chart-container">
          <svg width="100%" height="300" viewBox="0 0 500 120" className="stock-chart-svg">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="50" height="20" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Chart area fill */}
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00c805" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#00c805" stopOpacity="0.05"/>
              </linearGradient>
            </defs>
            
            {/* Fill area under the line */}
            <path
              d={`${pathData} L 500 120 L 0 120 Z`}
              fill="url(#chartGradient)"
            />
            
            {/* Main chart line */}
            <path
              d={pathData}
              fill="none"
              stroke="#00c805"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {chartData.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="3"
                fill="#00c805"
                className="chart-point"
              />
            ))}
          </svg>
        </div>
        
        <div className="chart-footer">
          <small className="text-muted">
            Market hours: 9:30 AM - 4:00 PM EST
          </small>
        </div>
      </div>
    </div>
  );
};

export default StockChart;