import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import LandingPage from './pages/landing/LandingPage.tsx'
import DashboardEntry from './pages/DashboardEntry'
import ShelterDashboard from './components/shelter/ShelterDashboard.tsx'
import VetDashboard from './components/VetDashboard.tsx'
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
            path="/login-gateway"
            element={
              <RequireAuth>
                <DashboardEntry />
              </RequireAuth>
            }
          />
          <Route
            path="/pets"
            element={
              <RequireAuth>
                <ShelterDashboard initialView="pets" />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <ShelterDashboard initialView="monitoring" />
              </RequireAuth>
            }
          />
          <Route
            path="/employees"
            element={
              <RequireAuth>
                <ShelterDashboard initialView="employees" />
              </RequireAuth>
            }
          />
          <Route
            path="/requests"
            element={
              <RequireAuth>
                <ShelterDashboard initialView="matches" />
              </RequireAuth>
            }
          />
          <Route
            path="/chat"

            element={
              <RequireAuth>
                <ShelterDashboard initialView="chat" />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ShelterDashboard initialView="profile" />
              </RequireAuth>
            }
          />
          <Route
            path="/reviews"
            element={
              <RequireAuth>
                <ShelterDashboard initialView="reviews" />
              </RequireAuth>
            }
          />
          <Route
            path="/vet/pets"
            element={
              <RequireAuth>
                <VetDashboard initialView="pets" />
              </RequireAuth>
            }
          />
          <Route
            path="/vet/dashboard"
            element={
              <RequireAuth>
                <VetDashboard initialView="monitoring" />
              </RequireAuth>
            }
          />
          <Route
            path="/vet/employees"
            element={
              <RequireAuth>
                <VetDashboard initialView="employees" />
              </RequireAuth>
            }
          />
          <Route
            path="/vet/requests"
            element={
              <RequireAuth>
                <VetDashboard initialView="matches" />
              </RequireAuth>
            }
          />
          <Route
            path="/vet/chat"
            element={
              <RequireAuth>
                <VetDashboard initialView="chat" />
              </RequireAuth>
            }
          />
          <Route
            path="/vet/profile"
            element={
              <RequireAuth>
                <VetDashboard initialView="profile" />
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
