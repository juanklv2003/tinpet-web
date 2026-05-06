import { BarChart2, PawPrint, Shield, Users, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

const adminStats = [
  { label: 'Usuarios totales', value: '—', icon: Users, color: 'text-brand' },
  { label: 'Refugios activos', value: '—', icon: PawPrint, color: 'text-emerald-500' },
  { label: 'Adopciones este mes', value: '—', icon: BarChart2, color: 'text-amber-500' },
  { label: 'Incidencias abiertas', value: '—', icon: Shield, color: 'text-sky-500' },
];

const adminSections = [
  { label: 'Usuarios & roles', description: 'Gestiona permisos y accesos de todos los usuarios.' },
  { label: 'Refugios', description: 'Aprueba, suspende o revisa los refugios registrados.' },
  { label: 'Mascotas', description: 'Visión global de todos los animales en la plataforma.' },
  { label: 'Adopciones', description: 'Historial completo de adopciones y solicitudes.' },
  { label: 'Reportes & logs', description: 'Actividad del sistema, errores y auditoría.' },
  { label: 'Configuración', description: 'Ajustes globales de la plataforma.' },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
              <PawPrint className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
              <span className="text-brand">Tin</span>Pet
              <span className="ml-2 text-xs font-semibold bg-brand/10 text-brand rounded-full px-2 py-0.5">Admin</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
              {user?.name ?? 'Administrador'}
            </span>
            <Button variant="ghost" onClick={handleLogout} className="gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 sm:px-8 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ textWrap: 'balance' } as React.CSSProperties}>
            Panel de administración
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visión global y control completo de la plataforma TinPet.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {adminStats.map(stat => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{stat.label}</p>
                  <Icon className={`h-4 w-4 ${stat.color}`} aria-hidden="true" />
                </div>
                <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Sections grid */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
            Módulos de administración
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminSections.map(section => (
              <div
                key={section.label}
                className="group relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 cursor-not-allowed opacity-70 hover:opacity-90 transition-opacity"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{section.label}</p>
                  <span className="rounded-full bg-amber-100 dark:bg-amber-900/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    Próximamente
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{section.description}</p>
                <Settings className="absolute bottom-4 right-4 h-4 w-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>

        {/* Back to landing */}
        <div className="flex justify-center pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
            ← Volver al inicio
          </Button>
        </div>
      </main>
    </div>
  );
}
