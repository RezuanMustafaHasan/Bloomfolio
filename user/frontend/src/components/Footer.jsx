import React from "react";
import "./Footer.css";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-item">
            <div className="footer-title">
              Copyright 2017 - {year} © <span className="brand">Bloomfolio</span>
            </div>
            <div className="footer-sub">Version: 3.1.1.2039</div>
          </div>

          <div className="footer-item">
            <div className="footer-title">Legal Services By</div>
            <a href="#" className="footer-link accent" aria-label="Legal Services">
              Rezuan Mustafa Hasan & Associates
            </a>
          </div>

          <div className="footer-item">
            <div className="footer-title">Designed And Developed By</div>
            <a href="#" className="footer-link accent" aria-label="Designed and Developed">
              Bloomfolio Limited
            </a>
          </div>

          <div className="footer-item">
            <div className="footer-title">Official Market Data Provided By</div>
            <a
              href="https://www.dsebd.org/"
              target="_blank"
              rel="noreferrer"
              className="footer-link highlight"
              aria-label="Dhaka Stock Exchange"
            >
              Dhaka Stock Exchange
            </a>
          </div>
        </div>

        <div className="footer-disclaimer">
          <p>
            The information contained in this website is for general information purposes only. The
            information is provided by Bloomfolio Limited and while we endeavour to keep the
            information up to date and correct, we make no representations or warranties of any kind,
            express or implied, about the completeness, accuracy, reliability, suitability or
            availability with respect to the website or the information, products, services or
            related graphics contained in the website for any purpose. Any opinions expressed in this
            website are only those of the source and neither Bloomfolio Limited nor Dhaka Stock
            Exchange Limited (or any other party) shall be responsible for any information or
            implication contained therein. Any reliance you place on such information is therefore
            strictly at your own risk.
          </p>
          <p>
            In no event will Dhaka Stock Exchange Limited be liable for any loss or damage including
            without limitation, indirect or consequential loss or damage, or any loss or damage
            whatsoever (monetary or otherwise) arising from or in connection with this website.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;