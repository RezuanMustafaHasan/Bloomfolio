import React from 'react';
import './CorporateActions.css';

const CorporateActions = ({ stockData }) => {
  const { corporateActions } = stockData;
  const { cashDividends, bonusIssues, rightIssues, lastAGMDate } = corporateActions || {};

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="corporate-actions">
      <div className="card actions-card">
        <div className="card-header">
          <h5>Corporate Actions</h5>
          <small className="text-muted">
            Last AGM: {formatDate(lastAGMDate)}
          </small>
        </div>
        <div className="card-body">
          <div className="row">
            {/* Cash Dividends */}
            <div className="col-lg-4 mb-4">
              <div className="action-section">
                <h6>Cash Dividends</h6>
                <div className="table-responsive">
                  <table className="table action-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashDividends?.slice(0, 5).map((dividend, index) => (
                        <tr key={index}>
                          <td>{dividend.year}</td>
                          <td className="dividend-value">{dividend.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {cashDividends?.length > 5 && (
                  <small className="text-muted">
                    +{cashDividends.length - 5} more entries
                  </small>
                )}
              </div>
            </div>

            {/* Bonus Issues */}
            <div className="col-lg-4 mb-4">
              <div className="action-section">
                <h6>Bonus Issues</h6>
                <div className="table-responsive">
                  <table className="table action-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bonusIssues?.slice(0, 5).map((bonus, index) => (
                        <tr key={index}>
                          <td>{bonus.year}</td>
                          <td className="bonus-value">{bonus.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {bonusIssues?.length > 5 && (
                  <small className="text-muted">
                    +{bonusIssues.length - 5} more entries
                  </small>
                )}
              </div>
            </div>

            {/* Rights Issues */}
            <div className="col-lg-4 mb-4">
              <div className="action-section">
                <h6>Rights Issues</h6>
                <div className="table-responsive">
                  <table className="table action-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Ratio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rightIssues?.map((right, index) => (
                        <tr key={index}>
                          <td>{right.year}</td>
                          <td className="rights-value">{right.ratio}</td>
                        </tr>
                      ))}
                      {(!rightIssues || rightIssues.length === 0) && (
                        <tr>
                          <td colSpan="2" className="text-center text-muted">
                            No rights issues
                          </td>
                        </tr>
                      )}
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

export default CorporateActions;