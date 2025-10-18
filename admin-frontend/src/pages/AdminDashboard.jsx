import React, { useEffect, useState } from 'react';
import { listUsers } from '../services/adminAuth';
import { deleteAllOrders } from '../services/adminOrders';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await listUsers('');
        setStats({ users: res?.count || 0 });
      } catch (_) {}
      setLoading(false);
    };
    fetchStats();
  }, []);

  const onDeleteAllOrders = async () => {
    setMessage('');
    setError('');
    const confirmText = prompt('Type DELETE to confirm deleting ALL orders');
    if (confirmText !== 'DELETE') return;
    try {
      const res = await deleteAllOrders();
      if (res?.success) {
        setMessage(`Deleted ${res.deletedCount || 0} orders.`);
      } else {
        setError(res?.message || 'Failed to delete orders');
      }
    } catch (_) {
      setError('Failed to delete orders');
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Admin Dashboard</h2>
      {loading ? (
        <div>Loading overview...</div>
      ) : (
        <div className="row g-3">
          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Total Users</h5>
                <p className="card-text display-6">{stats.users}</p>
              </div>
            </div>
          </div>

          <div className="col-md-8">
            <div className="card border-danger">
              <div className="card-body">
                <h5 className="card-title text-danger">Danger Zone</h5>
                <p className="card-text">Delete all data from the Orders collection.</p>
                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}
                <button className="btn btn-outline-danger" onClick={onDeleteAllOrders}>Delete All Orders</button>
                <p className="mt-2 text-muted">This action is irreversible. Use with caution.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;