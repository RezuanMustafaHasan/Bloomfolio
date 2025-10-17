import React, { useEffect, useMemo, useState } from 'react';
import { acceptRequest, listRequests, modifyRequest, rejectRequest } from '../services/adminRequests';

const AdminRequests = () => {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('Pending');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState({}); // id -> newAmount

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await listRequests({ status, q });
      setData(res?.data || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [status]);

  const rows = useMemo(() => data.map(r => ({
    id: r._id,
    transactionId: r.transactionId,
    amount: r.requestedAmount,
    status: r.status,
    createdAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
  })), [data]);

  const onSearch = (e) => { e.preventDefault(); fetchRequests(); };

  const doAccept = async (id) => { await acceptRequest(id); fetchRequests(); };
  const doReject = async (id) => {
    const reason = prompt('Reason for rejection?') || '';
    await rejectRequest(id, reason);
    fetchRequests();
  };
  const startEdit = (id, amount) => setEditing({ ...editing, [id]: amount });
  const changeEdit = (id, val) => setEditing({ ...editing, [id]: val });
  const saveEdit = async (id) => {
    const valNum = Number(editing[id]);
    if (!Number.isFinite(valNum) || valNum <= 0) return alert('Enter a positive number');
    await modifyRequest(id, valNum);
    setEditing({ ...editing, [id]: undefined });
    fetchRequests();
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Money Requests</h2>
        <form className="d-flex" onSubmit={onSearch}>
          <input className="form-control me-2" type="search" placeholder="Search by TX ID" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-outline-primary" type="submit">Search</button>
        </form>
      </div>

      <div className="mb-3">
        <label className="form-label me-2">Status:</label>
        <select className="form-select" style={{ maxWidth: 220 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Pending">Pending</option>
          <option value="Modified">Modified</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead><tr><th>Transaction ID</th><th>Amount</th><th>Status</th><th>Created</th><th style={{ width: 240 }}>Actions</th></tr></thead>
          <tbody>
          {loading ? (
            <tr><td colSpan="5">Loading...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan="5">No requests</td></tr>
          ) : rows.map(r => (
            <tr key={r.id}>
              <td>{r.transactionId}</td>
              <td>
                {editing[r.id] !== undefined ? (
                  <div className="d-flex">
                    <input type="number" className="form-control me-2" style={{ maxWidth: 160 }} value={editing[r.id]} onChange={(e) => changeEdit(r.id, e.target.value)} />
                    <button className="btn btn-sm btn-success me-2" onClick={() => saveEdit(r.id)}>Save</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setEditing({ ...editing, [r.id]: undefined })}>Cancel</button>
                  </div>
                ) : (
                  r.amount
                )}
              </td>
              <td>{r.status}</td>
              <td>{r.createdAt}</td>
              <td>
                <button className="btn btn-sm btn-primary me-2" onClick={() => doAccept(r.id)}>Accept</button>
                <button className="btn btn-sm btn-danger me-2" onClick={() => doReject(r.id)}>Reject</button>
                {editing[r.id] === undefined && (
                  <button className="btn btn-sm btn-warning" onClick={() => startEdit(r.id, r.amount)}>Modify Amount</button>
                )}
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRequests;