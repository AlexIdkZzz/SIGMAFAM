# Changelog — SIGMAFAM

Sistema Integral de Gestión y Monitoreo Familiar  
Proyecto académico · CETI Tonalá · 2026

Todos los cambios notables de este proyecto están documentados en este archivo.  
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [1.3.0] — 2026-05-22

### Añadido
- **Página de Términos de Servicio** (`/terminos`): 16 artículos completos con definiciones, uso aceptable y prohibido, grupos familiares, sistema de alertas, dispositivos IoT, propiedad intelectual, limitación de responsabilidad, aviso de emergencias, modificaciones, terminación de cuenta, ley aplicable (LFPDPPP · Jalisco, México) y contacto.
- **Página de Política de Privacidad** (`/privacidad`): 14 secciones que cubren responsable del tratamiento, datos recopilados (con tabla detallada), datos que NO se recopilan, finalidad, base legal, compartición con terceros, transferencias internacionales, seguridad, retención, derechos ARCO (con tarjetas visuales A/R/C/O), cookies y localStorage, menores de edad, cambios y enlace al INAI.
- Ambas páginas incluyen: tabla de contenidos lateral con **scroll-spy**, modo claro/oscuro independiente, diseño responsivo y acceso sin autenticación.
- **Pie legal en Login y Register**: links funcionales a `/terminos`, `/privacidad` y al PDF oficial de la LFPDPPP (Diputados.gob.mx). Visible en la parte inferior izquierda del panel de formulario.
- Rutas públicas `/terminos` y `/privacidad` registradas en `AppRouter`.

### Corregido
- **Dashboard — pantalla blanca / azul oscuro al entrar**: Se corrigió un `TypeError` que colapsaba todo el componente cuando una alerta activa no tenía coordenadas GPS (`lastLocation === null`). Se agregó un guard condicional que muestra *"Ubicación no disponible"* en lugar de intentar leer `.lat` de `null`. ([`144205d`])

---

## [1.2.0] — 2026-05-11 / 2026-05-19

### Añadido
- **Nivel de batería del dispositivo IoT**: El endpoint `POST /api/v1/iot/alert` ahora recibe y almacena el campo `battery` (entero 0-100). Se actualiza en la tabla `devices` como `battery_level` y se guarda en la alerta. Visible en la vista de Alertas. ([`3c1ea49`])
- **Notificaciones de alerta por correo electrónico**: Al dispararse una alerta (web o IoT), se envía automáticamente un correo HTML a todos los miembros del grupo familiar. El correo incluye: nombre del activador, hora (zona horaria Ciudad de México), origen (web/IoT), coordenadas GPS, mapa estático via OpenStreetMap y enlace directo a la alerta. ([`186b09d`], [`8f222fa`])
- **Panel de administración — métricas de dispositivos** (`GET /api/v1/admin/devices/metrics`): Vista enriquecida con `battery_level`, total de alertas del propietario, alertas activas y última ubicación registrada de cada dispositivo. ([`5e46ff6`])

### Cambiado
- El backend ahora usa **Resend** como proveedor de correo transaccional para todas las notificaciones de emergencia y correos del sistema (verificación, recuperación de contraseña).

---

## [1.1.0] — 2026-05-07 / 2026-05-10

### Añadido
- **Botón de pánico IoT completamente funcional**: Implementación de hardware físico con endpoint dedicado `POST /api/v1/iot/alert`. Autenticación por `device_uid`, soporte de coordenadas GPS y batería, registro de auditoría y notificaciones automáticas al activarse. ([`becd990`])
- **Migración de Twilio a Meta WhatsApp Cloud API**: Las notificaciones de emergencia por WhatsApp ahora se envían mediante la API oficial de Meta (WhatsApp Business). Soporte de plantilla `sigmafam_alerta` con nombre del usuario y URL de ubicación. ([`c543aaa`])
- **Filtros de alertas e historial**: Los usuarios pueden filtrar el historial por fecha, estado y fuente. Los administradores pueden exportar hasta 10,000 registros filtrados en formato JSON. ([`205ea0f`])
- **Sección Legal en Configuración** (`Settings → Legal e Información`): Términos y condiciones (5 artículos), descarga de responsabilidad con aviso del 911, política de privacidad con doble columna, contacto con redes sociales y FAQ con accordion. ([`c641e2c`])
- **Manual de usuario** interactivo accesible desde Configuración → Legal → Manual de Usuario. Cubre todas las funcionalidades de la plataforma con pasos detallados. ([`6044d0a`])
- **Menú desplegable de estado en alertas**: Cambio de estado de alertas (RECIBIDA → ATENDIDA → CERRADA) mediante un selector contextual en la vista de gestión. ([`82ade3c`])

### Corregido
- Permisos de visualización de **Familia** y **Contactos** para usuarios con roles `MIEMBRO` y `JEFE_FAMILIA`. Corrección de validación en `RequireAuth` y en la lógica del servidor. ([`dee1724`])
- Panel de **estadísticas** y sección de **tickets** que no cargaban correctamente en ciertos roles. ([`d700721`])
- Eliminación de botones de prueba y funciones de testing que habían quedado expuestos en producción. ([`6781970`])

---

## [1.0.0] — 2026-05-11 · Lanzamiento oficial

Primera versión estable y completa de SIGMAFAM, lista para uso en producción académica.

### Características completas al lanzamiento

**Autenticación y usuarios**
- Registro con nombre completo, correo y contraseña. Verificación obligatoria por correo (código de 6 dígitos, vigencia 15 min).
- Inicio de sesión con JWT (vigencia 7 días). Recuperación de contraseña por código temporal.
- Sistema de roles: `ADMIN`, `JEFE_FAMILIA`, `MIEMBRO`. Rutas protegidas por `RequireAuth` con validación de rol.

**Grupos familiares**
- Creación de grupo con nombre. Código de invitación de 8 dígitos regenerable.
- Unión al grupo por código. Máximo 6 miembros por grupo.
- El jefe puede eliminar miembros. Un usuario solo puede pertenecer a un grupo a la vez.

**Sistema de alertas**
- Activación manual desde la web con geolocalización opcional (GPS del navegador).
- Estados: `RECIBIDA`, `ACTIVA`, `ATENDIDA`, `CERRADA`. Registro de `closed_at` al cerrar.
- Historial paginado con filtros por estado, fuente y fecha. Coordenadas GPS almacenadas en tabla `alert_locations`.
- Notificación automática por WhatsApp a contactos de emergencia al activar alerta.

**Contactos de emergencia**
- Hasta 5 contactos por usuario. Alta, edición y eliminación. Canal WhatsApp.

**Dispositivos IoT**
- Generación de `device_uid` y `device_token` únicos. Vinculación y desvinculación. Un dispositivo por usuario.
- Endpoint `POST /api/v1/iot/alert` para recepción de alertas físicas.

**Dashboard**
- Resumen en tiempo real: alertas activas, totales, uptime, estado del dispositivo.
- Banner de alerta activa con ubicación y acciones rápidas. Tabla de actividad reciente.

**Mapa en tiempo real**
- Visualización de alertas activas con marcadores. Mapa de calor comunitario (OpenStreetMap + Leaflet).
- MiniMap en panel de detalle de alerta.

**Estadísticas**
- Gráficas de alertas por estado, por fuente (web/IoT) y por día (últimos 30 días).
- Tiempo promedio de resolución. Mapa de puntos calientes con intensidad.

**Panel de administración** (`/admin`)
- Gestión completa de usuarios, grupos, dispositivos y alertas del sistema.
- Exportación de datos. Auditoría con log de eventos paginado y filtrable.
- Gestión de tickets de soporte (ABRIR, EN REVISIÓN, CERRADO).

**Configuración del usuario**
- Cambio de contraseña. Apertura de tickets. Eliminación de cuenta con confirmación por contraseña.
- Alternancia de tema claro/oscuro (persistente en localStorage).

**PWA**
- Aplicación instalable como PWA en escritorio y móvil mediante Vite PWA Plugin y Service Worker.

---

## [0.9.0] — 2026-04-23 / 2026-05-06 · Refinamiento pre-lanzamiento

### Añadido
- **Mapa de calor comunitario** (Heatmap): Visualización de densidad de alertas históricas con colores de intensidad. Endpoint `GET /api/v1/heatmap`. ([`2373e91`])
- **Panel de administración** completo con secciones de Usuarios, Grupos, Dispositivos y Alertas globales. ([`55246c8`])
- **Página de Configuración** con cambio de contraseña y gestión de sesión. ([`6efb78e`])
- **Auditoría de eventos** con registro automático de acciones críticas (`LOGIN`, `USER_REGISTER`, `ALERT_STATUS_CHANGE`, etc.).
- Soporte responsivo completo para móvil en todas las secciones. ([`602eb30`])
- Botón de regreso en la vista de `/family`. ([`1b2b49c`])

### Cambiado
- Rediseño visual completo de la interfaz: nueva paleta de colores, componentes rediseñados, Topbar y Sidebar actualizados. ([`cd4c8bb`])
- Panel de administración con layout igual al de usuarios (coherencia visual). ([`1081c91`])
- Auditoría restringida exclusivamente a usuarios con rol `ADMIN`. ([`66312fb`])

### Corregido
- Error de parseo JSON en respuestas del servidor (`JSON.parse unexpected character`). ([`79d22e7`])
- Problemas de dependencias con plugins de Vite. ([`e6f573e`])
- Modo oscuro no aplicado correctamente en múltiples componentes. ([`772bd62`])
- Panel de admin no visible para administradores con cuenta normal. ([`4ce6080`])
- Múltiples correcciones en Familia y Contactos para todos los roles. ([`dee1724`])

---

## [0.8.1] — 2026-04-23 · PWA y limpieza

### Añadido
- **Aplicación instalable (PWA)**: Configuración de Service Worker con `vite-plugin-pwa`. Notificaciones de nueva versión disponible y modo offline. ([`8b7e615`])

### Cambiado
- Limpieza general del proyecto: eliminación de archivos, rutas y componentes no utilizados. ([`72f15f2`])

---

## [0.8.0] — 2026-04-23

### Añadido
- Primer panel de administrador funcional.
- Diseño responsivo inicial para pantallas móviles.
- Integración de `lucide-react` como biblioteca de íconos principal.

### Corregido
- Errores de autenticación en el flujo de login.

---

## [0.7.0] — 2026-04-23

### Añadido
- Sistema de autenticación completo: registro, verificación por correo, login, JWT.
- Rutas protegidas con `RequireAuth`.
- Vista de Login y Register con modo oscuro.

---

## [0.6.x] — 2026-04-23

### Añadido
- Estructura base del proyecto (Vite + React + Tailwind CSS).
- Backend Node.js + Express + MySQL con `mysql2`.
- Conexión a base de datos mediante pool de conexiones.
- Endpoints iniciales de autenticación y alertas.
- Middleware `authRequired` para validación de JWT.

---

## [0.5.x] — Desarrollo inicial

### Añadido
- Prototipo inicial de la interfaz de usuario.
- Modelos de base de datos: `users`, `alerts`, `alert_locations`, `devices`, `family_groups`, `emergency_contacts`.
- Flujo básico de creación y consulta de alertas.

---

## [0.4.0] — Primera versión funcional

### Añadido
- Primer commit con estructura del proyecto.
- Configuración inicial de entorno (`.env`, CORS, rutas base).
- Primer render de la aplicación React en desarrollo local.

---

*Desarrollado por el equipo SIGMAFAM — CETI Tonalá, Guadalajara, Jalisco, México · 2026*  
*Contacto: sigmafam@castoresceti.com*
