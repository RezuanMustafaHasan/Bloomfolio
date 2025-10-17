import './Profile.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Profile() {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [user, setUser] = useState(null); // store the object here
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let ignore = false;

    (async () => {
      try {
        setError(null);
        const res = await axios.get(`http://localhost:8080/users/${userId}`, {
          withCredentials: true, // send auth cookie
        });
        const profile = res.data; // the user object
        // console.log('Fetched profile:', profile);
        if (!ignore) setUser(profile);
      } catch (e) {
        if (!ignore) setError('Failed to load profile');
        if (e?.response?.status === 401) navigate('/login');
      }
    })();

    return () => { ignore = true; };
  }, [userId, navigate]);

  return (
    <div className="profile">
      <h1>Profile</h1>
      <div className="container">
        <div className="row">
            <div className="col-6">
                <h3>Purchase Power : {user?.purchasePower ?? '—'}</h3>
            </div>
            <div className="col-6 add-fund-container">
                <button className="btn btn-primary add-fund-btn" onClick={() => navigate('/money-request')}>Add Funds</button>
            </div>
        </div>
        {error && <p className="text-danger">{error}</p>}
      </div>
    </div>
  );
}