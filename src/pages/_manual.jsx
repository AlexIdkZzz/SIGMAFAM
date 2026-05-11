import React, { useState } from "react";
import {
  ArrowLeft, BookOpen, Bell, Map, Clock, Users, Phone,
  Cpu, BarChart2, Settings, ChevronDown, AlertTriangle,
  UserCheck, LogIn, ShieldCheck, Zap, Eye, Filter,
  Download, UserPlus, Link, Unlink, Lock, Ticket,
  Trash2, Sun, CheckCircle2, Info,
} from "lucide-react";

/* ──────────────────────────────────────────────────
   ATOMS
────────────────────────────────────────────────── */
function RoleBadge({ role }) {
  const map = {
    MIEMBRO:      "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    JEFE_FAMILIA: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    ADMIN:        "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  };
  const label = { MIEMBRO: "Miembro", JEFE_FAMILIA: "Jefe de familia", ADMIN: "Admin" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${map[role]}`}>
      {label[role]}
    </span>
  );
}

function Note({ type = "info", children }) {
  const styles = {
    info:    "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20 text-sky-800 dark:text-sky-200",
    warning: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-200",
    success: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-200",
  }[type];
  const Icon = type === "warning" ? AlertTriangle : type === "success" ? CheckCircle2 : Info;
  return (
    <div className={`flex gap-2.5 px-4 py-3 rounded-xl border text-sm leading-relaxed ${styles}`}>
      <Icon size={15} className="flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <div className="flex gap-3.5 py-3 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-black flex items-center justify-center mt-0.5">
        {n}
      </span>
      <div className="space-y-1">
        {title && <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</p>}
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function ManualSection({ icon: Icon, id, title, roles = [], accent = "slate", children }) {
  const [open, setOpen] = useState(false);

  const accents = {
    slate:   { pill: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400", ring: "ring-slate-200 dark:ring-slate-700" },
    sky:     { pill: "bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400",       ring: "ring-sky-200 dark:ring-sky-500/30" },
    violet:  { pill: "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400", ring: "ring-violet-200 dark:ring-violet-500/30" },
    emerald: { pill: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-200 dark:ring-emerald-500/30" },
    amber:   { pill: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",   ring: "ring-amber-200 dark:ring-amber-500/30" },
    red:     { pill: "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400",       ring: "ring-red-200 dark:ring-red-500/30" },
    indigo:  { pill: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400", ring: "ring-indigo-200 dark:ring-indigo-500/30" },
  }[accent] ?? { pill: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400", ring: "ring-slate-200 dark:ring-slate-700" };

  return (
    <div id={id} className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1628] overflow-hidden ring-1 ${accents.ring}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accents.pill}`}>
            <Icon size={17} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</p>
              {roles.map(r => <RoleBadge key={r} role={r} />)}
            </div>
          </div>
        </div>
        <ChevronDown size={15} className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────
   MANUAL VIEW
────────────────────────────────────────────────── */
export default function ManualView({ onBack }) {
  return (
    <div className="space-y-5">

      {/* Botón volver */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={15} /> Volver a Legal e Información
      </button>

      {/* Cabecera */}
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 border border-slate-700 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 shadow-inner">
          <BookOpen size={22} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1">SIGMAFAM · Versión 1.0</p>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Manual de Usuario</h1>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Guía completa para entender y usar todas las funciones del sistema. Toca cada sección para expandirla.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <RoleBadge role="MIEMBRO" />
            <RoleBadge role="JEFE_FAMILIA" />
            <RoleBadge role="ADMIN" />
          </div>
        </div>
      </div>

      {/* Índice rápido */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1628] p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Contenido</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
          {[
            ["Introducción",         "#intro"],
            ["Primeros pasos",       "#start"],
            ["Dashboard",            "#dashboard"],
            ["Alertas",              "#alerts"],
            ["Mapa en vivo",         "#map"],
            ["Historial",            "#history"],
            ["Grupo Familiar",       "#family"],
            ["Contactos",            "#contacts"],
            ["Dispositivo IoT",      "#device"],
            ["Estadísticas",         "#stats"],
            ["Configuración",        "#settings"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium py-0.5"
            >
              → {label}
            </a>
          ))}
        </div>
      </div>

      {/* ── 1. Introducción ── */}
      <ManualSection id="intro" icon={BookOpen} title="1. ¿Qué es SIGMAFAM?" accent="slate">
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <strong className="text-slate-800 dark:text-slate-200">SIGMAFAM</strong> (Sistema Integral de Gestión y Monitoreo Familiar) es una plataforma de seguridad familiar que permite activar alertas de emergencia geolocalizadas, notificar a contactos de confianza por WhatsApp, y coordinar la respuesta entre los miembros de tu grupo familiar en tiempo real.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
          {[
            { color: "bg-blue-500", label: "Miembro", desc: "Usuario básico. Puede activar alertas, ver el mapa, historial y gestionar su perfil." },
            { color: "bg-violet-500", label: "Jefe de familia", desc: "Crea y administra el grupo familiar, ve las alertas de todos los miembros y accede a estadísticas." },
            { color: "bg-red-500", label: "Admin", desc: "Acceso total al sistema: gestiona usuarios, grupos, dispositivos y tiene panel administrativo." },
          ].map(({ color, label, desc }) => (
            <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">{label}</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <Note type="warning">
          SIGMAFAM es un proyecto académico del CETI Tonalá 2026. <strong>No reemplaza</strong> a los servicios de emergencia oficiales. En caso de peligro real, llama al <strong>911</strong>.
        </Note>
      </ManualSection>

      {/* ── 2. Primeros pasos ── */}
      <ManualSection id="start" icon={LogIn} title="2. Registro e inicio de sesión" accent="sky"
        roles={["MIEMBRO", "JEFE_FAMILIA", "ADMIN"]}>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Crear una cuenta</p>
        <Step n="1" title="Abre la página de registro">
          Ingresa a la aplicación y haz clic en <strong>"Crear cuenta"</strong> en la pantalla de inicio de sesión.
        </Step>
        <Step n="2" title="Completa el formulario">
          Ingresa tu <strong>nombre completo</strong>, <strong>correo electrónico</strong> y una <strong>contraseña</strong> de al menos 6 caracteres.
        </Step>
        <Step n="3" title="Verifica tu correo">
          Recibirás un correo con un <strong>código de 6 dígitos</strong>. Ingrésalo en la pantalla de verificación. El código expira en 15 minutos.
        </Step>
        <Step n="4" title="Inicia sesión">
          Una vez verificado, usa tu correo y contraseña para entrar. Serás redirigido al Dashboard.
        </Step>

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 mt-3">Recuperar contraseña</p>
        <Step n="1" title="Haz clic en «¿Olvidaste tu contraseña?»">
          En la pantalla de inicio de sesión encontrarás este enlace debajo del botón principal.
        </Step>
        <Step n="2" title="Ingresa tu correo">
          Se te enviará un enlace para restablecer tu contraseña. El enlace expira en 15 minutos.
        </Step>
        <Step n="3" title="Establece tu nueva contraseña">
          Sigue el enlace del correo, ingresa y confirma tu nueva contraseña. Luego inicia sesión normalmente.
        </Step>
        <Note type="info">
          Tu sesión dura 7 días. Si cierras el navegador, puedes volver sin iniciar sesión nuevamente durante ese periodo.
        </Note>
      </ManualSection>

      {/* ── 3. Dashboard ── */}
      <ManualSection id="dashboard" icon={Zap} title="3. Dashboard" accent="amber"
        roles={["MIEMBRO", "JEFE_FAMILIA", "ADMIN"]}>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          El Dashboard es la pantalla principal. Muestra en tiempo real las alertas activas de tu grupo familiar.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {[
            { title: "Alertas activas", desc: "Tarjetas con cada alerta en curso: quién la activó, cuándo y desde dónde." },
            { title: "Estado de la alerta", desc: "Cada tarjeta muestra el estado actual: Recibida, Activa, Atendida o Cerrada." },
            { title: "Ubicación", desc: "Si la alerta incluye coordenadas GPS, se muestra un mini-mapa con la posición." },
            { title: "Actualización", desc: "Los datos se actualizan automáticamente. También puedes pulsar el botón de refrescar." },
          ].map(({ title, desc }) => (
            <div key={title} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-3">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">{title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <Note type="info">
          Si no hay alertas activas, el Dashboard mostrará un mensaje indicando que todo está en calma.
        </Note>
      </ManualSection>

      {/* ── 4. Alertas ── */}
      <ManualSection id="alerts" icon={Bell} title="4. Gestión de Alertas" accent="red"
        roles={["MIEMBRO", "JEFE_FAMILIA", "ADMIN"]}>

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Estados de una alerta</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {[
            { label: "Recibida",  color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",     desc: "El sistema registró la alerta." },
            { label: "Activa",    color: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",         desc: "Alerta en curso, requiere atención." },
            { label: "Atendida",  color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300", desc: "Alguien está atendiendo la situación." },
            { label: "Cerrada",   color: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",    desc: "Alerta resuelta y archivada." },
          ].map(({ label, color, desc }) => (
            <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 text-center space-y-1">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>{label}</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{desc}</p>
            </div>
          ))}
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Cómo activar una alerta desde la web</p>
        <Step n="1" title="Ve a la sección «Alertas»">
          Haz clic en <strong>Alertas</strong> en la barra lateral izquierda.
        </Step>
        <Step n="2" title="Pulsa el botón de alerta">
          Localiza el botón <strong>"Enviar Alerta"</strong> en la parte superior de la pantalla y confírmalo.
        </Step>
        <Step n="3" title="El sistema actúa automáticamente">
          SIGMAFAM registra tu ubicación (si diste permiso al navegador), crea la alerta y envía notificaciones por WhatsApp a todos tus contactos de emergencia.
        </Step>

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 mt-3">Cambiar el estado de una alerta</p>
        <Step n="1" title="Localiza la alerta en la tabla">
          En la sección <strong>Alertas</strong> verás la lista de alertas activas.
        </Step>
        <Step n="2" title="Usa el selector de estado">
          En la columna <strong>"Estado"</strong>, haz clic en el botón actual de la alerta. Aparecerá un menú desplegable con las opciones disponibles: <em>Atendida</em> o <em>Cerrada</em>.
        </Step>
        <Step n="3" title="Ver el detalle completo">
          Haz clic en el botón <strong>"Ver Detalle"</strong> (ícono de panel) para abrir un panel lateral con toda la información: usuario, grupo, dispositivo y ubicación en el mapa.
        </Step>
        <Note type="warning">
          Solo el <strong>Jefe de familia</strong> y el <strong>Admin</strong> pueden cerrar alertas de otros miembros de su grupo.
        </Note>
      </ManualSection>

      {/* ── 5. Mapa en vivo ── */}
      <ManualSection id="map" icon={Map} title="5. Mapa en vivo" accent="emerald"
        roles={["MIEMBRO", "JEFE_FAMILIA", "ADMIN"]}>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          El Mapa en vivo muestra la posición geográfica de las alertas activas de tu grupo familiar sobre un mapa interactivo.
        </p>
        <div className="space-y-0.5 mt-2">
          <Step n="1" title="Marcadores de alerta">
            Cada alerta activa con ubicación aparece como un marcador en el mapa. Al hacer clic en él se muestra el nombre del usuario y la hora de la alerta.
          </Step>
          <Step n="2" title="Zoom y navegación">
            Usa la rueda del ratón o los controles del mapa para acercar o alejar. Arrastra para mover la vista.
          </Step>
          <Step n="3" title="Actualización automática">
            Las posiciones se actualizan en tiempo real. Si una alerta nueva entra con ubicación, aparece en el mapa sin necesidad de recargar.
          </Step>
        </div>
        <Note type="info">
          Las alertas sin coordenadas GPS (por ejemplo, si el usuario no concedió permisos de ubicación) no aparecen en el mapa, pero sí en la lista de alertas.
        </Note>
      </ManualSection>

      {/* ── 6. Historial ── */}
      <ManualSection id="history" icon={Clock} title="6. Historial de Alertas" accent="slate"
        roles={["MIEMBRO", "JEFE_FAMILIA", "ADMIN"]}>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          El Historial registra <strong>todas</strong> las alertas generadas, incluyendo las ya cerradas. Es útil para revisar incidentes pasados y analizar patrones.
        </p>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 mt-3">Filtros disponibles</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { icon: Filter, title: "Por estado", desc: "Filtra entre Todos, Recibida, Activa, Atendida o Cerrada." },
            { icon: Filter, title: "Por origen", desc: "Filtra entre alertas Web (enviadas desde la app) o IoT (desde el dispositivo físico)." },
            { icon: Clock,  title: "Por fecha «Desde»", desc: "Muestra solo las alertas creadas a partir de una fecha específica." },
            { icon: Clock,  title: "Por fecha «Hasta»", desc: "Combina con «Desde» para definir un rango de fechas exacto." },
          ].map(({ icon: Ic, title, desc }) => (
            <div key={title} className="flex gap-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-3.5 py-3">
              <Ic size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Note type="success">
          Para limpiar todos los filtros a la vez, haz clic en el botón <strong>"Limpiar filtros ✕"</strong> que aparece cuando al menos un filtro está activo.
        </Note>
        <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-4 py-3">
          <Download size={15} className="flex-shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-0.5">Exportar datos <RoleBadge role="ADMIN" /></p>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
              El panel de administración incluye botones para exportar el historial completo en formato <strong>JSON</strong>, <strong>XML</strong> o <strong>Excel/CSV</strong>. Los filtros de fecha se aplican también a la exportación.
            </p>
          </div>
        </div>
      </ManualSection>

      {/* ── 7. Grupo Familiar ── */}
      <ManualSection id="family" icon={Users} title="7. Grupo Familiar" accent="violet"
        roles={["JEFE_FAMILIA", "MIEMBRO"]}>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          El grupo familiar conecta a los usuarios entre sí. Cuando alguien del grupo activa una alerta, todos los miembros la pueden ver en tiempo real.
        </p>

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 mt-3">
          Crear un grupo <RoleBadge role="JEFE_FAMILIA" />
        </p>
        <Step n="1" title="Ve a «Familia»">Haz clic en <strong>Familia</strong> en el menú lateral.</Step>
        <Step n="2" title="Haz clic en «Crear grupo»">
          Ingresa un nombre para tu grupo familiar y confirma. Se te asignará automáticamente el rol de <strong>Jefe de familia</strong>.
        </Step>
        <Step n="3" title="Comparte el código de invitación">
          Una vez creado el grupo, verás un <strong>código de 8 dígitos</strong>. Compártelo con las personas que quieres agregar.
        </Step>
        <Step n="4" title="Regenerar el código">
          Si el código fue comprometido, usa el botón <strong>"Nuevo código"</strong> para generar uno diferente. El código anterior queda inválido.
        </Step>

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 mt-3">
          Unirse a un grupo <RoleBadge role="MIEMBRO" />
        </p>
        <Step n="1" title="Ve a «Familia»">Si aún no perteneces a un grupo, verás la opción de unirte.</Step>
        <Step n="2" title="Ingresa el código de invitación">
          Escribe el código de 8 dígitos que te proporcionó el Jefe de familia y pulsa <strong>"Unirse"</strong>.
        </Step>
        <Step n="3" title="Confirma tu acceso">
          Ahora formas parte del grupo y puedes ver las alertas del resto de los miembros.
        </Step>

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 mt-3">
          Administrar miembros <RoleBadge role="JEFE_FAMILIA" />
        </p>
        <Step n="1" title="Consulta la lista de miembros">
          En la vista del grupo verás a cada integrante con su nombre, correo y rol.
        </Step>
        <Step n="2" title="Eliminar un miembro">
          Haz clic en el ícono de eliminar junto al miembro. Se le revocará el acceso al grupo y sus alertas futuras no serán visibles para el resto.
        </Step>
        <Note type="warning">
          El Jefe de familia no puede abandonar el grupo si hay otros miembros activos. Primero debe eliminar a todos los miembros o transferir el liderazgo.
        </Note>
      </ManualSection>

      {/* ── 8. Contactos ── */}
      <ManualSection id="contacts" icon={Phone} title="8. Contactos de Emergencia" accent="sky"
        roles={["MIEMBRO", "JEFE_FAMILIA", "ADMIN"]}>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Los contactos de emergencia son las personas que recibirán un mensaje de WhatsApp con tu ubicación cada vez que se active una alerta desde tu cuenta.
        </p>
        <Step n="1" title="Ve a «Contactos»">Haz clic en <strong>Contactos</strong> en el menú lateral.</Step>
        <Step n="2" title="Agrega un contacto">
          Pulsa <strong>"Agregar contacto"</strong>, ingresa el nombre y el número de teléfono en formato internacional.
        </Step>
        <Step n="3" title="Formato del teléfono">
          Usa el formato <strong>+52XXXXXXXXXX</strong> para México (sin espacios ni guiones). Ejemplo: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">+5233XXXXXXXX</code>
        </Step>
        <Step n="4" title="Editar o eliminar">
          Cada contacto tiene botones de editar (lápiz) y eliminar (papelera). Los cambios son inmediatos.
        </Step>
        <Note type="warning">
          El número debe tener WhatsApp activo. Si el número no tiene WhatsApp, el mensaje no llegará aunque el sistema lo intente enviar.
        </Note>
        <Note type="info">
          Para que las alertas sean efectivas, agrega al menos <strong>2 contactos</strong> de confianza.
        </Note>
      </ManualSection>

      {/* ── 9. Dispositivo IoT ── */}
      <ManualSection id="device" icon={Cpu} title="9. Dispositivo IoT" accent="indigo"
        roles={["MIEMBRO", "JEFE_FAMILIA", "ADMIN"]}>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          El dispositivo IoT es un hardware físico (por ejemplo, un botón de pánico) que se conecta al sistema y puede activar alertas automáticamente sin necesidad de abrir la app.
        </p>

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 mt-2">Vincular tu dispositivo</p>
        <Step n="1" title="Ve a «Dispositivo»">Haz clic en <strong>Dispositivo</strong> en el menú lateral.</Step>
        <Step n="2" title="Genera las credenciales">
          Haz clic en <strong>"Generar dispositivo"</strong>. El sistema creará un <strong>Device UID</strong> y un <strong>Device Token</strong> únicos para tu cuenta.
        </Step>
        <Step n="3" title="Configura el hardware">
          Copia el <em>Device UID</em> y el <em>Device Token</em> e ingrésalos en la configuración de tu hardware IoT (consulta el manual del fabricante o del kit académico).
        </Step>
        <Step n="4" title="Prueba la conexión">
          Al presionar el botón físico del dispositivo, debería aparecer una nueva alerta de origen <strong>"IoT"</strong> en la sección de Alertas.
        </Step>

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 mt-3">Desvincular el dispositivo</p>
        <Step n="1">En la vista del dispositivo, haz clic en <strong>"Desvincular"</strong>.</Step>
        <Step n="2">Confirma la acción. El Device UID y Token actuales quedan inválidos. Puedes generar nuevas credenciales en cualquier momento.</Step>
        <Note type="warning">
          <strong>Guarda el Device Token</strong> en un lugar seguro; solo se muestra una vez. Si lo pierdes, tendrás que desvincularlo y generar uno nuevo.
        </Note>
      </ManualSection>

      {/* ── 10. Estadísticas ── */}
      <ManualSection id="stats" icon={BarChart2} title="10. Estadísticas y Métricas" accent="emerald"
        roles={["JEFE_FAMILIA", "ADMIN"]}>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          El panel de estadísticas ofrece un análisis visual de la actividad del sistema dentro del alcance del usuario (grupo familiar o sistema completo para Admin).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {[
            { title: "Total de alertas",      desc: "Contador acumulado de todas las alertas registradas en tu grupo." },
            { title: "Alertas críticas",      desc: "Suma de alertas en estado Activa + Recibida que aún requieren atención." },
            { title: "Atendidas",             desc: "Alertas que ya tienen seguimiento asignado pero no están cerradas." },
            { title: "Tiempo promedio",       desc: "Minutos promedio entre la creación y el cierre de una alerta." },
            { title: "Tendencia 30 días",     desc: "Gráfica de barras con el número de alertas por día en el último mes." },
            { title: "Mapa de incidencia",    desc: "Mapa con puntos de calor mostrando dónde se concentran las alertas geográficamente." },
          ].map(({ title, desc }) => (
            <div key={title} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-3">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">{title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <Step n="→" title="Ver mapa de riesgo detallado">
          Al final de la página de estadísticas hay un botón para abrir el <strong>mapa de riesgo en pantalla completa</strong>, con mayor detalle de los puntos de incidencia.
        </Step>
        <Note type="info">
          El <strong>Admin</strong> ve estadísticas de todo el sistema. El <strong>Jefe de familia</strong> ve únicamente las de su grupo familiar.
        </Note>
      </ManualSection>

      {/* ── 11. Configuración ── */}
      <ManualSection id="settings" icon={Settings} title="11. Configuración" accent="slate"
        roles={["MIEMBRO", "JEFE_FAMILIA", "ADMIN"]}>

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Apariencia</p>
        <Step n="→" title="Cambiar tema">
          En la sección <strong>Apariencia</strong>, usa el interruptor o los botones <em>Claro / Oscuro</em> para cambiar el tema visual de la app. La preferencia se guarda automáticamente.
        </Step>

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 mt-3">Contraseña</p>
        <Step n="1" title="Ingresa tu contraseña actual">Esto verifica que eres tú quien solicita el cambio.</Step>
        <Step n="2" title="Ingresa y confirma la nueva">La nueva contraseña debe tener al menos 6 caracteres y las dos coincidencias deben ser idénticas.</Step>
        <Step n="3" title="Guarda el cambio">Haz clic en <strong>"Actualizar contraseña"</strong>. El cambio es inmediato.</Step>

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 mt-3">Abrir un ticket de soporte</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          Si necesitas ayuda o tienes una solicitud especial, puedes abrir un ticket directamente desde la app sin enviar correos.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { t: "Salir / eliminar del grupo familiar", d: "Solicita al equipo que te retire del grupo." },
            { t: "Eliminar mis datos del sistema",      d: "Solicita la eliminación total de tu cuenta y datos." },
            { t: "Cambiar mi nombre",                  d: "Pide un cambio de nombre en tu perfil." },
            { t: "Ayuda con contraseña",               d: "Si no puedes acceder y el correo de recuperación no funciona." },
            { t: "Reportar un error",                  d: "Describe el problema que encontraste para que lo corrijamos." },
            { t: "Otro",                               d: "Cualquier otra solicitud que no entre en las categorías anteriores." },
          ].map(({ t, d }) => (
            <div key={t} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{d}</p>
            </div>
          ))}
        </div>
        <Note type="info">
          El equipo de administración revisará tu ticket y podrás ver su estado (Abierto, En revisión, Resuelto) en la misma sección de configuración.
        </Note>

        <p className="text-[10px] font-black uppercase tracking-widest text-red-400 dark:text-red-500 mb-2 mt-3">Eliminar cuenta</p>
        <Step n="1">Desplázate al final de Configuración y localiza la sección <strong>Zona de peligro</strong>.</Step>
        <Step n="2">Haz clic en <strong>"Eliminar mi cuenta"</strong> y confirma dos veces para evitar borrados accidentales.</Step>
        <Step n="3">Ingresa tu contraseña actual como verificación final.</Step>
        <Note type="warning">
          <strong>Esta acción es irreversible.</strong> Se eliminarán tu cuenta, tus datos y tus contactos de emergencia. Las alertas históricas del grupo familiar se conservan, pero quedan sin referencia de usuario.
        </Note>
      </ManualSection>

      {/* Pie del manual */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1628] px-5 py-4 text-center space-y-1">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">SIGMAFAM · Manual de Usuario v1.0</p>
        <p className="text-xs text-slate-400 dark:text-slate-600">Proyecto de titulación CETI Tonalá 2026 · Yael De Alba · Francisco Yañez · Uziel Noriega · Cristian Oñate</p>
        <p className="text-xs text-slate-400 dark:text-slate-600">¿Tienes alguna duda? Escríbenos a <strong className="text-slate-500 dark:text-slate-400">sigmafam@castoresceti.com</strong></p>
      </div>

    </div>
  );
}
