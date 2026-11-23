import React, { useState } from 'react';
import { assignStock } from '../services/adminUsers';

const AssignStock = () => {
  const [form, setForm] = useState({ email: '', tradingCode: '', quantity: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    const quantityNum = Number(form.quantity);
    try {
      const res = await assignStock({ email: form.email.trim(), tradingCode: form.tradingCode.trim(), quantity: quantityNum });
      if (res?.success) {
        setMessage('Stock assigned successfully.');
        setForm({ email: '', tradingCode: '', quantity: 0 });
      } else {
        setError(res?.message || 'Failed to assign stock');
      }
    } catch (_) {
      setError('Failed to assign stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: 640 }}>
      <h2 className="mb-4">Assign Stock to User</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label className="form-label">User Email</label>
          <input type="email" className="form-control" name="email" value={form.email} onChange={onChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Stock Trading Code</label>
          <input type="text" className="form-control" name="tradingCode" value={form.tradingCode} onChange={onChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Quantity</label>
          <input type="number" min="1" className="form-control" name="quantity" value={form.quantity} onChange={onChange} required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Assigning...' : 'Assign Stock'}
        </button>
      </form>
      <p className="mt-3 text-muted">Note: This does not affect purchase power or perform conditional checks.</p>
    </div>
  );
};

export default AssignStock;