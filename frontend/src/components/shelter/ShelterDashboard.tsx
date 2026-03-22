import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import { useTheme } from './hooks/useTheme';
import { useShelterDashboardLogic } from './hooks/useShelterDashboardLogic';
import { IconPaw, IconChart, IconHeart, IconTeam, IconUser, IconPlus, IconChat } from './Icons';
import { PawPrint } from 'lucide-react';
import { AddPetModal } from './modals/AddPetModal';
import { PetProfileModal } from './modals/PetProfileModal';
import { PetsView } from './views/PetsView';
import { MonitoringView } from './views/MonitoringView';
import { MatchesView } from './views/MatchesView';
import { EmployeesView } from './views/EmployeesView';
import { ProfileView } from './views/ProfileView';
import { ChatView } from './views/ChatView';

import type { ActiveView } from './types';

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function ShelterDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // ─── Dark mode ────────────────────────────────────────────────────────────
  const { isDarkMode, toggleDarkMode } = useTheme();

  const {
    activeView,
    setActiveView,
    sidebarOpen,
    setSidebarOpen,
    pets,
    setPets,
    loading,
    error,
    isAddModalOpen,
    setIsAddModalOpen,
    selectedPet,
    setSelectedPet,
    profileForm,
    profileDirty,
    profileSaveMsg,
    profileError,
    updateProfileField,
    handleProfilePhotoSelect,
    saveProfile,
    handleAddPet,
    handleDeletePet,
    stats,
    statsLoading,
    statsError,
    matches,
    matchesLoading,
    matchesError,
    handleAcceptMatch,
    handleRejectMatch,
    employees,
    employeesLoading,
    employeesError,
    handleAddEmployee,
  } = useShelterDashboardLogic(user);

  // ─── Cerrar sesión ────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  // ─── Nav item helper ──────────────────────────────────────────────────────
  const NavItem = ({
    view,
    icon,
    label,
  }: {
    view: ActiveView;
    icon: React.ReactNode;
    label: string;
  }) => (
    <button
      type="button"
      onClick={() => { setActiveView(view); setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
        ${
          activeView === view
            ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50'
        }`}
    >
      {icon}
      {label}
    </button>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* BOTÓN MENÚ MÓVIL */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* OVERLAY MÓVIL */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:relative z-50 lg:z-auto
        w-64 shrink-0 h-full 
        flex flex-col gap-3 p-4 
        bg-gray-50 dark:bg-gray-900 
        border-r border-gray-100 dark:border-gray-800 
        overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="px-3 py-2 mb-2 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-rose-500" />
            TinPet
          </h1>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="px-3 text-xs text-gray-400 mt-0.5 truncate lg:hidden">
          {user?.name || 'Refugio'}
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-2 space-y-0.5">
          <p className="px-3 pt-1 pb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            General
          </p>
          <NavItem view="pets" icon={<IconPaw />} label="Mascotas" />
          <NavItem view="monitoring" icon={<IconChart />} label="Monitorización" />
          <NavItem view="matches" icon={<IconHeart />} label="Solicitudes" />
          <NavItem view="employees" icon={<IconTeam />} label="Empleados" />
          <NavItem view="chat" icon={<IconChat />} label="Chat" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-2 space-y-0.5">
          <p className="px-3 pt-1 pb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Ajustes
          </p>
          <NavItem view="profile" icon={<IconUser />} label="Mi Perfil" />
          <button
            type="button"
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
              </svg>
            )}
            {isDarkMode ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-8 max-w-6xl mx-auto">
          <div className="mb-6 lg:mb-8 flex items-center justify-between">
            <div className="pl-12 lg:pl-0">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                {activeView === 'pets' && 'Lista de Mascotas'}
                {activeView === 'monitoring' && 'Monitorización'}
                {activeView === 'matches' && 'Solicitudes'}
                {activeView === 'employees' && 'Empleados'}
                {activeView === 'chat' && 'Chat'}
                {activeView === 'profile' && 'Mi Perfil'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {activeView === 'pets' && `${pets.length} mascota${pets.length !== 1 ? 's' : ''}`}
                {activeView === 'monitoring' && 'Estadísticas del refugio'}
                {activeView === 'matches' && `${matches.length} solicitud${matches.length !== 1 ? 'es' : ''}`}
                {activeView === 'employees' && `${employees.length} empleado${employees.length !== 1 ? 's' : ''}`}
                {activeView === 'chat' && 'Conversaciones con adoptantes'}
                {activeView === 'profile' && 'Información de tu cuenta'}
              </p>
            </div>
            {activeView === 'pets' && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                <IconPlus />
                <span className="hidden sm:inline">Nueva mascota</span>
                <span className="sm:hidden">Añadir</span>
              </button>
            )}
          </div>

          {activeView === 'pets' && (
            <PetsView
              pets={pets}
              loading={loading}
              error={error}
              onDeletePet={handleDeletePet}
              onSelectPet={setSelectedPet}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          )}
          {activeView === 'monitoring' && (
            <MonitoringView
              pets={pets}
              error={error}
              stats={stats}
              statsLoading={statsLoading}
              statsError={statsError}
            />
          )}
          {activeView === 'matches' && (
            <MatchesView
              matches={matches}
              loading={matchesLoading}
              error={matchesError}
              onAccept={handleAcceptMatch}
              onReject={handleRejectMatch}
            />
          )}
          {activeView === 'employees' && (
            <EmployeesView
              employees={employees}
              loading={employeesLoading}
              error={employeesError}
              onAddEmployee={handleAddEmployee}
            />
          )}
          {activeView === 'chat' && (
            <ChatView token={token || ''} />
          )}
          {activeView === 'profile' && (
            <ProfileView
              user={user}
              profileForm={profileForm}
              profileDirty={profileDirty}
              profileSaveMsg={profileSaveMsg}
              profileError={profileError}
              onUpdateField={updateProfileField}
              onPhotoSelect={handleProfilePhotoSelect}
              onSave={saveProfile}
            />
          )}
        </div>
      </main>

      {/* MODAL: AÑADIR */}
      {isAddModalOpen && (
        <AddPetModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddPet}
        />
      )}

      {/* MODAL: PERFIL MASCOTA */}
      {selectedPet && (
        <PetProfileModal
          pet={selectedPet}
          onClose={() => setSelectedPet(null)}
          onDelete={handleDeletePet}
          onUpdate={updated => {
            setSelectedPet(updated);
            setPets(prev =>
              prev.map(p => (p.id === updated.id ? updated : p))
            );
          }}
        />
      )}
    </div>
  );
}
