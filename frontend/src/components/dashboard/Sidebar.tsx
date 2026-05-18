import {
  ChartLineUp,
  ChatCircle,
  Gear,
  Heart,
  SignOut,
  Star,
  SquaresFour,
  Building,
  X,
  List,
} from '@phosphor-icons/react';
import { useTranslation } from '../../i18n/useTranslation';
import tinpetLogo from '../../assets/tinpetLogo (2).ico';

export type DashboardView =
  | 'pets'
  | 'monitoring'
  | 'matches'
  | 'employees'
  | 'chat'
  | 'profile'
  | 'settings'
  | 'reviews';

interface NavItem {
  view: DashboardView;
  icon: React.ReactNode;
  labelKey: string;
  badge?: number;
}

interface SidebarProps {
  activeView: DashboardView;
  onNavigate: (view: DashboardView) => void;
  onLogout: () => void;
  userName?: string;
  userRole?: string;
  isOpen: boolean;
  onClose: () => void;
  unreadMessages?: number;
  unreadMatches?: number;
}

export function Sidebar({
  activeView,
  onNavigate,
  onLogout,
  userName,
  userRole,
  isOpen,
  onClose,
  unreadMessages = 0,
  unreadMatches = 0,
}: SidebarProps) {
  const t = useTranslation();

  const generalNav: NavItem[] = [
    { view: 'pets', icon: <SquaresFour size={20} />, labelKey: 'nav.pets' },
    { view: 'monitoring', icon: <ChartLineUp size={20} />, labelKey: 'nav.monitoring' },
    { view: 'matches', icon: <Heart size={20} />, labelKey: 'nav.requests', badge: unreadMatches },
    { view: 'chat', icon: <ChatCircle size={20} />, labelKey: 'nav.chat', badge: unreadMessages },
  ];

  const systemNav: NavItem[] = [
    { view: 'profile', icon: <Building size={20} />, labelKey: 'nav.profile' },
    { view: 'reviews', icon: <Star size={20} />, labelKey: 'nav.reviews' },
    { view: 'settings', icon: <Gear size={20} />, labelKey: 'nav.settings' },
  ];

  const renderItem = (item: NavItem) => {
    const isActive = activeView === item.view;
    return (
      <button
        key={item.view}
        type="button"
        onClick={() => { onNavigate(item.view); onClose(); }}
        className={`relative w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
          isActive
            ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-900 dark:text-brand-400 font-bold'
            : 'text-ink-medium dark:text-slate-400 hover:bg-brand-50 dark:hover:bg-slate-800 hover:text-ink-dark dark:hover:text-white font-medium'
        }`}
      >
        {isActive && <span className="nav-active-indicator" aria-hidden="true" />}
        <span className={isActive ? 'text-brand-500' : 'transition-colors'}>{item.icon}</span>
        <span className="flex-1 text-left">{t(item.labelKey as any)}</span>
        {item.badge != null && item.badge > 0 && !isActive && (
          <span className="bg-accent-100 text-accent-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-ink-dark/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:relative z-50 md:z-auto
          w-72 shrink-0 h-full
          flex flex-col justify-between
          bg-surface dark:bg-slate-900
          border-r border-ink-light/10 dark:border-slate-800
          shadow-sm
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="px-8 py-10 flex flex-col gap-0 flex-1 overflow-y-auto dash-scroll">
          {/* Logo + close button (mobile) */}
          <div className="mb-12 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={tinpetLogo} alt="Tinpet" className="w-9 h-9 object-contain" />
              <h1 className="font-serif text-2xl font-black tracking-tight text-brand-500">
                Tinpet.
              </h1>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-ink-light hover:text-ink-dark dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Cerrar menú"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          {/* Navigation */}
          <div className="space-y-8">
            {/* General */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink-light dark:text-slate-500 mb-4 pl-3">
                {t('nav.general')}
              </p>
              <nav className="space-y-1">
                {generalNav.map(renderItem)}
              </nav>
            </div>

            {/* System */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink-light dark:text-slate-500 mb-4 pl-3">
                {t('nav.system')}
              </p>
              <nav className="space-y-1">
                {systemNav.map(renderItem)}
              </nav>
            </div>
          </div>
        </div>

        {/* User section + logout */}
        <div className="px-8 py-6 border-t border-ink-light/10 dark:border-slate-800">
          {userName && (
            <div className="mb-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-500 font-bold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-ink-dark dark:text-white truncate max-w-[160px]">{userName}</p>
                <p className="text-xs text-ink-light dark:text-slate-500">{userRole}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-medium dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all"
          >
            <SignOut size={20} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Mobile hamburger button ────────────────────────────────────────
interface HamburgerProps {
  onClick: () => void;
}
export function HamburgerButton({ onClick }: HamburgerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-surface dark:bg-slate-900 shadow-bento border border-ink-light/10 dark:border-slate-700 text-ink-medium dark:text-slate-400 hover:text-brand-500 transition-colors"
      aria-label="Abrir menú"
    >
      <List size={22} weight="bold" />
    </button>
  );
}
