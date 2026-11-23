import './Footer.css';
export default function Footer(){return <footer className="site-footer" style={{padding:'22px 28px',background:'#111827',color:'#cbd5e1',fontSize:12}}>
  <div style={{display:'flex',justifyContent:'space-between',gap:20,flexWrap:'wrap'}}><span>Bloomfolio · DSE research and simulated trading</span><span>Market data: <a href="https://www.stockchartbd.com/developers.php" target="_blank" rel="noreferrer">DSE Intelligence</a> · <a href="https://www.dsebd.org" target="_blank" rel="noreferrer">dsebd.org</a></span></div>
  <div style={{marginTop:8}}>Quotes show their source date. Virtual orders and balances stay within this app.</div>
</footer>;}
