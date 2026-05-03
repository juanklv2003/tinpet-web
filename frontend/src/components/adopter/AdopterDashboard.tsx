import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdopterDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="max-w-2xl w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2">Panel de adoptante</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Bienvenido, {user?.name ?? 'Adoptante'}.</p>
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-emerald-500 text-white rounded" onClick={() => navigate('/')}>Ir al feed</button>
          <button className="px-3 py-2 bg-red-500 text-white rounded" onClick={() => { logout(); navigate('/auth'); }}>Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}
