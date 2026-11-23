import React, { useEffect, useMemo, useState } from 'react';
import { deleteUser, listUsers } from '../services/adminAuth';

const UsersPage = () => {
  const [q, setQ] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listUsers(q);
      setData(res?.data || []);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const onSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (_) {}
  };

  const rows = useMemo(() => data.map((u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    purchasePower: u.purchasePower ?? 0,
    createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
  })), [data]);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Users</h2>
        <form className="d-flex" onSubmit={onSearch}>
          <input className="form-control me-2" type="search" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-outline-primary" type="submit">Search</button>
        </form>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Purchase Power</th>
              <th>Created</th>
              <th style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="5">No users found</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.purchasePower}</td>
                  <td>{r.createdAt}</td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => onDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage;