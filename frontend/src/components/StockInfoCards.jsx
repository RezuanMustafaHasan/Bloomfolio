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
    return num ? `$${formatNumber(num)}` : 'N/A';
  };

  const latestShareholding = shareholding?.[shareholding.length - 1] || {};

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
                <span className="value">${marketInformation?.openingPrice?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Closing Price:</span>
                <span className="value">${marketInformation?.closingPrice?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Day's Range:</span>
                <span className="value">
                  ${marketInformation?.daysRange?.low?.toFixed(2) || 'N/A'} - ${marketInformation?.daysRange?.high?.toFixed(2) || 'N/A'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">52 Week Range:</span>
                <span className="value">
                  ${marketInformation?.fiftyTwoWeeksMovingRange?.low?.toFixed(2) || 'N/A'} - ${marketInformation?.fiftyTwoWeeksMovingRange?.high?.toFixed(2) || 'N/A'}
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
                <span className="value">${basicInformation?.faceValue || 'N/A'}</span>
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
        <div className="col-md-6 col-lg-4 mb-4">
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
              <div className="shareholding-chart-container">
                <svg width="200" height="200" viewBox="0 0 200 200" className="shareholding-pie-chart">
                  <defs>
                    <linearGradient id="publicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2E5BBA" />
                      <stop offset="100%" stopColor="#1E3A8A" />
                    </linearGradient>
                    <linearGradient id="instituteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60A5FA" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                    <linearGradient id="sponsorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#93C5FD" />
                      <stop offset="100%" stopColor="#60A5FA" />
                    </linearGradient>
                    <linearGradient id="foreignGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#DBEAFE" />
                      <stop offset="100%" stopColor="#BFDBFE" />
                    </linearGradient>
                  </defs>
                  
                  {(() => {
                    const centerX = 100;
                    const centerY = 100;
                    const radius = 80;
                    
                    const publicShare = latestShareholding?.public || 0;
                    const instituteShare = latestShareholding?.institute || 0;
                    const sponsorShare = latestShareholding?.sponsorDirector || 0;
                    const foreignShare = latestShareholding?.foreign || 0;
                    const governmentShare = latestShareholding?.government || 0;
                    
                    const total = publicShare + instituteShare + sponsorShare + foreignShare + governmentShare;
                    
                    let currentAngle = -90; // Start from top
                    const segments = [];
                    
                    const createSegment = (value, color, label) => {
                      if (value <= 0) return null;
                      
                      const percentage = (value / total) * 100;
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
                      
                      return {
                        path: pathData,
                        color: color,
                        label: label,
                        percentage: percentage.toFixed(2)
                      };
                    };
                    
                    if (publicShare > 0) segments.push(createSegment(publicShare, 'url(#publicGradient)', 'Public'));
                    if (instituteShare > 0) segments.push(createSegment(instituteShare, 'url(#instituteGradient)', 'Institute'));
                    if (sponsorShare > 0) segments.push(createSegment(sponsorShare, 'url(#sponsorGradient)', 'Sponsor/Director'));
                    if (foreignShare > 0) segments.push(createSegment(foreignShare, 'url(#foreignGradient)', 'Foreign'));
                    if (governmentShare > 0) segments.push(createSegment(governmentShare, '#E5E7EB', 'Government'));
                    
                    return segments.filter(Boolean).map((segment, index) => (
                      <path
                        key={index}
                        d={segment.path}
                        fill={segment.color}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="pie-segment"
                      />
                    ));
                  })()}
                </svg>
                
                {/* Legend */}
                <div className="shareholding-legend">
                  {latestShareholding?.public > 0 && (
                    <div className="legend-item">
                      <div className="legend-color" style={{background: 'linear-gradient(135deg, #2E5BBA, #1E3A8A)'}}></div>
                      <span className="legend-label">Public</span>
                      <span className="legend-value">{latestShareholding.public.toFixed(2)}%</span>
                    </div>
                  )}
                  {latestShareholding?.institute > 0 && (
                    <div className="legend-item">
                      <div className="legend-color" style={{background: 'linear-gradient(135deg, #60A5FA, #3B82F6)'}}></div>
                      <span className="legend-label">Institute</span>
                      <span className="legend-value">{latestShareholding.institute.toFixed(2)}%</span>
                    </div>
                  )}
                  {latestShareholding?.sponsorDirector > 0 && (
                    <div className="legend-item">
                      <div className="legend-color" style={{background: 'linear-gradient(135deg, #93C5FD, #60A5FA)'}}></div>
                      <span className="legend-label">Sponsor/Director</span>
                      <span className="legend-value">{latestShareholding.sponsorDirector.toFixed(2)}%</span>
                    </div>
                  )}
                  {latestShareholding?.foreign > 0 && (
                    <div className="legend-item">
                      <div className="legend-color" style={{background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)'}}></div>
                      <span className="legend-label">Foreign</span>
                      <span className="legend-value">{latestShareholding.foreign.toFixed(2)}%</span>
                    </div>
                  )}
                  {latestShareholding?.government > 0 && (
                    <div className="legend-item">
                      <div className="legend-color" style={{backgroundColor: '#E5E7EB'}}></div>
                      <span className="legend-label">Government</span>
                      <span className="legend-value">{latestShareholding.government.toFixed(2)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockInfoCards;