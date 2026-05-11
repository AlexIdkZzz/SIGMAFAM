<div align="center">

<img src="https://img.shields.io/badge/versión-v1.0.0-0f172a?style=for-the-badge&labelColor=0f172a&color=3b82f6" />
<img src="https://img.shields.io/badge/estado-producción-0f172a?style=for-the-badge&labelColor=0f172a&color=22c55e" />
<img src="https://img.shields.io/badge/deploy-Vercel%20%2B%20Railway-0f172a?style=for-the-badge&labelColor=0f172a&color=6366f1" />
<img src="https://img.shields.io/badge/licencia-MIT-0f172a?style=for-the-badge&labelColor=0f172a&color=f59e0b" />

<br /><br />

# SIGMAFAM

### Sistema Integral de Gestión y Monitoreo Familiar

**Plataforma web + dispositivo IoT para alertas de emergencia en tiempo real.**  
Envía tu ubicación a tus contactos de confianza con un solo toque, desde la app o desde un botón físico.

<br />

[🌐 Ver demo en vivo](https://sigmafam.castoresceti.com) &nbsp;·&nbsp;
[📋 Changelog](./CHANGELOG.md) &nbsp;·&nbsp;
[📖 Manual de usuario](https://sigmafam.castoresceti.com/app/settings)

<br />

</div>

---

## ¿Qué es SIGMAFAM?

SIGMAFAM nació como proyecto de titulación en el **CETI Tonalá (2026)** con una premisa simple: cuando ocurre una emergencia, los segundos importan. El sistema conecta a los miembros de una familia a través de alertas geolocalizadas que llegan por WhatsApp a sus contactos de confianza, sin importar si se activan desde el navegador web o desde un botón IoT físico.

```
Usuario presiona botón  →  SIGMAFAM registra ubicación GPS
        │
        ├──▶  Notifica por WhatsApp a contactos de emergencia
        ├──▶  Alerta visible en tiempo real para el grupo familiar
        └──▶  Historial, métricas y seguimiento desde el panel
```

---

## Funcionalidades

### Para todos los usuarios
| Función | Descripción |
|---------|-------------|
| 🔔 **Alertas en tiempo real** | Activa una alerta desde la web o con el dispositivo IoT. El sistema registra tu ubicación y notifica a tus contactos por WhatsApp al instante. |
| 🗺️ **Mapa en vivo** | Visualiza la posición de las alertas activas de tu grupo sobre un mapa interactivo (OpenStreetMap + Leaflet). |
| 📋 **Historial filtrable** | Consulta todas las alertas pasadas con filtros por estado, origen y rango de fechas. |
| 👨‍👩‍👧 **Grupo familiar** | Únete a un grupo con un código de invitación de 8 dígitos y comparte el estado de las alertas con todos los miembros. |
| 📞 **Contactos de emergencia** | Gestiona los números de WhatsApp que recibirán tus alertas con ubicación incluida. |
| 📱 **Dispositivo IoT** | Vincula un hardware (ESP32 + GSM) a tu cuenta para activar alertas físicamente sin necesidad de abrir la app. |
| ⚙️ **Configuración completa** | Tema claro/oscuro, cambio de contraseña, tickets de soporte, sección legal y eliminación de cuenta. |

### Para Jefe de familia y Admin
| Función | Descripción |
|---------|-------------|
| 📊 **Estadísticas** | Métricas de actividad: total de alertas, tiempo promedio de respuesta, tendencia de 30 días y mapa de incidencia geográfica. |
| 👥 **Gestión de miembros** | Agrega o elimina miembros del grupo, regenera el código de invitación y controla quién tiene acceso. |

### Solo Admin
| Función | Descripción |
|---------|-------------|
| 🛡️ **Panel de administración** | Control total de usuarios, grupos, dispositivos y alertas del sistema. |
| 🎫 **Tickets de soporte** | Recibe, gestiona y responde las solicitudes de los usuarios con notas internas y cambio de estado. |
| 📤 **Exportación de datos** | Descarga el historial de alertas en **JSON**, **XML** o **Excel/CSV** con filtros aplicados. |
| 🔍 **Auditoría** | Log completo de todos los eventos del sistema: inicios de sesión, cambios de estado, registros y más. |

---

## Stack tecnológico

<table>
<tr>
<td valign="top" width="33%">

**Frontend**
- React 18 + Vite
- Tailwind CSS (dark mode)
- React Router v6
- React Context API
- Leaflet + react-leaflet
- Recharts
- Lucide React

</td>
<td valign="top" width="33%">

**Backend**
- Node.js + Express.js
- MySQL2 (`namedPlaceholders`)
- JWT (jsonwebtoken)
- bcrypt
- Resend (emails)
- Meta WhatsApp Cloud API

</td>
<td valign="top" width="33%">

**Infraestructura**
- Vercel (frontend)
- Railway (backend + MySQL)
- OpenStreetMap (mapas)
- dotenv (configuración)

</td>
</tr>
</table>

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Cliente (Vercel)                      │
│                                                         │
│   React SPA ──▶ AuthContext ──▶ React Router v6         │
│        │                            │                   │
│        │              ┌─────────────┴──────────┐        │
│        │              │  Páginas protegidas     │        │
│        │              │  RequireAuth + roles    │        │
│        │              └─────────────────────────┘        │
└────────┼────────────────────────────────────────────────┘
         │  HTTPS + JWT Bearer
         ▼
┌─────────────────────────────────────────────────────────┐
│                   API REST (Railway)                     │
│                                                         │
│   Express.js                                            │
│     ├── /api/v1/auth      → Registro, login, JWT        │
│     ├── /api/v1/alerts    → CRUD alertas + ubicación    │
│     ├── /api/v1/family    → Grupos y miembros           │
│     ├── /api/v1/contacts  → Contactos de emergencia     │
│     ├── /api/v1/devices   → Vinculación IoT             │
│     ├── /api/v1/stats     → Métricas y analytics        │
│     ├── /api/v1/tickets   → Soporte de usuarios         │
│     └── /api/v1/admin/*   → Panel administrativo        │
│                                                         │
│   Middlewares: authRequired · adminRequired             │
└────────┬────────────────────────────────────────────────┘
         │
         ├──▶  MySQL (Railway)
         ├──▶  Meta WhatsApp Cloud API
         └──▶  Resend (correos transaccionales)

┌─────────────────────────────────────────────────────────┐
│                  Dispositivo IoT                         │
│   ESP32 + SIM808L ──▶ POST /api/v1/iot/alert            │
│   Autenticación: device_uid + device_token              │
└─────────────────────────────────────────────────────────┘
```

---

## Roles del sistema

```
ADMIN
 └── Control total: usuarios, grupos, dispositivos, exportación, auditoría
      │
JEFE_FAMILIA
 └── Gestiona su grupo familiar, ve estadísticas, controla miembros
      │
MIEMBRO
 └── Activa alertas, consulta historial, gestiona contactos y dispositivo
```

Los roles se asignan automáticamente: al crear un grupo se obtiene `JEFE_FAMILIA`; al unirse a uno se es `MIEMBRO`. El rol `ADMIN` solo puede asignarlo otro administrador.

---

## Instalación y desarrollo local

### Requisitos previos
- Node.js 18+
- MySQL 8+
- Cuenta en Meta for Developers (para WhatsApp)
- Cuenta en Resend (para correos)

### 1. Clonar el repositorio

```bash
git clone https://github.com/AlexIdkZzz/sigmafam.git
cd sigmafam
```

### 2. Configurar el backend

```bash
cd backend
cp .env.example .env   # Completa las variables de entorno
npm install
node server.js
```

Variables de entorno requeridas en `backend/.env`:

```env
PORT=4000

DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASS=tu_contraseña
DB_NAME=sigmafam

JWT_SECRET=una_clave_larga_y_segura

META_WHATSAPP_TOKEN=
META_PHONE_NUMBER_ID=
META_WA_TEMPLATE_NAME=sigmafam_alerta

RESEND_API_KEY=
```

### 3. Configurar el frontend

```bash
cd ..          # volver a la raíz del proyecto
cp .env.example .env
npm install
npm run dev
```

Variables de entorno requeridas en `.env`:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

### 4. Abrir en el navegador

```
http://localhost:5173
```

---

## Estructura del proyecto

```
sigmafam/
├── backend/
│   ├── middleware/
│   │   └── auth.js           # Middleware JWT
│   ├── db.js                 # Pool MySQL2
│   ├── server.js             # API Express completa
│   └── .env
│
├── src/
│   ├── app/
│   │   ├── auth/             # AuthContext, RequireAuth
│   │   ├── alerts/           # AlertsContext (estado global)
│   │   ├── layout/           # AppLayout, Sidebar, TopBar
│   │   └── theme/            # ThemeContext (dark mode)
│   │
│   ├── pages/
│   │   ├── admin/            # AdminAlerts, AdminTickets, ...
│   │   ├── Alerts.jsx        # Gestión de alertas + drawer
│   │   ├── Dashboard.jsx
│   │   ├── History.jsx
│   │   ├── MapLive.jsx
│   │   ├── Stats.jsx
│   │   ├── Family.jsx
│   │   ├── Contacts.jsx
│   │   ├── Device.jsx
│   │   ├── Settings.jsx      # Config + Legal + Tickets
│   │   ├── _manual.jsx       # Manual de usuario
│   │   ├── _drawer.jsx       # Componente drawer lateral
│   │   └── _ui.jsx           # Atoms: PageShell, Card, Button...
│   │
│   └── main.jsx
│
├── CHANGELOG.md
└── README.md
```

---

## API — Endpoints principales

<details>
<summary><strong>Autenticación</strong></summary>

```
POST   /api/v1/auth/register          Registro de usuario
POST   /api/v1/auth/verify            Verificación de correo
POST   /api/v1/auth/login             Inicio de sesión → JWT
POST   /api/v1/auth/forgot-password   Solicitar reset de contraseña
POST   /api/v1/auth/reset-password    Establecer nueva contraseña
```
</details>

<details>
<summary><strong>Alertas</strong></summary>

```
GET    /api/v1/alerts/active          Alertas activas del grupo
GET    /api/v1/alerts/history         Historial paginado + filtros
GET    /api/v1/alerts/:id             Detalle de una alerta
POST   /api/v1/alerts                 Crear alerta (web)
PATCH  /api/v1/alerts/:id/status      Cambiar estado
```
</details>

<details>
<summary><strong>Familia, Contactos y Dispositivo</strong></summary>

```
POST   /api/v1/family/create          Crear grupo familiar
GET    /api/v1/family                 Info del grupo + miembros
DELETE /api/v1/family/members/:id     Eliminar miembro
POST   /api/v1/family/regenerate-code Nuevo código de invitación

GET    /api/v1/contacts               Lista de contactos
POST   /api/v1/contacts               Agregar contacto
PATCH  /api/v1/contacts/:id           Editar contacto
DELETE /api/v1/contacts/:id           Eliminar contacto

GET    /api/v1/devices/mine           Dispositivo vinculado
POST   /api/v1/devices/generate       Generar credenciales IoT
DELETE /api/v1/devices/mine           Desvincular dispositivo
```
</details>

<details>
<summary><strong>Estadísticas, Tickets y Cuenta</strong></summary>

```
GET    /api/v1/stats                  Métricas del grupo / sistema
GET    /api/v1/audit                  Log de auditoría

POST   /api/v1/tickets                Crear ticket de soporte
GET    /api/v1/tickets/mine           Mis tickets

PUT    /api/v1/user/change-password   Cambiar contraseña
DELETE /api/v1/user/account           Eliminar cuenta
```
</details>

<details>
<summary><strong>Panel Admin (requiere rol ADMIN)</strong></summary>

```
GET    /api/v1/admin/overview         Resumen del sistema
GET    /api/v1/admin/users            Lista de usuarios
PATCH  /api/v1/admin/users/:id        Editar usuario
DELETE /api/v1/admin/users/:id        Eliminar usuario

GET    /api/v1/admin/groups           Lista de grupos
DELETE /api/v1/admin/groups/:id       Eliminar grupo

GET    /api/v1/admin/alerts           Alertas con filtros
GET    /api/v1/admin/alerts/export    Exportar (JSON/XML/CSV)

GET    /api/v1/admin/tickets          Todos los tickets
PATCH  /api/v1/admin/tickets/:id      Gestionar ticket
```
</details>

---

## Seguridad

- Contraseñas almacenadas con **bcrypt** (salt rounds: 10). Nunca en texto plano.
- Sesiones basadas en **JWT** con expiración de 7 días.
- Comunicación frontend ↔ backend exclusivamente por **HTTPS**.
- Rutas del backend protegidas por middleware `authRequired` y `adminRequired`.
- Guards de rol en el frontend (`RequireAuth` con `allowRoles`).
- Sin cookies de sesión ni rastreo de terceros.

---

## Equipo

| Nombre | Control escolar | Rol |
|--------|----------------|-----|
| Yael De Alba | 21300160 | Desarrollo fullstack, arquitectura y diseño. CEO. |
| Francisco Yañez | 22300208 | Backend e integración IoT |
| Uziel Noriega | 22300232 | Frontend y UX |
| Cristian Oñate | 22300198 | Hardware IoT y comunicaciones |

---

## Licencia

Distribuido bajo licencia **MIT**. Consulta el archivo `LICENSE` para más información.

---

<div align="center">

**SIGMAFAM** — Proyecto de titulación · CETI Tonalá 2026

*Hecho con dedicación, café y muchas ganas. 🚀*

</div>
