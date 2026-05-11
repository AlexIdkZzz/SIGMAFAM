# Changelog — SIGMAFAM

Todos los cambios notables de este proyecto están documentados aquí.  
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [1.0.0] — 2026-05-11 · Release oficial

### Añadido

#### Manual de Usuario
- **Nueva sub-vista "Manual de Usuario"** accesible desde "Legal e Información" en Configuración. Contiene 11 secciones acordeón expandibles con badges de rol, notas de advertencia/info/éxito y pasos numerados:
  1. ¿Qué es SIGMAFAM? — descripción del sistema y diferencias entre roles
  2. Registro e inicio de sesión — pasos detallados y recuperación de contraseña
  3. Dashboard — interpretación de tarjetas y alertas activas
  4. Gestión de Alertas — estados, activar desde la web, cambiar estado, ver detalle
  5. Mapa en vivo — marcadores, navegación y actualización en tiempo real
  6. Historial — todos los filtros disponibles y exportación
  7. Grupo Familiar — crear grupo, código de invitación, unirse, administrar miembros
  8. Contactos de Emergencia — agregar, formato de teléfono, notas sobre WhatsApp
  9. Dispositivo IoT — vincular, configurar hardware y desvincular
  10. Estadísticas — métricas, gráficas de tendencia y mapa de incidencia
  11. Configuración — tema, contraseña, tickets de soporte y eliminar cuenta

#### Filtros por fecha
- Campos **Desde / Hasta** en el historial de alertas para usuarios y administradores.
- Botón **"Limpiar filtros ✕"** que resetea todos los filtros activos de una sola vez.
- Backend: parámetros `date_from` y `date_to` añadidos a `GET /alerts/history` y `GET /admin/alerts`.

#### Exportación de datos (Admin)
- Botones en el panel de administración para descargar el historial completo de alertas en **JSON**, **XML** y **Excel/CSV**.
- Endpoint `GET /admin/alerts/export` sin paginación (hasta 10 000 registros), respetando los filtros de fecha activos.
- Generación de archivos 100 % en el cliente: sin dependencias extra de npm.

#### Estadísticas accesibles para Jefe de familia
- El panel de estadísticas ya está disponible para el rol `JEFE_FAMILIA` además de `ADMIN`.
- **ADMIN** recibe estadísticas globales (`WHERE 1=1`); **JEFE_FAMILIA** recibe las de su grupo via `_getScopeUserIds`.
- Estado de error diferenciado del spinner de carga, con botón **"Reintentar"** que re-dispara el fetch.

### Corregido

#### Backend — MySQL2
- **`POST /tickets`**: `CREATE TABLE IF NOT EXISTS tickets` usaba `pool.execute()`, que usa prepared statements internamente — MySQL no soporta DDL en modo preparado, por lo que la tabla nunca se creaba. Cambiado a `pool.query()`. Todas las queries del módulo de tickets migradas a parámetros nombrados (`:name`) para ser consistentes con la configuración global `namedPlaceholders: true` del pool.
- **`DELETE /user/account`**: queries de verificación de contraseña y borrado migradas a parámetros nombrados.

#### Frontend — Control de acceso
- **`RequireAuth`**: el operador `??` para el fallback de rol (`user.role ?? "MIEMBRO"`) no capturaba cadenas vacías `""`. Cambiado a `||`, igual que el Sidebar, eliminando el falso "Acceso denegado" en Familia y Contactos para usuarios con `role = ""` en la base de datos.
- **`AuthContext`**: los tres puntos de normalización de rol (`login`, `updateAuth`, rehidratación desde localStorage) actualizados de `??` a `||` para que una cadena vacía se convierta en `null` antes de propagarse.

---

## [0.9.9] — 2026-05-10

### Añadido

#### Gestión de Alertas
- **Selector de estado en tabla de alertas**: menú desplegable en cada fila para cambiar el estado a `ATTENDED` o `CLOSED` sin salir de la lista.
- **Panel de detalle de alerta ("Ver Detalle")**: drawer lateral con información completa — usuario que activó la alerta, grupo familiar, dispositivo IoT vinculado y mini-mapa de ubicación con Leaflet.

#### Configuración — Sección Legal
- **Sub-vista "Legal e Información"**: las secciones legales se agruparon en una fila navegable dentro de Configuración que abre una vista dedicada.
- **Términos y Condiciones**: 5 cláusulas sobre uso aceptable, responsabilidades y modificaciones del servicio.
- **Descarga de Responsabilidad**: aviso prominente aclarando que SIGMAFAM es un proyecto académico que no reemplaza a los servicios de emergencia oficiales (911).
- **Política de Privacidad**: 5 secciones — datos recopilados, uso, compartición con terceros, seguridad técnica y derechos del usuario.
- **Contacto y Redes Sociales**: enlaces a `sigmafam@castoresceti.com`, Instagram `@alexidk_zzz` y GitHub `AlexIdkZzz`. Íconos implementados como SVG inline para evitar dependencia de versiones de `lucide-react` que ya no exportan íconos de marca.
- **Preguntas Frecuentes (FAQ)**: acordeón con 5 preguntas y respuestas comunes sobre el sistema.

#### Configuración — Nuevas secciones funcionales
- **Sistema de tickets de soporte**: los usuarios pueden abrir solicitudes en 6 categorías (`REMOVE_FROM_GROUP`, `DELETE_DATA`, `CHANGE_NAME`, `CHANGE_PASSWORD`, `BUG_REPORT`, `OTHER`) con descripción opcional. El historial de tickets del usuario aparece debajo del formulario con su estado actualizado.
- **Eliminar cuenta**: flujo de 3 pasos con doble confirmación y verificación de contraseña. El backend registra un evento de auditoría antes de ejecutar el borrado definitivo.

#### Panel de Administración — Tickets
- Nueva pestaña **"Tickets de soporte"** en el panel admin con tabla completa de solicitudes.
- Filtros por estado: `OPEN`, `IN_PROGRESS`, `CLOSED`.
- Modal de gestión por ticket: detalle completo, campo de nota interna del admin y botones para cambiar estado.
- Endpoints añadidos: `POST /tickets`, `GET /tickets/mine`, `GET /admin/tickets`, `PATCH /admin/tickets/:id`.

### Corregido
- **`PATCH /alerts/:id/status`**: el parámetro nombrado `:status` era usado dos veces en la misma expresión `CASE WHEN`, lo que hacía fallar a MySQL2. Se dividió en dos llamadas `pool.execute()` separadas: una para `CLOSED` (que también actualiza `closed_at = NOW()`) y otra para el resto de estados.
- **Drawer "Ver Detalle" nunca abría**: el componente `<Drawer>` estaba importado y en estado, pero no se renderizaba en el JSX de `Alerts.jsx`. Se añadió el render con `<AlertDetailPanel>` como children.
- **`GET /alerts/:id`**: la ruta tenía backslashes en lugar de forward slashes en el string de Express, por lo que nunca coincidía con ninguna petición.
- **Botones "Simular Alerta" eliminados** de `Alerts.jsx` y `Dashboard.jsx` — eran solo para pruebas internas y no deben estar en producción.
- Modo oscuro completo en el componente `_drawer.jsx` (`dark:bg-slate-950`, `dark:border-slate-800`).

---

## [0.9.8] — 2026-05-07

### Corregido
- Visibilidad de las secciones **Familia** y **Contactos** para todos los roles — un guard de ruta bloqueaba a usuarios cuyo rol venía en formato inesperado desde la base de datos.

---

## [0.9.7] — 2026-04-26

### Añadido
- **Panel de administración** (`/admin`): acceso exclusivo para `ADMIN` con vistas de usuarios, grupos, dispositivos y alertas del sistema. Middleware `adminRequired` para proteger todos los endpoints de administración.
- **Notificaciones por WhatsApp**: integración con Meta Cloud API para enviar mensajes al activarse una alerta, incluyendo nombre del usuario y enlace de ubicación.

### Corregido
- Errores de visualización y navegación en el panel de administración.

---

## [0.9.6] — 2026-04-23 · Primer despliegue

### Añadido

#### Autenticación
- Registro de usuarios con hash de contraseña bcrypt y verificación por correo (código de 6 dígitos, expira en 15 minutos).
- Inicio de sesión con JWT de 7 días de expiración.
- Recuperación de contraseña por correo con enlace de restablecimiento.
- Sistema de roles: `MIEMBRO`, `JEFE_FAMILIA` y `ADMIN` con guards en frontend (`RequireAuth`) y backend (`authRequired` / `adminRequired`).

#### Funcionalidades principales
- **Dashboard**: vista de alertas activas del grupo familiar en tiempo real con actualización automática.
- **Gestión de alertas** desde la web (origen `WEB`) con captura opcional de geolocalización del navegador.
- **Mapa en vivo** con Leaflet mostrando la posición de alertas activas del grupo familiar.
- **Historial de alertas** con filtros por estado y origen, y paginación configurable.
- **Grupo familiar**: crear grupo (asigna rol `JEFE_FAMILIA`), unirse con código de 8 dígitos, ver miembros y eliminarlos.
- **Contactos de emergencia**: CRUD completo con validación de formato internacional de teléfono.
- **Dispositivo IoT**: generación de credenciales `device_uid` / `device_token`, vinculación y desvinculación desde la app.
- **Estadísticas** (`/app/stats`, solo `JEFE_FAMILIA` y `ADMIN`): métricas de alertas, gráfica de tendencia de 30 días con Recharts y mapa de incidencia geográfica con Leaflet.
- **Auditoría** (`/app/audit`, solo `ADMIN`): log de todos los eventos del sistema con filtro por tipo de evento.
- **Configuración**: cambio de contraseña con validación y toggle de tema claro/oscuro persistido en contexto.

#### Infraestructura
- Backend Express.js con MySQL2 (`namedPlaceholders: true`) desplegado en Railway.
- Pool de conexiones a base de datos MySQL con soporte de transacciones.
- Frontend React + Vite + Tailwind CSS desplegado en Vercel.
- Modo oscuro completo con clases `dark:` de Tailwind en todos los componentes.
- React Router v6 con layouts anidados y guards de autenticación.

---

*SIGMAFAM — Proyecto de titulación CETI Tonalá 2026*  
*Yael De Alba 21300160 · Francisco Yañez 22300208 · Uziel Noriega 22300232 · Cristian Oñate 22300198*
