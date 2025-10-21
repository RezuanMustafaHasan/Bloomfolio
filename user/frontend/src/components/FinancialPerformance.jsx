import React from 'react';
import './FinancialPerformance.css';

const FinancialPerformance = ({ stockData }) => {
  const { financialPerformance } = stockData;
  const { interimEPS, periodEndMarketPrice } = financialPerformance || {};

  return (
    <div className="financial-performance">
      <div className="card performance-card">
        <div className="card-header">
          <h5>Financial Performance</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="performance-section">
                <h6>Interim Earnings Per Share (EPS)</h6>
                <div className="table-responsive">
                  <table className="table performance-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Period</th>
                        <th>Basic EPS</th>
                        <th>Diluted EPS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interimEPS?.map((eps, index) => (
                        <tr key={index}>
                          <td>{eps.year}</td>
                          <td>{eps.period}</td>
                          <td className={eps.basic < 0 ? 'negative' : 'positive'}>
                            {eps.basic?.toFixed(2) || 'N/A'}
                          </td>
                          <td>{eps.diluted?.toFixed(2) || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="performance-section">
                <h6>Period End Market Price</h6>
                <div className="table-responsive">
                  <table className="table performance-table">
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Market Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periodEndMarketPrice?.map((price, index) => (
                        <tr key={index}>
                          <td>{price.period}</td>
                          <td>${price.price?.toFixed(2) || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialPerformance;