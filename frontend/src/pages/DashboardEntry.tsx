import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ShelterDashboard from '../components/shelter/ShelterDashboard';
import AdopterDashboard from '../components/adopter/AdopterDashboard';
import AdminDashboard from '../components/admin/AdminDashboard';

export default function DashboardEntry() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  // Redirect to role-scoped dashboard paths so the URL reflects the role
  switch (user.role) {
    case 'shelter':
      return <Navigate to="/shelter/pets" replace />;
    case 'adopter':
      return <Navigate to="/adopter/dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/shelter/dashboard" replace />;
  }
}
