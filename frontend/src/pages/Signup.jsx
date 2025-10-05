import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup as signupApi } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import './SignUpLogIn.css';

const Signup = () => {
  const navigate = useNavigate();
  const { login, checkAuth } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signupApi(form);
      if (res?.success) {
        // backend sets cookie; mark as logged in
        login();
        checkAuth();
        navigate('/Dashboard');
      } else {
        setError(res?.message || 'Signup failed');
      }
    } catch (err) {
      setError('Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-login">
      <div className="container mx-auto" style={{ maxWidth: 480 }}>
      <h2 className="mb-3">Sign Up</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input type="text" name="name" value={form.name} onChange={onChange} className="form-control" required />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input type="email" name="email" value={form.email} onChange={onChange} className="form-control" required />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input type="password" name="password" value={form.password} onChange={onChange} className="form-control" required />
        </div>
        <button className="btn btn-success" type="submit" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      </div>
    </div>
  );
};

export default Signup;