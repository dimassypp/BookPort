import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <img 
            src="/images/BookPortLogo.png" 
            alt="BookPort Logo" 
            style={{ height: '40px', objectFit: 'contain' }} 
          />
        </div>
        <div className="footer-links">
          <Link to="/support">Support Center</Link>
          <a href="mailto:support@bookport.com">Gmail</a>
          <a href="https://wa.me/" target="_blank" rel="noopener noreferrer">
            Whatsapp
          </a>
          <a
            href="https://instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          <Link to="/terms">Terms & Condition</Link>
        </div>
      </div>
      <p className="footer-copyright">
        Copyright © 2025 BookPort. All Rights Reserved
      </p>
    </footer>
  );
};

export default Footer;