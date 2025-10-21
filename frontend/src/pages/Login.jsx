import React, { useState } from "react";
import "./SignUpLogIn.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../ui/AuthModal";

function Login() {
  const navigate = useNavigate();
  const [value, setValue] = useState({ email: "", password: "" });
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(value.email, value.password);
      navigate("/Dashboard");
    } catch (error) {
      alert("Error occured when log in. Please try again later!");
    }
  };

  return (
    <AuthModal title="Log In">
      <form onSubmit={handleSubmit}>
        <div className="auth-grid">
          <div>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={value.email}
                onChange={(e) => setValue({ ...value, email: e.target.value })}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={value.password}
                onChange={(e) => setValue({ ...value, password: e.target.value })}
                placeholder="Enter password"
                required
              />
            </div>
            <div className="auth-actions">
              <button type="submit" className="btn-modern-primary">Log In</button>
              <button type="button" className="btn-modern-secondary" onClick={() => navigate('/Dashboard')}>Cancel</button>
              <button type="button" className="btn-modern-secondary" onClick={() => navigate('/signup')}>Go to Sign Up</button>
            </div>
          </div>
          <div>
            <p className="text-muted" style={{marginTop: 6}}>
              Use your existing credentials to access trading and portfolio.
            </p>
          </div>
        </div>
      </form>
    </AuthModal>
  );
}

export default Login;