import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
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
import AIFinancialAdvisor from './pages/AIFinancialAdvisor.jsx';
import Footer from './components/Footer.jsx';



createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <BrowserRouter>
      <TopNavbar />
      <div style={{ flex: '1 0 auto' }}>
        <Routes>
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/Sectors" element={<SectorView />} />
          <Route path="/stocks/:tradingCode" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/money-request" element={<MoneyRequest />} />
          <Route path="/ai-advisor" element={<AIFinancialAdvisor />} />
          // new default redirect from root
          <Route path="/" element={<Navigate to="/Dashboard" replace />} />
        </Routes>
      </div>
      <Footer />
    </BrowserRouter>
  </AuthProvider>
)
