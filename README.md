# TinPet Web 🐾 - Panel de Control para Refugios y Clínicas Veterinarias

¡Bienvenido a **TinPet Web**! Esta plataforma es el centro de gestión administrativa para que los refugios de animales y clínicas veterinarias puedan gestionar mascotas, monitorizar solicitudes de adopción, chatear en tiempo real con los adoptantes y organizar las tareas diarias.

---

## 🛠️ Tecnologías Utilizadas

### 🌍 Frontend
- **Framework**: React + TypeScript
- **Bundler**: Vite
- **Estilos**: Tailwind CSS + Vanilla CSS (Ajustado con colores premium como `#ec4899`)
- **Gestión de Estado y Routing**: React Hooks + React Router DOM
- **Socket Client**: Socket.IO-client

### 💻 Backend
- **Runtime**: Node.js
- **Framework**: Express
- **ORM**: Prisma (con PostgreSQL)
- **Email**: Brevo Transactional API (con plantillas dinámicas)
- **Auth**: JWT + bcrypt
- **WebSocket**: Socket.IO

---

## 📂 Estructura del Repositorio

El repositorio está estructurado en dos partes principales:

```
tinpet-web/
├── backend/          # Servidor Express, Prisma y API REST/Sockets
└── frontend/         # Panel administrativo en React + Vite
```

---

## 🚀 Instalación y Desarrollo Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/juanklv2003/tinpet-app.git
cd tinpet-web
```

### 2. Configurar el Backend
1. Entrá a la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Instalá las dependencias:
   ```bash
   npm install
   ```
3. Creá o modificá el archivo `.env` en `backend/` con las siguientes variables:
   ```env
   DATABASE_URL="tu_url_de_postgresql"
   JWT_SECRET="tu_secreto_jwt"
   PORT=3000
   FRONTEND_URL=""
   BREVO_API_KEY="tu_api_key_de_brevo"
   ```
4. Corré las migraciones de Prisma y generá el cliente:
   ```bash
   npx prisma generate
   ```
5. Iniciá el servidor de desarrollo:
   ```bash
   npm run dev
   ```

### 3. Configurar el Frontend
1. Entrá a la carpeta `frontend`:
   ```bash
   cd ../frontend
   ```
2. Instalá las dependencias:
   ```bash
   npm install
   ```
3. Creá o modificá el archivo `.env` en `frontend/` con la URL del backend:
   ```env
   VITE_API_URL=""
   ```
4. Iniciá el servidor Vite:
   ```bash
   npm run dev
   ```

---

## ✨ Características Destacadas

### 1. Gestión Completa de Mascotas
- Registro, visualización con paginación local y edición de información detallada (nombre, especie, raza, fecha de nacimiento).
- Asignación de empleados a cargo de cada mascota.
- Modal de confirmación premium antes de la eliminación de una mascota.

### 2. Sistema de Mensajería y Solicitudes
- Gestión en tiempo real de chats y matches entre adoptantes y refugios/clínicas.
- Panel lateral con el historial de mensajes, con vistas de Chats Activos, Archivados y Bloqueados.
- Placeholder de imágenes en el listado para evitar ver URLs en crudo (`📷 Imagen`).

### 3. Monitorización Avanzada
- Checklist del día 100% limpia y transparente para registrar el progreso y tareas de los empleados del refugio.

### 4. Emails Transaccionales de Bienvenida (Brevo)
- Integración automática con Brevo API para disparar la plantilla #28 cuando un nuevo usuario se registra por primera vez en la app.

---

## 🎨 Diseño y UX
- **Tema Oscuro y Claro**: Soporte completo y persistente en todo el dashboard.
- **Acción Rápida**: Modales con bordes curvos de gran radio (`rounded-2xl`) y transiciones de 280ms suaves para una experiencia de usuario premium y fluida.
