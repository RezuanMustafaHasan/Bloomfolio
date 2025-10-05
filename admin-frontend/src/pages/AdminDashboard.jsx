import React, { useEffect, useState } from 'react';
import { listUsers } from '../services/adminAuth';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0 });
  const [loading, setLoading] = useState(true);

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
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;