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
import { FloatingAssistant } from './components/assistant/FloatingAssistant'
import { RequireAuth } from './components/RequireAuth'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardEntry />
              </RequireAuth>
            }
          />
          <Route
            path="/shelter/pets"
            element={
              <RequireAuth>
                <ShelterDashboard initialView="pets" />
              </RequireAuth>
            }
          />
          <Route
            path="/shelter/dashboard"
            element={
              <RequireAuth>
                <ShelterDashboard initialView="monitoring" />
              </RequireAuth>
            }
          />
          <Route
            path="/shelter/employees"
            element={
              <RequireAuth>
                <ShelterDashboard initialView="employees" />
              </RequireAuth>
            }
          />
          <Route
            path="/shelter/requests"
            element={
              <RequireAuth>
                <ShelterDashboard initialView="matches" />
              </RequireAuth>
            }
          />
          <Route
            path="/shelter/chat"
            element={
              <RequireAuth>
                <ShelterDashboard initialView="chat" />
              </RequireAuth>
            }
          />
          <Route
            path="/shelter/profile"
            element={
              <RequireAuth>
                <ShelterDashboard initialView="profile" />
              </RequireAuth>
            }
          />
          <Route
            path="/adopter/dashboard"
            element={
              <RequireAuth>
                <AdopterDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <RequireAuth>
                <AdminDashboard />
              </RequireAuth>
            }
          />
          {/* Legacy redirect — /auth apunta al nuevo landing */}
          <Route path="/auth" element={<Navigate to="/" replace />} />
        </Routes>
        <FloatingAssistant />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)