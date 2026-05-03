import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLogin } from '../hooks/useLogin';
import { useRegister } from '../hooks/useRegister';
import type { UserRole } from '../types';

export const AuthManager = () => {
  const { user, logout } = useAuth();
  
  // Extraemos nuestra lógica encapsulada
  const { login, loading: loginLoading, error: loginError } = useLogin();
  const { register, loading: registerLoading, error: registerError } = useRegister();

  // Estados locales solo para lo que el usuario escribe
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('adopter');

  const onLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const onRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register({ email, password, name, role });
  };

  if (user) {
    return (
      <div style={{ border: '2px solid #4CAF50', padding: '10px', margin: '20px 0' }}>
        <h3>✅ Sesión Activa</h3>
        <p>Usuario: {user.name} ({user.email})</p>
        <p>Nivel de Acceso: <strong>{user.role.toUpperCase()}</strong></p>
        <button onClick={logout}>Cerrar Sesión</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '20px', margin: '20px 0' }}>
      {/* FORMULARIO DE LOGIN */}
      <form onSubmit={onLoginSubmit} style={{ border: '1px solid #ccc', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4>Entrar</h4>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ paddingRight: '44px', width: '100%', boxSizing: 'border-box' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'transparent',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <button type="submit" disabled={loginLoading}>
          {loginLoading ? 'Entrando...' : 'Iniciar Sesión'}
        </button>
        {loginError && <p style={{ color: 'red', fontSize: '12px' }}>{loginError}</p>}
      </form>

      {/* FORMULARIO DE REGISTRO */}
      <form onSubmit={onRegisterSubmit} style={{ border: '1px solid #ccc', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4>Nuevo Registro</h4>
        <input type="text" placeholder="Tu Nombre / Clínica" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ paddingRight: '44px', width: '100%', boxSizing: 'border-box' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'transparent',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          <option value="adopter">Adoptante</option>
          <option value="shelter">Protectora</option>
          <option value="vet">Veterinario/a</option>
        </select>
        <button type="submit" disabled={registerLoading}>
          {registerLoading ? 'Registrando...' : 'Crear Cuenta'}
        </button>
        {registerError && <p style={{ color: 'red', fontSize: '12px' }}>{registerError}</p>}
      </form>
    </div>
  );
};