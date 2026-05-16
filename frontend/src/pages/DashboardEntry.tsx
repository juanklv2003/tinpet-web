import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardEntry() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!user) return <Navigate to="/" replace />;

  // Redirect to role-scoped dashboard paths so the URL reflects the role
  switch (user.role) {
    case 'shelter':
      return <Navigate to="/pets" replace />;
    case 'vet':
      return <Navigate to="/vet/pets" replace />;
    case 'adopter':
      return <Navigate to="/adopter/dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
}
