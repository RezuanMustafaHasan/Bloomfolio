import React, { useEffect, useState } from 'react';
import { submitRequest, myRequests } from '../services/requests';

const MoneyRequest = () => {
  const [form, setForm] = useState({ requestedAmount: '', transactionId: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [list, setList] = useState([]);

  const loadMine = async () => {
    try {
      const res = await myRequests();
      setList(res?.data || []);
    } catch (_) {}
  };

  useEffect(() => { loadMine(); }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const amountNum = Number(form.requestedAmount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError('Amount must be a positive number');
      return;
    }
    try {
      const res = await submitRequest({ requestedAmount: amountNum, transactionId: form.transactionId.trim() });
      if (res?.success) {
        setSuccess('Request submitted');
        setForm({ requestedAmount: '', transactionId: '' });
        loadMine();
      } else {
        setError(res?.message || 'Submission failed');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Submission failed';
      setError(msg);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Submit Money Request</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={onSubmit} className="mb-4" style={{ maxWidth: 480 }}>
        <div className="mb-3">
          <label className="form-label">Requested Amount</label>
          <input type="number" className="form-control" name="requestedAmount" value={form.requestedAmount} onChange={onChange} required min="0.01" step="0.01" />
        </div>
        <div className="mb-3">
          <label className="form-label">Transaction ID</label>
          <input type="text" className="form-control" name="transactionId" value={form.transactionId} onChange={onChange} required />
        </div>
        <button type="submit" className="btn btn-primary">Submit Request</button>
      </form>

      <h3 className="mb-2">My Requests</h3>
      <div className="table-responsive">
        <table className="table table-striped">
          <thead><tr><th>Transaction ID</th><th>Amount</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan="4">No requests yet</td></tr>
            ) : list.map(r => (
              <tr key={r._id}>
                <td>{r.transactionId}</td>
                <td>{r.requestedAmount}</td>
                <td>{r.status}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MoneyRequest;