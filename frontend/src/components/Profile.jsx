import './Profile.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function Profile() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  //send a post request using axios and get the user data using userId
  return (
    <div className="profile">
      <h1>Profile</h1>
      <div className="container">
        <div className="row">
            <div className="col-6">
                <h3>Purchase Power : {}</h3>
            </div>
            <div className="col-6 add-fund-container">
                <button className="btn btn-primary add-fund-btn" onClick={() => navigate('/money-request')}>Add Funds</button>
            </div>
        </div>
      </div>
      
    </div>
  )
}