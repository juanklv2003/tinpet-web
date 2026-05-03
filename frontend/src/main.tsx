import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import LandingPage from './pages/landing/LandingPage.tsx'
import DashboardEntry from './pages/DashboardEntry'
import ShelterDashboard from './components/shelter/ShelterDashboard.tsx'
import AdopterDashboard from './components/adopter/AdopterDashboard'
import AdminDashboard from './components/admin/AdminDashboard'
import { AuthProvider } from './context/AuthContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardEntry />} />
          <Route path="/shelter/pets" element={<ShelterDashboard initialView="pets" />} />
          <Route path="/shelter/dashboard" element={<ShelterDashboard initialView="monitoring" />} />
          <Route path="/shelter/employees" element={<ShelterDashboard initialView="employees" />} />
          <Route path="/shelter/requests" element={<ShelterDashboard initialView="matches" />} />
          <Route path="/shelter/chat" element={<ShelterDashboard initialView="chat" />} />
          <Route path="/shelter/profile" element={<ShelterDashboard initialView="profile" />} />
          <Route path="/adopter/dashboard" element={<AdopterDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* Legacy redirect — /auth apunta al nuevo landing */}
          <Route path="/auth" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)