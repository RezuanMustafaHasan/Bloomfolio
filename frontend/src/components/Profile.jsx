import './Profile.css';
export default function Profile() {
  return (
    <div className="profile">
      <h1>Profile</h1>
      <div className="container">
        <div className="row">
            <div className="col-6">
                <h3>Purchase Power : $100000</h3>
            </div>
            <div className="col-6 add-fund-container">
                <button className="btn btn-primary add-fund-btn">Add Funds</button>
            </div>
        </div>
      </div>
      
    </div>
  )
}