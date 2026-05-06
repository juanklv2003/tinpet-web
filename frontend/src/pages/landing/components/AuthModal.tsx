import { Eye, EyeOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../../../hooks/useLogin';
import { useRegister } from '../../../hooks/useRegister';
import { StyledSelect } from '../../../components/styled-select';
import type { UserRole } from '../../../types';

type AuthMode = 'login' | 'register';

interface AuthModalProps {
  initialMode: AuthMode;
  onClose: () => void;
}

export function AuthModal({ initialMode, onClose }: AuthModalProps) {
  const navigate = useNavigate();
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
    if (success) navigate('/dashboard');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await register({ email: regEmail, password: regPassword, name: regName, role: regRole });
    if (success) {
      setLoginEmail(regEmail);
      setMode('login');
    }
  };

  // Shared input class
  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        aria-label="Cerrar modal"
      />

      {/* Panel */}
      <div className="relative z-50 w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950 sm:max-w-lg">
        <div className="p-7 sm:p-8">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            id="modal-close-btn"
            className="absolute right-4 top-5 rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="mb-7 text-center">
            <h2 className="text-[2rem] font-black tracking-tight text-slate-900 dark:text-white">
              {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
            </h2>
            <p className="mt-1.5 text-base text-slate-500 dark:text-slate-400">
              {mode === 'login'
                ? 'Accede a tu panel de control'
                : 'Empieza a gestionar adopciones hoy'}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="mb-6 flex gap-1 border-b border-stone-200 dark:border-slate-800">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                id={`modal-tab-${m}`}
                onClick={() => setMode(m)}
                className={`px-4 pb-3 text-sm font-semibold transition-all ${
                  mode === m
                    ? 'border-b-2 border-pink-500 text-pink-500'
                    : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          {/* Login form */}
          {mode === 'login' && (
            <form id="login-form" onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="usuario@ejemplo.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••"
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

              <p className="text-right text-sm font-semibold text-slate-400 dark:text-slate-500">
                ¿Olvidaste tu contraseña?
              </p>

              {loginError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  {loginError}
                </p>
              )}

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-xl bg-pink-500 py-3.5 text-sm font-bold text-white transition hover:bg-pink-600 disabled:opacity-50 active:scale-[0.98]"
              >
                {loginLoading ? 'Entrando...' : 'Entrar'}
              </button>

              <p className="pt-1 text-center text-sm text-slate-500 dark:text-slate-400">
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-semibold text-pink-600 hover:text-pink-500 dark:text-pink-400"
                >
                  Regístrate aquí
                </button>
              </p>
            </form>
          )}

          {/* Register form */}
          {mode === 'register' && (
            <form id="register-form" onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Tu nombre o refugio"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="usuario@ejemplo.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••"
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
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Rol
                </label>
                <StyledSelect
                  value={regRole}
                  onChange={(value) => setRegRole(value as UserRole)}
                  options={[
                    { value: 'shelter', label: 'Refugio' },
                    { value: 'vet', label: 'Veterinaria' },
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
                className="w-full rounded-xl bg-pink-500 py-3.5 text-sm font-bold text-white transition hover:bg-pink-600 disabled:opacity-50 active:scale-[0.98]"
              >
                {regLoading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>

              <p className="pt-1 text-center text-sm text-slate-500 dark:text-slate-400">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-semibold text-pink-600 hover:text-pink-500 dark:text-pink-400"
                >
                  Inicia sesión
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
