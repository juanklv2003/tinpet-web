import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/chatService';
import type { NewMatchRequestPayload } from '../../services/chatService';
import { useTranslation } from '../../i18n/useTranslation';

import { DashboardShell } from '../dashboard/DashboardShell';
import type { DashboardView } from '../dashboard/Sidebar';
import { AddPetModal } from '../shelter/modals/AddPetModal';
import { PetProfileModal } from '../shelter/modals/PetProfileModal';
import { ChatView } from '../shelter/views/ChatView';
import { EmployeesView } from '../shelter/views/EmployeesView';
import { MatchesView } from '../shelter/views/MatchesView';
import { MonitoringView } from '../shelter/views/MonitoringView';
import { PetsView } from '../shelter/views/PetsView';
import { ReviewsView } from '../shelter/views/ReviewsView';
import { SettingsView } from '../shelter/views/SettingsView';
import { useVetDashboardLogic } from './hooks/useVetDashboardLogic';
import type { VetActiveView } from './types';
import { VetProfileView } from './views/VetProfileView';

type VetView = VetActiveView | 'settings';

const VIEW_TO_PATH: Record<VetView, string> = {
  pets:        '/vet/pets',
  monitoring:  '/vet/dashboard',
  employees:   '/vet/employees',
  matches:     '/vet/requests',
  chat:        '/vet/chat',
  profile:     '/vet/profile',
  reviews:     '/vet/reviews',
  settings:    '/vet/settings',
};

const PATH_TO_VIEW: Array<{ prefix: string; view: VetView }> = [
  { prefix: '/vet/pets',       view: 'pets' },
  { prefix: '/vet/dashboard',  view: 'monitoring' },
  { prefix: '/vet/employees',  view: 'employees' },
  { prefix: '/vet/requests',   view: 'matches' },
  { prefix: '/vet/chat',       view: 'chat' },
  { prefix: '/vet/profile',    view: 'profile' },
  { prefix: '/vet/reviews',    view: 'reviews' },
  { prefix: '/vet/settings',   view: 'settings' },
];

export default function VetDashboard({ initialView }: { initialView?: string } = {}) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadMatchesCount, setUnreadMatchesCount] = useState(0);
  const [activeView, setActiveViewState] = useState<VetView>(
    (initialView as VetView) ?? 'monitoring'
  );

  const {
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
    handleCropCancel,
    handleCropConfirm,
    cropImageSrc,
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

  // Sync activeView from initialView prop on mount
  useEffect(() => {
    if (initialView) {
      setActiveViewState(initialView as VetView);
    }
  }, [initialView]);

  // Sync activeView from URL
  useEffect(() => {
    const match = PATH_TO_VIEW.find(({ prefix }) => location.pathname.startsWith(prefix));
    if (match && match.view !== activeView) {
      setActiveViewState(match.view);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleNavigate = (view: DashboardView | 'settings') => {
    const path = VIEW_TO_PATH[view as VetView] ?? '/vet/dashboard';
    navigate(path);
    setActiveViewState(view as VetView);
    if (view === 'chat') setUnreadMessagesCount(0);
    if (view === 'matches') setUnreadMatchesCount(0);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Socket for unread badges
  useEffect(() => {
    if (!token) return;
    chatService.connect(token).catch((err: unknown) => {
      console.error('Error connecting dashboard socket:', err);
    });
    const handleMsg = (message: { sender_role?: string }) => {
      if (message?.sender_role !== 'adopter') return;
      if (activeView !== 'chat') setUnreadMessagesCount(prev => prev + 1);
    };
    const handleMatch = (_payload: NewMatchRequestPayload) => {
      if (activeView !== 'matches') setUnreadMatchesCount(prev => prev + 1);
    };
    chatService.on('new_message', handleMsg);
    chatService.on('new_match_request', handleMatch);
    return () => {
      chatService.off('new_message', handleMsg);
      chatService.off('new_match_request', handleMatch);
    };
  }, [token, activeView]);

  const userRole = t('auth.role.vet');

  return (
    <DashboardShell
      activeView={activeView as DashboardView}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      userName={user?.name}
      userRole={userRole}
      userAvatarUrl={profileForm.avatarUrl}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      unreadMessages={unreadMessagesCount}
      unreadMatches={unreadMatchesCount}
      showEmployees={true}
    >
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
          onCropCancel={handleCropCancel}
          onCropConfirm={handleCropConfirm}
          cropImageSrc={cropImageSrc}
          onSave={saveProfile}
        />
      )}
      {activeView === 'reviews' && (
        <ReviewsView />
      )}
      {activeView === 'settings' && (
        <SettingsView />
      )}

      {isAddModalOpen && (
        <AddPetModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddPet}
          employees={employees}
          showEmployeeField={true}
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
          showEmployeeField={true}
        />
      )}
    </DashboardShell>
  );
}
