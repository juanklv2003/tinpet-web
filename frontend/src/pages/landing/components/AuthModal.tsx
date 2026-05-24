import { Eye, EyeOff, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../../../hooks/useLogin';
import { useRegister } from '../../../hooks/useRegister';
import { StyledSelect } from '../../../components/styled-select';
import type { UserRole } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from '../../../i18n/useTranslation';
import tinpetLogo from '../../../assets/tinpetLogo (2).ico';

type AuthMode = 'login' | 'register';

interface AuthModalProps {
  initialMode: AuthMode;
  onClose: () => void;
}

export function AuthModal({ initialMode, onClose }: AuthModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const t = useTranslation();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [regRole, setRegRole] = useState<UserRole>('shelter');

  const { login, loading: loginLoading, error: loginError } = useLogin();
  const { register, loading: regLoading, error: regError } = useRegister();

  // Track whether we triggered a login so we don't react to pre-existing sessions
  const pendingRedirect = useRef(false);

  // Navigate once the auth context actually has the user
  useEffect(() => {
    if (pendingRedirect.current && user) {
      pendingRedirect.current = false;
      navigate('/login-gateway');
    }
  }, [user, navigate]);

  // Sync mode if parent changes initialMode
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Close on Escape
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  // Prevent scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginEmail, loginPassword);
    if (success) {
      pendingRedirect.current = true;
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await register({ email: regEmail, password: regPassword, name: regName, role: regRole });
    if (success) {
      setLoginEmail(regEmail);
      setMode('login');
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 ' +
    'text-slate-800 dark:text-slate-200 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20 ' +
    'focus:outline-none transition-all duration-200 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop / Overlay */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
        aria-label="Cerrar modal"
      />

      {/* Panel / Card */}
      <div className="relative inline-block w-full max-w-md p-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-dark-card border border-stone-200 dark:border-slate-700 shadow-2xl rounded-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-brand focus:outline-none transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Header with Tinpet logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
            <img src={tinpetLogo} alt="Tinpet Logo" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          <h3 className="text-2.5xl font-black text-slate-900 dark:text-white leading-tight">
            {mode === 'login' ? t('landing.auth.welcome') : t('landing.auth.registerTab')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            {t('landing.auth.subtitle')}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="mb-6 flex gap-1 border-b border-stone-200 dark:border-gray-700">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              id={`modal-tab-${m}`}
              onClick={() => setMode(m)}
              className={`px-4 pb-3 text-sm font-semibold transition-[color,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-t ${
                mode === m
                  ? 'border-b-2 border-brand text-brand'
                  : 'text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300'
              }`}
            >
              {m === 'login' ? t('landing.auth.loginTab') : t('landing.auth.registerTab')}
            </button>
          ))}
        </div>

        {/* Login Form */}
        {mode === 'login' && (
          <form id="login-form" onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-left">
                {t('landing.auth.email')}
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder={t('landing.auth.emailPlaceholder')}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-left">
                {t('landing.auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((value) => !value)}
                  aria-label={showLoginPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  {showLoginPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {loginError && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {loginError}
              </p>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loginLoading}
              className="w-full mt-4 px-5 py-3 rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-bold shadow-sm shadow-brand/20 transition-[background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
            >
              {loginLoading ? '...' : t('landing.auth.loginBtn')}
            </button>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form id="register-form" onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-left">
                {t('landing.auth.name')}
              </label>
              <input
                type="text"
                required
                autoComplete="name"
                placeholder={t('landing.auth.namePlaceholder')}
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-left">
                {t('landing.auth.email')}
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder={t('landing.auth.emailPlaceholder')}
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-left">
                {t('landing.auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword((value) => !value)}
                  aria-label={showRegisterPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  {showRegisterPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-left">
                {t('landing.auth.role')}
              </label>
              <StyledSelect
                value={regRole}
                onChange={(value) => setRegRole(value as UserRole)}
                options={[
                  { value: 'shelter', label: t('auth.role.shelter') },
                  { value: 'vet', label: t('auth.role.vet') },
                ]}
                className={inputClass}
              />
            </div>

            {regError && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {regError}
              </p>
            )}

            <button
              id="register-submit-btn"
              type="submit"
              disabled={regLoading}
              className="w-full mt-4 px-5 py-3 rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-bold shadow-sm shadow-brand/20 transition-[background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
            >
              {regLoading ? '...' : t('landing.auth.registerBtn')}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          <span>{mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}</span>
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="font-bold text-brand hover:text-brand-dark focus:outline-none transition-colors"
          >
            {mode === 'login' ? t('landing.auth.registerTab') : t('landing.auth.loginTab')}
          </button>
        </div>
      </div>
    </div>
  );
}
