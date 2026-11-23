import React from 'react';
import './StockInfoCards.css';

const StockInfoCards = ({ stockData }) => {
  const { marketInformation, basicInformation, financialHighlights, shareholding } = stockData;
  
  const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num?.toString() || 'N/A';
  };

  const formatCurrency = (num) => {
    return num ? ` ৳${formatNumber(num)}` : 'N/A';
  };

  const latestShareholding = shareholding?.[shareholding.length - 1] || {};
  // Compute last three entries (most recent)
  const lastThreeYears = (() => {
    if (!Array.isArray(shareholding) || shareholding.length === 0) return [];
    // Sort by date descending and take the last 3 entries
    return shareholding
      .filter(s => s?.asOn) // Only entries with valid dates
      .sort((a, b) => new Date(b.asOn) - new Date(a.asOn)) // Sort newest first
      .slice(0, 3); // Take top 3
  })();

  return (
    <div className="stock-info-cards">
      <div className="row">
        {/* Market Information Card */}
        <div className="col-md-6 col-lg-4 mb-4">
          <div className="card info-card">
            <div className="card-header">
              <h5>Market Information</h5>
            </div>
            <div className="card-body">
              <div className="info-item">
                <span className="label">Opening Price:</span>
                <span className="value"> ৳{marketInformation?.openingPrice?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Closing Price:</span>
                <span className="value"> ৳{marketInformation?.closingPrice?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Day's Range:</span>
                <span className="value">
                   ৳{marketInformation?.daysRange?.low?.toFixed(2) || 'N/A'} -  ৳{marketInformation?.daysRange?.high?.toFixed(2) || 'N/A'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">52 Week Range:</span>
                <span className="value">
                   ৳{marketInformation?.fiftyTwoWeeksMovingRange?.low?.toFixed(2) || 'N/A'} -  ৳{marketInformation?.fiftyTwoWeeksMovingRange?.high?.toFixed(2) || 'N/A'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Volume:</span>
                <span className="value">{formatNumber(marketInformation?.daysVolume)}</span>
              </div>
              <div className="info-item">
                <span className="label">Market Cap:</span>
                <span className="value">{formatCurrency(marketInformation?.marketCapitalization)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information Card */}
        <div className="col-md-6 col-lg-4 mb-4">
          <div className="card info-card">
            <div className="card-header">
              <h5>Basic Information</h5>
            </div>
            <div className="card-body">
              <div className="info-item">
                <span className="label">Face Value:</span>
                <span className="value"> ৳{basicInformation?.faceValue || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Market Lot:</span>
                <span className="value">{basicInformation?.marketLot || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Listing Year:</span>
                <span className="value">{basicInformation?.listingYear || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Market Category:</span>
                <span className="value">{basicInformation?.marketCategory || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Instrument Type:</span>
                <span className="value">{basicInformation?.typeOfInstrument || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Outstanding Securities:</span>
                <span className="value">{formatNumber(basicInformation?.totalOutstandingSecurities)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Highlights Card */}
        <div className="col-md-6 col-lg-4 mb-4">
          <div className="card info-card">
            <div className="card-header">
              <h5>Financial Highlights</h5>
            </div>
            <div className="card-body">
              <div className="info-item">
                <span className="label">Authorized Capital:</span>
                <span className="value">{formatCurrency(basicInformation?.authorizedCapital)}</span>
              </div>
              <div className="info-item">
                <span className="label">Paid Up Capital:</span>
                <span className="value">{formatCurrency(basicInformation?.paidUpCapital)}</span>
              </div>
              <div className="info-item">
                <span className="label">Year End:</span>
                <span className="value">{financialHighlights?.yearEnd || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Long Term Loan:</span>
                <span className="value">{formatCurrency(financialHighlights?.loanStatus?.longTermLoan)}</span>
              </div>
              <div className="info-item">
                <span className="label">Short Term Loan:</span>
                <span className="value">{formatCurrency(financialHighlights?.loanStatus?.shortTermLoan)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shareholding Pattern Card */}
        <div className="col-md-6 col-lg-12 mb-4">
          <div className="card info-card">
            <div className="card-header">
              <h5>Shareholding Pattern</h5>
              <small className="text-muted">
                {latestShareholding?.asOn ? new Date(latestShareholding.asOn).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                }) : 'Jun 30, 2025'}
              </small>
            </div>
            <div className="card-body">
              {/* Multi-year charts */}
              <div className="shareholding-multiyear">
                {lastThreeYears.length > 0 ? (
                  lastThreeYears.map((entry, index) => (
                    <div className="shareholding-chart-item col-4" key={`${entry.asOn}-${index}`}>
                      <div className="shareholding-date">
                        {entry?.asOn ? new Date(entry.asOn).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        }) : '—'}
                      </div>
                      <svg width="160" height="160" viewBox="0 0 200 200" className="shareholding-pie-chart">
                        <defs>
                          <linearGradient id={`publicGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2E5BBA" />
                            <stop offset="100%" stopColor="#1E3A8A" />
                          </linearGradient>
                          <linearGradient id={`instituteGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#60A5FA" />
                            <stop offset="100%" stopColor="#3B82F6" />
                          </linearGradient>
                          <linearGradient id={`sponsorGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#93C5FD" />
                            <stop offset="100%" stopColor="#60A5FA" />
                          </linearGradient>
                          <linearGradient id={`foreignGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#DBEAFE" />
                            <stop offset="100%" stopColor="#BFDBFE" />
                          </linearGradient>
                        </defs>
                        {(() => {
                          const centerX = 100;
                          const centerY = 100;
                          const radius = 80;
                          const publicShare = entry?.public || 0;
                          const instituteShare = entry?.institute || 0;
                          const sponsorShare = entry?.sponsorDirector || 0;
                          const foreignShare = entry?.foreign || 0;
                          const governmentShare = entry?.government || 0;
                          const total = publicShare + instituteShare + sponsorShare + foreignShare + governmentShare || 1;
                          let currentAngle = -90; // Start from top
                          const segments = [];
                          const createSegment = (value, color) => {
                            if (value <= 0) return null;
                            const angle = (value / total) * 360;
                            const startAngle = currentAngle;
                            const endAngle = currentAngle + angle;
                            const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
                            const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
                            const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
                            const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
                            const largeArcFlag = angle > 180 ? 1 : 0;
                            const pathData = [
                              `M ${centerX} ${centerY}`,
                              `L ${startX} ${startY}`,
                              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                              'Z'
                            ].join(' ');
                            currentAngle = endAngle;
                            return (
                              <path
                                d={pathData}
                                fill={color}
                                stroke="#ffffff"
                                strokeWidth="2"
                                className="pie-segment"
                              />
                            );
                          };
                          if (publicShare > 0) segments.push(createSegment(publicShare, `url(#publicGradient-${index})`));
                          if (instituteShare > 0) segments.push(createSegment(instituteShare, `url(#instituteGradient-${index})`));
                          if (sponsorShare > 0) segments.push(createSegment(sponsorShare, `url(#sponsorGradient-${index})`));
                          if (foreignShare > 0) segments.push(createSegment(foreignShare, `url(#foreignGradient-${index})`));
                          if (governmentShare > 0) segments.push(createSegment(governmentShare, '#92b4f9ff'));
                          return segments.filter(Boolean);
                        })()}
                      </svg>
                      <div className="shareholding-mini-legend">
                        {entry?.public > 0 && (
                          <div className="legend-item ">
                            <div className="legend-color" style={{background: 'linear-gradient(135deg, #2E5BBA, #1E3A8A)'}}></div>
                            <span className="legend-label">Public</span>
                            <span className="legend-value">{(entry.public).toFixed(2)}%</span>
                          </div>
                        )}
                        {entry?.institute > 0 && (
                          <div className="legend-item">
                            <div className="legend-color" style={{background: 'linear-gradient(135deg, #60A5FA, #3B82F6)'}}></div>
                            <span className="legend-label">Institute</span>
                            <span className="legend-value">{(entry.institute).toFixed(2)}%</span>
                          </div>
                        )}
                        {entry?.sponsorDirector > 0 && (
                          <div className="legend-item">
                            <div className="legend-color" style={{background: 'linear-gradient(135deg, #93C5FD, #60A5FA)'}}></div>
                            <span className="legend-label">Sponsor/Director</span>
                            <span className="legend-value">{(entry.sponsorDirector).toFixed(2)}%</span>
                          </div>
                        )}
                        {entry?.foreign > 0 && (
                          <div className="legend-item">
                            <div className="legend-color" style={{background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)'}}></div>
                            <span className="legend-label">Foreign</span>
                            <span className="legend-value">{(entry.foreign).toFixed(2)}%</span>
                          </div>
                        )}
                        {entry?.government > 0 && (
                          <div className="legend-item">
                            <div className="legend-color" style={{backgroundColor: '#92b4f9ff'}}></div>
                            <span className="legend-label">Government</span>
                            <span className="legend-value">{(entry.government).toFixed(2)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted">No shareholding data available</div>
                )}
              </div> 
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockInfoCards;