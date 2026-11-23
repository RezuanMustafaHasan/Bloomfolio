import './FinancialPerformance.css';
export default function FinancialPerformance({stockData}) {
  const performance=stockData.financialPerformance || {};
  const fmt=n=>n==null?'—':Number(n).toLocaleString(undefined,{maximumFractionDigits:2});
  return <section className="financial-performance" data-testid="financial-performance"><div className="card performance-card">
    <div className="card-header"><h5>Financial Performance</h5></div><div className="card-body">
      <h6>Annual earnings and valuation</h6><div className="table-responsive"><table className="table performance-table"><thead><tr><th>Year</th><th>EPS (৳)</th><th>NAV/share (৳)</th><th>Profit (mn ৳)</th><th>Year-end P/E</th><th>Dividend %</th></tr></thead><tbody>
        {(performance.yearly || []).map(r=><tr key={r.year}><td>{r.year}</td><td>{fmt(r.eps)}</td><td>{fmt(r.nav_per_share)}</td><td>{fmt(r.profit_mn)}</td><td>{fmt(r.pe_at_year_end)}</td><td>{fmt(r.dividend_percent)}</td></tr>)}
      </tbody></table></div>
      <h6>Interim earnings per share</h6><table className="table performance-table"><thead><tr><th>Year</th><th>Period</th><th>EPS (৳)</th></tr></thead><tbody>
        {(performance.interimEPS || []).map((r,i)=><tr key={i}><td>{r.year}</td><td>{r.period}</td><td>{fmt(r.basic)}</td></tr>)}
      </tbody></table>
    </div></div></section>;
}
