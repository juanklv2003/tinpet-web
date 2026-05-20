import React from 'react';
import { ToastProvider } from './ToastProvider';
import { Sidebar, HamburgerButton } from './Sidebar';
import type { DashboardView } from './Sidebar';

interface DashboardShellProps {
  activeView: DashboardView;
  onNavigate: (view: DashboardView) => void;
  onLogout: () => void;
  userName?: string;
  userRole?: string;
  userAvatarUrl?: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  unreadMessages?: number;
  unreadMatches?: number;
  showEmployees?: boolean;
  children: React.ReactNode;
}

/**
 * DashboardShell
 * Provides the full-page layout: cream noise background, sidebar, toast system.
 * Used by both ShelterDashboard and VetDashboard.
 */
export function DashboardShell({
  activeView,
  onNavigate,
  onLogout,
  userName,
  userRole,
  userAvatarUrl,
  sidebarOpen,
  setSidebarOpen,
  unreadMessages,
  unreadMatches,
  showEmployees,
  children,
}: DashboardShellProps) {
  return (
    <ToastProvider>
      <div className="dashboard-root dashboard-bg h-screen flex overflow-hidden antialiased font-manrope transition-colors duration-300">
        {/* Hamburger — visible only on mobile */}
        <HamburgerButton onClick={() => setSidebarOpen(true)} />

        {/* Sidebar */}
        <Sidebar
          activeView={activeView}
          onNavigate={onNavigate}
          onLogout={onLogout}
          userName={userName}
          userRole={userRole}
          userAvatarUrl={userAvatarUrl}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          unreadMessages={unreadMessages}
          unreadMatches={unreadMatches}
          showEmployees={showEmployees}
        />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto dash-scroll relative h-full">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 xl:px-14 pt-14 pb-24">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
