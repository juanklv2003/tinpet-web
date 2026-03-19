import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import AuthPage from './components/AuthPage.tsx'
import ShelterDashboard from './components/shelter/ShelterDashboard.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/dashboard" element={<ShelterDashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)