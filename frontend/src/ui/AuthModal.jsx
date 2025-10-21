import React from 'react';
import './AuthModal.css';

const AuthModal = ({ title, children }) => {
  return (
    <div className="auth-overlay">
      <div className="auth-dialog">
        <div className="auth-header">
          <h4 className="auth-title">{title}</h4>
        </div>
        <div className="auth-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;