import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import TopNavbar from './components/Navbar.jsx'
import App from './App.jsx';
import Dashboard from './components/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Profile from './components/Profile.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import MoneyRequest from './pages/MoneyRequest.jsx';
import SectorView from './components/SectorView.jsx';



createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <BrowserRouter>
      <TopNavbar />
      <Routes>
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/Sectors" element={<SectorView />} />
        <Route path="/stocks/:tradingCode" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/money-request" element={<MoneyRequest />} />
        
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)
