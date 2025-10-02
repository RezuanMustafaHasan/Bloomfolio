import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import TopNavbar from './components/Navbar.jsx'
import App from './App.jsx';



createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <TopNavbar />
      <Routes>
        
        <Route path="/stocks/:tradingCode" element={<App />} />
      </Routes> 
  </BrowserRouter>
)
