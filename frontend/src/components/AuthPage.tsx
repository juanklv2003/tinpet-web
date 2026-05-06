import {
    ArrowRight,
    Dog,
    Eye,
    EyeOff,
    MessagesSquare,
    PawPrint,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';
import { useRegister } from '../hooks/useRegister';
import type { UserRole } from '../types';
import { StyledSelect } from './styled-select';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showModal, setShowModal] = useState(false);
  const [entered, setEntered] = useState(false);

  // --- Login state ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // --- Register state ---
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('adopter');

  // --- Hooks de autenticación ---
  const { login, loading: loginLoading, error: loginError } = useLogin();
  const { register, loading: regLoading, error: regError } = useRegister();

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowModal(false);
    };

    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(raf);
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginEmail, loginPassword, rememberMe);
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

  const openLogin = () => {
    setMode('login');
    setShowModal(true);
  };

  const openRegister = () => {
    setMode('register');
    setShowModal(true);
  };

  // ─── UI ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="relative z-10 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
              <PawPrint className="h-5 w-5" />
            </div>
            <span className="text-2xl font-black tracking-tight">TinPet</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={openLogin}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Iniciar sesion
            </button>
            <button
              type="button"
              onClick={openRegister}
              className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Registrarse
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl grid-cols-1 items-center gap-12 px-5 pb-28 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-16">
        <section
          className={`max-w-2xl transition-all duration-700 ${entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Plataforma oficial de adopcion
          </div>

          <h1 className="mt-7 text-5xl font-black leading-[0.98] text-slate-900 sm:text-6xl lg:text-[4.2rem] dark:text-white">
            Convierte cada
            <span className="mt-2 block text-blue-700 dark:text-blue-400">
              match en adopcion real
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            Una experiencia profesional para refugios, adoptantes y veterinarias: solicitudes, chat y seguimiento en un flujo que se siente humano.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openRegister}
              className="group inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Empezar ahora
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={openLogin}
              className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Ya tengo cuenta
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-900">Chat en tiempo real</span>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-900">Gestion de refugio</span>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-900">Flujo de adopcion</span>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tiempo medio</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">-38%</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">en gestion de solicitudes</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Conversaciones</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">24/7</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">seguimiento en tiempo real</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Satisfaccion</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">4.9/5</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">valoracion de equipos</p>
            </div>
          </div>
        </section>

        <section
          className={`relative transition-all delay-100 duration-700 ${entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Panel TinPet</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Refugio Costa Animal</p>
              </div>
              <div className="rounded-xl bg-slate-900 p-2 text-white dark:bg-slate-100 dark:text-slate-900">
                <Dog className="h-4 w-4" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Solicitudes nuevas</p>
                <p className="mt-1 text-3xl font-black text-slate-900 dark:text-slate-100">12</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">ultimas 24h</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Chats activos</p>
                <p className="mt-1 text-3xl font-black text-slate-900 dark:text-slate-100">31</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">respuesta media 4m</p>
              </div>
            </div>

            <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <MessagesSquare className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  Mensajes recientes
                </span>
                <span className="text-xs font-semibold text-slate-400">Ahora</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                "Hola, podemos agendar visita para Kira?"
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                "Aceptaron la solicitud de Sully"
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <span className="inline-flex items-center gap-2">
                <Dog className="h-4 w-4" />
                14 adopciones cerradas este mes
              </span>
              <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">+12%</span>
            </div>
          </div>
        </section>
      </main>

      {!showModal && (
        <div className="fixed bottom-4 left-4 right-4 z-30 lg:hidden">
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={openLogin}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                Iniciar sesion
              </button>
              <button
                type="button"
                onClick={openRegister}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
              >
                Crear cuenta
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            aria-label="Cerrar modal"
          />

          <div className="relative z-50 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl shadow-slate-900/25 transition-all duration-300 dark:border-slate-700 dark:bg-slate-900 sm:p-8">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-3xl leading-none text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
              aria-label="Cerrar"
            >
              ×
            </button>

            <div className="mb-7 text-center">
                <h2 className="text-[2.15rem] font-black tracking-tight text-slate-900 dark:text-white">
                {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
              </h2>
              <p className="mt-1.5 text-lg text-slate-500 dark:text-slate-400">
                {mode === 'login' ? 'Accede a tu panel de control' : 'Empieza a gestionar adopciones hoy'}
              </p>
            </div>

            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-lg font-semibold text-slate-700 dark:text-slate-200">Email</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="usuario@ejemplo.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-lg font-semibold text-slate-700 dark:text-slate-200">Contrasena</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </div>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Recuerdame</span>
                </label>

                <p className="text-right text-sm font-semibold text-slate-500 dark:text-slate-400">¿Olvidaste tu contrasena?</p>

                {loginError && <p className="text-sm text-red-500">{loginError}</p>}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full rounded-2xl bg-slate-900 py-3 text-lg font-bold text-white transition hover:bg-slate-700 disabled:opacity-55 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {loginLoading ? 'Entrando...' : 'Entrar'}
                </button>

                <p className="pt-1 text-center text-sm text-slate-500 dark:text-slate-400">
                  ¿No tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    Registrate aqui
                  </button>
                </p>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-lg font-semibold text-slate-700 dark:text-slate-200">Nombre</label>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Tu nombre o refugio"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-brand"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-lg font-semibold text-slate-700 dark:text-slate-200">Email</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="usuario@ejemplo.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-brand"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-lg font-semibold text-slate-700 dark:text-slate-200">Contrasena</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-brand"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-lg font-semibold text-slate-700 dark:text-slate-200">Rol</label>
                  <StyledSelect
                    value={regRole}
                    onChange={(value) => setRegRole(value as UserRole)}
                    options={[
                      { value: 'adopter', label: 'Adoptante' },
                      { value: 'shelter', label: 'Refugio' },
                      { value: 'vet', label: 'Veterinario' },
                    ]}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-brand"
                  />
                </div>

                {regError && <p className="text-sm text-red-500">{regError}</p>}

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full rounded-2xl bg-slate-900 py-3 text-lg font-bold text-white transition hover:bg-slate-700 disabled:opacity-55 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {regLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>

                <p className="pt-1 text-center text-sm text-slate-500 dark:text-slate-400">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-semibold text-brand hover:text-brand-dark dark:text-brand"
                  >
                    Inicia sesion
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
