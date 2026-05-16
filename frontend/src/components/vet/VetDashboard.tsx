import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/chatService';

import { Stethoscope } from 'lucide-react';
import { Button } from '../ui/Button';
import { IconChart, IconChat, IconHeart, IconPaw, IconPlus, IconTeam, IconUser } from '../shelter/Icons';
import { useTheme } from '../shelter/hooks/useTheme';
import { AddPetModal } from '../shelter/modals/AddPetModal';
import { PetProfileModal } from '../shelter/modals/PetProfileModal';
import { ChatView } from '../shelter/views/ChatView';
import { EmployeesView } from '../shelter/views/EmployeesView';
import { MatchesView } from '../shelter/views/MatchesView';
import { MonitoringView } from '../shelter/views/MonitoringView';
import { PetsView } from '../shelter/views/PetsView';
import { useVetDashboardLogic } from './hooks/useVetDashboardLogic';
import type { VetActiveView } from './types';
import { VetProfileView } from './views/VetProfileView';

export default function VetDashboard({ initialView }: { initialView?: string } = {}) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadMatchesCount, setUnreadMatchesCount] = useState(0);

  const { isDarkMode, toggleDarkMode } = useTheme();

  const {
    activeView,
    setActiveView,
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
  } = useVetDashboardLogic(user);

  useEffect(() => {
    if (initialView) {
      setActiveView(initialView as VetActiveView);
    }
  }, [initialView, setActiveView]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const viewToPath = (view: VetActiveView) => {
    switch (view) {
      case 'pets':
        return '/vet/pets';
      case 'monitoring':
        return '/vet/dashboard';
      case 'employees':
        return '/vet/employees';
      case 'matches':
        return '/vet/requests';
      case 'chat':
        return '/vet/chat';
      case 'profile':
        return '/vet/profile';
      default:
        return '/vet/pets';
    }
  };

  const pathToView = (path: string): VetActiveView | null => {
    if (path.startsWith('/vet/pets')) return 'pets';
    if (path.startsWith('/vet/dashboard')) return 'monitoring';
    if (path.startsWith('/vet/employees')) return 'employees';
    if (path.startsWith('/vet/requests')) return 'matches';
    if (path.startsWith('/vet/chat')) return 'chat';
    if (path.startsWith('/vet/profile')) return 'profile';
    return null;
  };

  const renderNavItem = ({
    view,
    icon,
    label,
    showBadge = false,
  }: {
    view: VetActiveView;
    icon: React.ReactNode;
    label: string;
    showBadge?: boolean;
  }) => (
    <button
      type="button"
      onClick={() => {
        navigate(viewToPath(view));
        setActiveView(view);
        if (view === 'chat') {
          setUnreadMessagesCount(0);
        }
        if (view === 'matches') {
          setUnreadMatchesCount(0);
        }
      }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-[background-color,color] duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1
        ${
          activeView === view
            ? 'bg-brand/10 text-brand dark:bg-brand/15'
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50'
        } [&_svg]:w-5 [&_svg]:h-5`}
    >
      <div className="relative">
        {icon}
        {showBadge && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B94188] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#B94188] border-2 border-white dark:border-gray-800"></span>
          </span>
        )}
      </div>
      {label}
    </button>
  );

  useEffect(() => {
    const fromPath = pathToView(location.pathname);
    if (fromPath && fromPath !== activeView) {
      setActiveView(fromPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (!token) return;

    chatService.connect(token).catch((error: unknown) => {
      console.error('Error connecting dashboard socket:', error);
    });

    const handleIncomingMessage = (message: { sender_role?: string }) => {
      if (message?.sender_role !== 'adopter') return;
      if (activeView !== 'chat') {
        setUnreadMessagesCount((prev) => prev + 1);
      }
    };

    const handleNewMatchRequest = () => {
      if (activeView !== 'matches') {
        setUnreadMatchesCount((prev) => prev + 1);
      }
    };

    chatService.on('new_message', handleIncomingMessage);
    chatService.on('new_match_request', handleNewMatchRequest);

    return () => {
      chatService.off('new_message', handleIncomingMessage);
      chatService.off('new_match_request', handleNewMatchRequest);
    };
  }, [token, activeView]);

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <aside className="w-72 shrink-0 h-full flex flex-col gap-4 p-5 bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 overflow-y-auto">
        <div className="px-4 py-2 mb-2 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-brand" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            <span className="text-brand">Tin</span>Pet
          </h1>
        </div>
        <p className="px-4 text-sm text-gray-400 mt-0.5 truncate">
          {user?.name || 'Veterinaria'}
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 space-y-1">
          <p className="px-3 pt-1 pb-2 text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            General
          </p>
          {renderNavItem({ view: 'pets', icon: <IconPaw />, label: 'Mascotas' })}
          {renderNavItem({ view: 'monitoring', icon: <IconChart />, label: 'Monitorizacion' })}
          {renderNavItem({ view: 'matches', icon: <IconHeart />, label: 'Solicitudes', showBadge: activeView !== 'matches' && unreadMatchesCount > 0 })}
          {renderNavItem({ view: 'employees', icon: <IconTeam />, label: 'Empleados' })}
          {renderNavItem({
            view: 'chat',
            icon: <IconChat />,
            label: 'Chat',
            showBadge: activeView !== 'chat' && unreadMessagesCount > 0,
          })}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 space-y-1">
          <p className="px-3 pt-1 pb-2 text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Ajustes
          </p>
          {renderNavItem({ view: 'profile', icon: <IconUser />, label: 'Mi Perfil' })}

          <button
            type="button"
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors [&_svg]:w-5 [&_svg]:h-5"
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors [&_svg]:w-5 [&_svg]:h-5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-4 lg:px-5 xl:px-6 2xl:px-8 py-4 lg:py-6 xl:py-8">
          <div className="mb-6 xl:mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl xl:text-2xl font-bold text-gray-900 dark:text-white">
                {activeView === 'pets' && 'Lista de Mascotas'}
                {activeView === 'monitoring' && 'Monitorizacion'}
                {activeView === 'matches' && 'Solicitudes'}
                {activeView === 'employees' && 'Empleados'}
                {activeView === 'chat' && 'Chat'}
                {activeView === 'profile' && 'Mi Perfil'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {activeView === 'pets' && `${pets.length} mascota${pets.length !== 1 ? 's' : ''}`}
                {activeView === 'monitoring' && 'Estadisticas de tu clinica'}
                {activeView === 'matches' && `${matches.length} solicitud${matches.length !== 1 ? 'es' : ''}`}
                {activeView === 'employees' && `${employees.length} empleado${employees.length !== 1 ? 's' : ''}`}
                {activeView === 'chat' && 'Conversaciones con adoptantes'}
                {activeView === 'profile' && 'Informacion de tu clinica'}
              </p>
            </div>
            {activeView === 'pets' && (
              <Button
                variant="solid"
                onClick={() => setIsAddModalOpen(true)}
                className="gap-2"
              >
                <IconPlus />
                <span className="hidden sm:inline">Nueva mascota</span>
                <span className="sm:hidden">Anadir</span>
              </Button>
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
              pets={pets}
              loading={employeesLoading}
              error={employeesError}
              onAddEmployee={handleAddEmployee}
            />
          )}

          {activeView === 'chat' && (
            <ChatView token={token || ''} />
          )}

          {activeView === 'profile' && (
            <VetProfileView
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

      {isAddModalOpen && (
        <AddPetModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddPet}
          employees={employees}
        />
      )}

      {selectedPet && (
        <PetProfileModal
          pet={selectedPet}
          onClose={() => setSelectedPet(null)}
          onDelete={handleDeletePet}
          onUpdate={(updated) => {
            setSelectedPet(updated);
            setPets((prev) => prev.map((pet) => (pet.id === updated.id ? updated : pet)));
          }}
          employees={employees}
        />
      )}
    </div>
  );
}
