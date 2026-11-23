import React, { useState } from 'react';
import './SignUpLogIn.css';
import { useNavigate } from 'react-router-dom';
import { signup as signupApi } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../ui/AuthModal';

const Signup = () => {
  const navigate = useNavigate();
  const { login, checkAuth } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signupApi(form);
      if (res?.success) {
        login();
        checkAuth();
        navigate('/Dashboard');
      } else {
        alert(res?.message || 'Sign up failed. Please try again later!');
      }
    } catch (err) {
      alert('Sign up failed. Please try again later!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthModal title="Sign Up">
      <form onSubmit={onSubmit}>
        <div className="auth-grid">
          <div>
            <div className="mb-3">
              <label className="form-label" htmlFor="name">Name</label>
              <input type="text" id="name" name="name" value={form.name} onChange={onChange} className="form-control" placeholder="Your name" required />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="email">Email</label>
              <input type="email" id="email" name="email" value={form.email} onChange={onChange} className="form-control" placeholder="you@example.com" required />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="password">Password</label>
              <input type="password" id="password" name="password" value={form.password} onChange={onChange} className="form-control" placeholder="Create a password" required />
            </div>
            <div className="auth-actions">
              <button className="btn-modern-primary" type="submit" disabled={loading}>
                {loading ? 'Signing up...' : 'Create Account'}
              </button>
              <button type="button" className="btn-modern-secondary" onClick={() => navigate('/Dashboard')}>Cancel</button>
              <button type="button" className="btn-modern-secondary" onClick={() => navigate('/login')}>Go to Log In</button>
            </div>
          </div>
          <div>
            <p className="text-muted" style={{marginTop: 6}}>
              Create an account to place trades and manage portfolio.
            </p>
          </div>
        </div>
      </form>
    </AuthModal>
  );
};

export default Signup;