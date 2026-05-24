import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/chatService';
import type { NewMatchRequestPayload } from '../../services/chatService';

import { DashboardShell } from '../dashboard/DashboardShell';
import type { DashboardView } from '../dashboard/Sidebar';
import { AddPetModal } from './modals/AddPetModal';
import { PetProfileModal } from './modals/PetProfileModal';
import { ChatView } from './views/ChatView';
import { EmployeesView } from './views/EmployeesView';
import { MatchesView } from './views/MatchesView';
import { MonitoringView } from './views/MonitoringView';
import { PetsView } from './views/PetsView';
import { ProfileView } from './views/ProfileView';
import { ReviewsView } from './views/ReviewsView';
import { SettingsView } from './views/SettingsView';
import { useShelterDashboardLogic } from './hooks/useShelterDashboardLogic';
import { useTranslation } from '../../i18n/useTranslation';

import type { ActiveView } from './types';

// Map ActiveView ↔ DashboardView ↔ URL path
type ShelterView = ActiveView | 'settings';

const VIEW_TO_PATH: Record<ShelterView, string> = {
  pets:        '/pets',
  monitoring:  '/dashboard',
  matches:     '/requests',
  chat:        '/chat',
  profile:     '/profile',
  reviews:     '/reviews',
  settings:    '/settings',
  employees:   '/employees',
};

const PATH_TO_VIEW: Array<{ prefix: string; view: ShelterView }> = [
  { prefix: '/pets',       view: 'pets' },
  { prefix: '/dashboard',  view: 'monitoring' },
  { prefix: '/requests',   view: 'matches' },
  { prefix: '/chat',       view: 'chat' },
  { prefix: '/profile',    view: 'profile' },
  { prefix: '/reviews',    view: 'reviews' },
  { prefix: '/settings',   view: 'settings' },
  { prefix: '/employees',  view: 'employees' },
];

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function ShelterDashboard({ initialView }: { initialView?: string } = {}) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadMatchesCount, setUnreadMatchesCount] = useState(0);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const [activeView, setActiveViewState] = useState<ShelterView>(
    (initialView as ShelterView) ?? 'monitoring'
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
    saveProfile,
    handleAddPet,
    handleDeletePet,
    cropImageSrc,
    handleCropCancel,
    handleCropConfirm,
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
  } = useShelterDashboardLogic(user, activeView);

  // Sync activeView from initialView prop on mount
  useEffect(() => {
    if (initialView) setActiveViewState(initialView as ShelterView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const path = VIEW_TO_PATH[view as ShelterView] ?? '/dashboard';
    navigate(path);
    setActiveViewState(view as ShelterView);
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
    const handleMsg = (message: { id?: string; sender_role?: string; senderRole?: string }) => {
      const role = String(message?.sender_role ?? message?.senderRole ?? '').toLowerCase();
      if (role && role !== 'adopter') return;

      if (message?.id) {
        if (seenMessageIdsRef.current.has(message.id)) return;
        seenMessageIdsRef.current.add(message.id);
        if (seenMessageIdsRef.current.size > 400) {
          seenMessageIdsRef.current.clear();
        }
      }

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

  const userRole = t('auth.role.shelter');

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
        <ProfileView
          user={user}
          profileForm={profileForm}
          profileDirty={profileDirty}
          profileSaveMsg={profileSaveMsg}
          profileError={profileError}
          onUpdateField={updateProfileField}
          onPhotoSelect={handleProfilePhotoSelect}
          onSave={saveProfile}
          cropImageSrc={cropImageSrc}
          onCropCancel={handleCropCancel}
          onCropConfirm={handleCropConfirm}
        />
      )}
      {activeView === 'reviews' && <ReviewsView />}
      {activeView === 'settings' && <SettingsView />}

      {/* Modals */}
      {isAddModalOpen && (
        <AddPetModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddPet}
          employees={employees}
          showEmployeeField={false}
        />
      )}
      {selectedPet && (
        <PetProfileModal
          pet={selectedPet}
          onClose={() => setSelectedPet(null)}
          onDelete={handleDeletePet}
          onUpdate={updated => {
            setSelectedPet(updated);
            setPets(prev => prev.map(p => (p.id === updated.id ? updated : p)));
          }}
          employees={employees}
          showEmployeeField={false}
        />
      )}
    </DashboardShell>
  );
}
