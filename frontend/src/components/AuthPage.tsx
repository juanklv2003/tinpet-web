import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '../types';
import { useLogin } from '../hooks/useLogin';
import { useRegister } from '../hooks/useRegister';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');

  // --- Login state ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // --- Register state ---
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('adopter');

  // --- Hooks de autenticación ---
  const { login, loading: loginLoading, error: loginError } = useLogin();
  const { register, loading: regLoading, error: regError } = useRegister();

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginEmail, loginPassword);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await register({
      email: regEmail,
      password: regPassword,
      name: regName,
      role: regRole,
    });
    if (success) {
      // Precargamos el email y volvemos a login
      setLoginEmail(regEmail);
      setMode('login');
    }
  };

  // ─── UI ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

        {/* Header + toggle */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            {mode === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
          </h1>
          <p className="text-sm text-gray-500">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-gray-900 font-medium underline underline-offset-2 hover:text-gray-600 transition-colors"
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>

        {/* ── LOGIN FORM ── */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="tu@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
              />
            </div>

            {loginError && <p className="text-xs text-red-500">{loginError}</p>}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-lg bg-gray-900 text-white py-2 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loginLoading ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                required
                autoComplete="name"
                placeholder="Tu nombre"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="tu@email.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition bg-white"
              >
                <option value="adopter">Adoptante</option>
                <option value="shelter">Refugio</option>
                <option value="vet">Veterinario</option>
              </select>
            </div>

            {regError && <p className="text-xs text-red-500">{regError}</p>}

            <button
              type="submit"
              disabled={regLoading}
              className="w-full rounded-lg bg-gray-900 text-white py-2 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {regLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
