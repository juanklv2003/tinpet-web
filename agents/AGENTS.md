# AGENTS.md — TinPet Web

Este documento define las convenciones y estructura del proyecto para que cualquier agente de IA pueda trabajar correctamente.

---

## Estructura del Proyecto

```
tinpet-web/
├── frontend/           # Vite + React 19 + TypeScript + Tailwind v4
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── context/       # Contextos (AuthContext)
│   │   ├── hooks/         # Custom hooks (usePets, useLogin, useRegister)
│   │   ├── services/     # API calls
│   │   ├── types/        # TypeScript types
│   │   ├── App.tsx      # Entry point
│   │   └── main.tsx     # React DOM mount
│   └── package.json
│
├── backend/            # Express + Prisma + PostgreSQL
│   ├── src/
│   │   ├── routes/     # Express routes (auth, pets)
│   │   ├── middleware/ # Auth middleware
│   │   ├── lib/        # Prisma client
│   │   └── server.js   # Entry point
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
└── agents/
    └── AGENTS.md       # Este archivo
```

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS v4, React Router 7 |
| Backend | Express 5, Prisma 7, PostgreSQL, JWT, bcrypt |
| Auth | JWT en localStorage, Bearer token |

---

## Modelos de Datos (Prisma Schema)

### Users
- `id`: UUID
- `email`: String (unique)
- `password_hash`: String
- `role`: String ('adopter' | 'shelter' | 'vet')
- `created_at`: DateTime

### Adopters (perfil adoptante)
- `id`, `user_id`, `name`, `email`, `created_at`

### Shelters (perfil refugio)
- `id`, `user_id`, `name`, `email`, `created_at`
- Relación: muchos `pets`

### Vet Clinics (perfil clínica veterinaria)
- `id`, `user_id`, `name`, `email`, `created_at`

### Pets
- `id`, `shelter_id`, `name`, `species`, `status` ('available' | 'pending' | 'adopted'), `ai_profile` (JSON), `created_at`

---

## Convenciones de Código

### Frontend

**Hooks personalizados** (ubicación: `src/hooks/`):
- `usePets()`: Fetch y gestión de mascotas
- `useLogin()`: Login de usuario
- `useRegister()`: Registro de usuario
- Retornan: `{ data, loading, error }`

**Context** (ubicación: `src/context/`):
- `AuthContext`: Provider que envuelve la app, provee `user`, `loading`, `setAuth()`, `logout()`
- `useAuth()`: Hook para acceder al contexto

**Tipos** (ubicación: `src/types/`):
- `AuthUser`: `{ id, email, role, name }`

**Componentes** (ubicación: `src/components/`):
- PascalCase: `AuthPage.tsx`, `ShelterDashboard.tsx`
- Funcionales con TypeScript

### Backend

**Rutas** (ubicación: `src/routes/`):
- `auth.routes.js`: `/api/auth/*` (login, register)
- `pets.routes.js`: `/api/pets/*` (CRUD mascotas)

**Middleware**:
- `authenticate.js`: Verifica JWT en header `Authorization: Bearer <token>`

---

## Scripts Disponibles

### Frontend
```bash
cd frontend
npm run dev        # Iniciar dev server
npm run build      # Build producción
npm run lint       # Linter
```

### Backend
```bash
cd backend
npm run dev        # Iniciar con nodemon (--watch)
npm run db:generate  # Generar Prisma client
npm run db:push    # Push schema a DB
npm run db:studio  # Abrir Prisma Studio
```

---

## Reglas para Agentes

1. **NO escribir código sin entender el modelo de datos** — leer `schema.prisma` primero
2. **Seguir la estructura de hooks** — crear nuevos hooks en `src/hooks/`, no lógica inline en componentes
3. **Usar TypeScript** — siempre que sea posible en frontend
4. **Mantener componentes pequeños** —分离UI de lógica (container/presentational pattern)
5. **No hardcodear credenciales** — usar variables de entorno (`.env`)
6. **Tailwind v4** — usar clases de utilidad, NO escribir CSS personalizado a menos que sea necesario

---

## Variables de Entorno

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/tinpet
JWT_SECRET=your-secret-key
PORT=3001
```

---

## Skills Locales Disponibles

El proyecto tiene skills configurados en `.agents/skills/`:

| Skill | Descripción |
|-------|-------------|
| `find-skills` | Busca e instala skills del ecosistema (`npx skills find`) |
| `vercel-react-best-practices` | 62 reglas de optimización React/Next.js de Vercel Engineering |

### Reglas Aplicables al Proyecto

**Prioridad CRITICAL:**
- `async-parallel` → Fetch de pets + usuario en paralelo, no secuencial
- `bundle-dynamic-imports` → Lazy load del dashboard de shelter

**Prioridad MEDIUM:**
- `rerender-memo` → Memoizar listas de pets
- `rerender-transitions` → Transiciones suaves en filtros
- `js-cache-property-access` → Cachear objetos en loops

---

## Estado Actual del Proyecto

- ✅ Backend con Express + Prisma funcionando
- ✅ Auth con JWT (login/register)
- ✅ Frontend con Vite + React
- ⚠️ App.tsx muy básico (solo muestra JSON de pets)
- ⚠️ UI de mascotas incompleta
- ⚠️ Falta dashboard para shelters
- ⚠️ Falta vista para adopters
