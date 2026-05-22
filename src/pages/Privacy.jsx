import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield, Sun, Moon, Lock, FileText, Mail,
  Eye, EyeOff, Database, Share2, Clock,
  CheckCircle2, XCircle, AlertTriangle, Info,
  BookOpen, UserCheck, Globe, Scale, ChevronRight,
} from "lucide-react";

const UPDATED = "22 de mayo de 2026";
const EMAIL   = "sigmafam@castoresceti.com";

const TOC = [
  { id: "responsable",    n: "01", label: "Responsable del tratamiento" },
  { id: "recopilamos",    n: "02", label: "Datos que recopilamos" },
  { id: "no-recopilamos", n: "03", label: "Datos que NO recopilamos" },
  { id: "finalidad",      n: "04", label: "Finalidad del tratamiento" },
  { id: "base-legal",     n: "05", label: "Base legal" },
  { id: "terceros",       n: "06", label: "Compartición con terceros" },
  { id: "transferencias", n: "07", label: "Transferencias internacionales" },
  { id: "seguridad",      n: "08", label: "Seguridad de los datos" },
  { id: "retencion",      n: "09", label: "Retención de datos" },
  { id: "derechos",       n: "10", label: "Tus derechos (ARCO)" },
  { id: "cookies",        n: "11", label: "Cookies y almacenamiento local" },
  { id: "menores",        n: "12", label: "Menores de edad" },
  { id: "cambios",        n: "13", label: "Cambios a esta política" },
  { id: "contacto",       n: "14", label: "Contacto" },
];

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Pill({ d, children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border
      ${d ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500"}`}>
      {children}
    </span>
  );
}

function SectionBlock({ id, n, icon: Icon, title, accent = "slate", d, children }) {
  const accents = {
    slate:  { icon: d ? "bg-slate-800 text-slate-300"      : "bg-slate-100 text-slate-600",      badge: d ? "text-slate-500"   : "text-slate-400"   },
    sky:    { icon: d ? "bg-sky-500/20 text-sky-300"       : "bg-sky-50 text-sky-600",            badge: d ? "text-sky-500"     : "text-sky-600"     },
    red:    { icon: d ? "bg-red-500/20 text-red-300"       : "bg-red-50 text-red-600",            badge: d ? "text-red-400"     : "text-red-600"     },
    amber:  { icon: d ? "bg-amber-500/20 text-amber-300"   : "bg-amber-50 text-amber-600",        badge: d ? "text-amber-400"   : "text-amber-600"   },
    violet: { icon: d ? "bg-violet-500/20 text-violet-300" : "bg-violet-50 text-violet-600",      badge: d ? "text-violet-400"  : "text-violet-600"  },
    emerald:{ icon: d ? "bg-emerald-500/20 text-emerald-300":"bg-emerald-50 text-emerald-600",    badge: d ? "text-emerald-400" : "text-emerald-600" },
    indigo: { icon: d ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-600",      badge: d ? "text-indigo-400"  : "text-indigo-600"  },
  }[accent];

  return (
    <section id={id} className={`rounded-2xl border p-6 sm:p-7 scroll-mt-24 transition-colors
      ${d ? "bg-[#0f1628] border-slate-800" : "bg-white border-slate-200"}`}>
      <div className="flex items-start gap-4 mb-5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accents.icon}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[10px] font-black tracking-[0.2em] uppercase mb-1 ${accents.badge}`}>
            Sección {n}
          </div>
          <h2 className={`text-lg font-black tracking-tight ${d ? "text-slate-100" : "text-slate-900"}`}>
            {title}
          </h2>
        </div>
      </div>
      <div className={`space-y-3 text-sm leading-relaxed ${d ? "text-slate-400" : "text-slate-600"}`}>
        {children}
      </div>
    </section>
  );
}

function Callout({ type = "info", d, children }) {
  const styles = {
    warning: {
      wrap: d ? "bg-amber-500/10 border-amber-500/30" : "bg-amber-50 border-amber-200",
      text: d ? "text-amber-300" : "text-amber-800",
      icon: <AlertTriangle size={15} className={d ? "text-amber-400" : "text-amber-600"} />,
    },
    info: {
      wrap: d ? "bg-sky-500/10 border-sky-500/30" : "bg-sky-50 border-sky-200",
      text: d ? "text-sky-300" : "text-sky-800",
      icon: <Info size={15} className={d ? "text-sky-400" : "text-sky-600"} />,
    },
    success: {
      wrap: d ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200",
      text: d ? "text-emerald-300" : "text-emerald-800",
      icon: <CheckCircle2 size={15} className={d ? "text-emerald-400" : "text-emerald-600"} />,
    },
    danger: {
      wrap: d ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200",
      text: d ? "text-red-300" : "text-red-800",
      icon: <AlertTriangle size={15} className={d ? "text-red-400" : "text-red-600"} />,
    },
  }[type];

  return (
    <div className={`flex gap-3 px-4 py-3 rounded-xl border ${styles.wrap}`}>
      <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
      <p className={`text-sm font-medium leading-relaxed ${styles.text}`}>{children}</p>
    </div>
  );
}

function Bullet({ d, icon: Icon = CheckCircle2, color, children }) {
  return (
    <li className="flex gap-2.5">
      <Icon size={14} className={`flex-shrink-0 mt-0.5 ${color ?? (d ? "text-slate-500" : "text-slate-400")}`} />
      <span>{children}</span>
    </li>
  );
}

function BList({ d, children }) {
  return <ul className="space-y-2">{children}</ul>;
}

function Strong({ d, children }) {
  return <strong className={d ? "text-slate-200 font-semibold" : "text-slate-800 font-semibold"}>{children}</strong>;
}

function DataRow({ label, value, d }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:gap-4 px-4 py-3 border-b last:border-0
      ${d ? "border-slate-700/60" : "border-slate-100"}`}>
      <span className={`text-xs font-bold flex-shrink-0 sm:w-48 mb-1 sm:mb-0 sm:pt-0.5 ${d ? "text-slate-400" : "text-slate-700"}`}>{label}</span>
      <span className={d ? "text-slate-400" : "text-slate-600"}>{value}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function Privacy() {
  const [d, setD] = useState(() => {
    try { return window.localStorage.getItem("sigmafam.theme") === "dark"; } catch { return false; }
  });
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observers = TOC.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id); },
        { rootMargin: "-20% 0px -70% 0px" }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  const bg    = d ? "bg-[#0a0f1e]" : "bg-slate-50";
  const text  = d ? "text-slate-100" : "text-slate-900";
  const muted = d ? "text-slate-500" : "text-slate-500";

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${bg}`}>

      {/* ── NAV ── */}
      <header className={`sticky top-0 z-50 border-b transition-colors duration-300
        ${d ? "bg-[#0a0f1e]/95 border-slate-800 backdrop-blur-md" : "bg-white/95 border-slate-200 backdrop-blur-md"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link to="/login" className="flex items-center gap-2.5 group">
            <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 transition-colors
              ${d ? "bg-slate-100" : "bg-slate-900"}`}>
              <Shield size={15} className={d ? "text-slate-900" : "text-white"} />
            </div>
            <span className={`font-black tracking-tighter text-sm ${text}`}>SIGMAFAM</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/terminos"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors
                ${d ? "text-slate-400 hover:text-violet-400 hover:bg-violet-500/10" : "text-slate-500 hover:text-violet-600 hover:bg-violet-50"}`}>
              Términos de Servicio <ChevronRight size={12} />
            </Link>
            <button
              onClick={() => setD(!d)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                ${d ? "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500" : "bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-400"}`}>
              {d ? <Sun size={12} /> : <Moon size={12} />}
              <span className="hidden sm:inline">{d ? "Claro" : "Oscuro"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <div className={`border-b transition-colors ${d ? "border-slate-800" : "border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <Pill d={d}>
            <Lock size={10} /> Política de Privacidad
          </Pill>
          <h1 className={`mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter ${text}`}>
            Política de Privacidad
          </h1>
          <p className={`mt-3 text-base sm:text-lg font-medium max-w-2xl leading-relaxed ${muted}`}>
            Tu privacidad es fundamental para nosotros. Aquí explicamos con total
            transparencia qué datos recopilamos, para qué los usamos y cómo los protegemos.
          </p>
          <div className={`mt-6 flex flex-wrap gap-4 text-xs font-semibold ${muted}`}>
            <span className="flex items-center gap-1.5"><Clock size={13} /> Última actualización: {UPDATED}</span>
            <span className="flex items-center gap-1.5"><Scale size={13} /> LFPDPPP · México</span>
            <span className="flex items-center gap-1.5"><BookOpen size={13} /> 14 secciones</span>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex gap-8 lg:gap-12 items-start">

          {/* ── SIDEBAR TOC ── */}
          <aside className="hidden lg:block w-56 xl:w-64 flex-shrink-0 sticky top-20">
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${muted}`}>Contenido</p>
            <nav className="space-y-0.5">
              {TOC.map(({ id, n, label }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all
                    ${activeId === id
                      ? d ? "bg-violet-500/15 text-violet-400 font-bold" : "bg-violet-50 text-violet-700 font-bold"
                      : d ? "text-slate-500 hover:text-slate-300 hover:bg-white/5" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
                  <span className={`text-[10px] font-black w-5 flex-shrink-0 ${activeId === id
                    ? d ? "text-violet-400" : "text-violet-600"
                    : muted}`}>{n}</span>
                  {label}
                </button>
              ))}
            </nav>
            <div className={`mt-6 pt-5 border-t ${d ? "border-slate-800" : "border-slate-200"}`}>
              <Link to="/terminos"
                className={`flex items-center gap-2 text-xs font-bold transition-colors
                  ${d ? "text-slate-500 hover:text-violet-400" : "text-slate-400 hover:text-violet-600"}`}>
                <FileText size={12} /> Ver Términos de Servicio
              </Link>
            </div>
          </aside>

          {/* ── CONTENT ── */}
          <main className="flex-1 min-w-0 space-y-4">

            {/* Resumen ejecutivo */}
            <div className={`rounded-2xl border p-5 sm:p-6
              ${d ? "bg-[#0f1628] border-violet-500/20" : "bg-violet-50 border-violet-200"}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${d ? "text-violet-400" : "text-violet-600"}`}>
                Resumen ejecutivo — Lo más importante
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  [CheckCircle2, "text-emerald-400", "text-emerald-600", "No vendemos tus datos. Nunca."],
                  [CheckCircle2, "text-emerald-400", "text-emerald-600", "Tu contraseña se almacena cifrada. Nadie puede verla."],
                  [CheckCircle2, "text-emerald-400", "text-emerald-600", "La ubicación GPS solo se captura cuando activas una alerta."],
                  [CheckCircle2, "text-emerald-400", "text-emerald-600", "Sin cookies de rastreo ni publicidad."],
                  [XCircle,      "text-red-400",     "text-red-600",     "No rastreamos tu ubicación en segundo plano."],
                  [XCircle,      "text-red-400",     "text-red-600",     "No compartimos datos con anunciantes."],
                ].map(([Icon, darkColor, lightColor, label], i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Icon size={14} className={`flex-shrink-0 ${d ? darkColor : lightColor}`} />
                    <span className={`text-sm font-medium ${d ? "text-slate-300" : "text-slate-700"}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sec. 01 */}
            <SectionBlock id="responsable" n="01" icon={UserCheck} title="Responsable del tratamiento de datos" accent="indigo" d={d}>
              <p>
                De conformidad con la <Strong d={d}>Ley Federal de Protección de Datos Personales en
                Posesión de los Particulares (LFPDPPP)</Strong>, el responsable del tratamiento de
                tus datos personales es:
              </p>
              <div className={`rounded-xl border divide-y overflow-hidden mt-2
                ${d ? "border-slate-700 divide-slate-700/60" : "border-slate-200 divide-slate-100"}`}>
                <DataRow label="Nombre" value="SIGMAFAM — Proyecto Académico" d={d} />
                <DataRow label="Institución" value="Centro de Enseñanza Técnica Industrial (CETI), plantel Tonalá, Guadalajara, Jalisco, México" d={d} />
                <DataRow label="Correo de contacto" value={EMAIL} d={d} />
                <DataRow label="Año de operación" value="2026" d={d} />
              </div>
              <Callout type="info" d={d}>
                SIGMAFAM es un proyecto de carácter <Strong d={d}>académico y sin fines de lucro</Strong>.
                Toda la información aquí recopilada se utiliza exclusivamente para los fines descritos
                en esta Política.
              </Callout>
            </SectionBlock>

            {/* Sec. 02 */}
            <SectionBlock id="recopilamos" n="02" icon={Database} title="Datos que recopilamos" accent="sky" d={d}>
              <p>
                Recopilamos únicamente los datos <Strong d={d}>mínimos necesarios</Strong> para
                ofrecerte las funcionalidades de SIGMAFAM. A continuación, el detalle completo:
              </p>

              {[
                {
                  cat: "a) Datos de registro y cuenta",
                  accent: d ? "text-sky-400" : "text-sky-600",
                  items: [
                    ["Nombre completo", "Para identificarte dentro de la plataforma y en las notificaciones de alerta."],
                    ["Correo electrónico", "Para verificar tu cuenta, recuperar contraseña y recibir notificaciones de emergencia."],
                    ["Contraseña", "Almacenada exclusivamente en forma cifrada (hashing de un solo sentido). Ninguna persona, incluyendo el equipo de desarrollo, puede acceder a ella en texto plano."],
                    ["Código de verificación", "Código temporal de 6 dígitos enviado al registrarte, válido por 15 minutos y eliminado tras su uso."],
                  ],
                },
                {
                  cat: "b) Datos de ubicación",
                  accent: d ? "text-emerald-400" : "text-emerald-600",
                  items: [
                    ["Coordenadas GPS", "Capturadas únicamente en el momento exacto en que activas una alerta de emergencia. NO rastreamos tu ubicación en segundo plano, de forma continua ni sin tu acción explícita."],
                    ["Marca de tiempo", "La fecha y hora en que se registró la ubicación asociada a una alerta."],
                  ],
                },
                {
                  cat: "c) Datos del dispositivo IoT",
                  accent: d ? "text-amber-400" : "text-amber-600",
                  items: [
                    ["Identificador de dispositivo", "Un código único generado por la plataforma para identificar el hardware vinculado a tu cuenta."],
                    ["Última conexión", "Fecha y hora del último contacto del dispositivo con el servidor."],
                    ["Nivel de batería", "Porcentaje de batería reportado por el dispositivo al enviar una alerta, si está disponible."],
                  ],
                },
                {
                  cat: "d) Contactos de emergencia",
                  accent: d ? "text-violet-400" : "text-violet-600",
                  items: [
                    ["Nombre", "Nombre del contacto tal como lo ingresas tú voluntariamente."],
                    ["Número de teléfono", "Utilizado exclusivamente para enviarle notificaciones de alerta por WhatsApp cuando activas una emergencia."],
                  ],
                },
                {
                  cat: "e) Datos de auditoría interna",
                  accent: d ? "text-slate-400" : "text-slate-500",
                  items: [
                    ["Registro de eventos", "Acciones relevantes del sistema (inicio de sesión, cambio de contraseña, alertas, etc.) para garantizar la integridad y seguridad de la plataforma."],
                  ],
                },
              ].map(({ cat, accent, items }) => (
                <div key={cat}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.15em] mt-4 mb-2 ${accent}`}>{cat}</p>
                  <div className={`rounded-xl border divide-y overflow-hidden
                    ${d ? "border-slate-700 divide-slate-700/60" : "border-slate-200 divide-slate-100"}`}>
                    {items.map(([label, desc]) => (
                      <DataRow key={label} label={label} value={desc} d={d} />
                    ))}
                  </div>
                </div>
              ))}
            </SectionBlock>

            {/* Sec. 03 */}
            <SectionBlock id="no-recopilamos" n="03" icon={EyeOff} title="Datos que NO recopilamos" accent="emerald" d={d}>
              <Callout type="success" d={d}>
                Queremos ser completamente transparentes. La siguiente lista detalla lo que
                <Strong d={d}> nunca</Strong> recopilamos ni almacenamos.
              </Callout>
              <BList d={d}>
                <Bullet d={d} icon={XCircle} color={d ? "text-red-400" : "text-red-500"}>Información de pago, datos bancarios o financieros de ningún tipo.</Bullet>
                <Bullet d={d} icon={XCircle} color={d ? "text-red-400" : "text-red-500"}>Documentos de identidad (INE, pasaporte, CURP, RFC).</Bullet>
                <Bullet d={d} icon={XCircle} color={d ? "text-red-400" : "text-red-500"}>Datos biométricos (huella dactilar, reconocimiento facial, voz).</Bullet>
                <Bullet d={d} icon={XCircle} color={d ? "text-red-400" : "text-red-500"}>Acceso al micrófono, cámara o galería de tu dispositivo.</Bullet>
                <Bullet d={d} icon={XCircle} color={d ? "text-red-400" : "text-red-500"}>Lista de contactos del teléfono o cualquier aplicación externa.</Bullet>
                <Bullet d={d} icon={XCircle} color={d ? "text-red-400" : "text-red-500"}>Historial de navegación, búsquedas o actividad fuera de SIGMAFAM.</Bullet>
                <Bullet d={d} icon={XCircle} color={d ? "text-red-400" : "text-red-500"}>Ubicación GPS en segundo plano o de forma continua.</Bullet>
                <Bullet d={d} icon={XCircle} color={d ? "text-red-400" : "text-red-500"}>Datos de publicidad, perfiles de comportamiento o segmentación comercial.</Bullet>
                <Bullet d={d} icon={XCircle} color={d ? "text-red-400" : "text-red-500"}>Mensajes, conversaciones o contenido generado fuera de la plataforma.</Bullet>
              </BList>
            </SectionBlock>

            {/* Sec. 04 */}
            <SectionBlock id="finalidad" n="04" icon={Eye} title="Finalidad del tratamiento" accent="violet" d={d}>
              <p>
                Tus datos se utilizan <Strong d={d}>exclusivamente</Strong> para las siguientes finalidades,
                todas ellas relacionadas directamente con el funcionamiento de SIGMAFAM:
              </p>
              <div className={`rounded-xl border divide-y overflow-hidden
                ${d ? "border-slate-700 divide-slate-700/60" : "border-slate-200 divide-slate-100"}`}>
                {[
                  ["Autenticación y sesión", "Verificar tu identidad al iniciar sesión y mantener tu sesión activa de forma segura durante 7 días."],
                  ["Verificación de cuenta", "Confirmar que el correo registrado te pertenece mediante un código de un solo uso."],
                  ["Recuperación de contraseña", "Enviarte un código temporal para restablecer el acceso a tu cuenta."],
                  ["Notificaciones de alerta (WhatsApp)", "Enviar mensajes de emergencia a tus contactos registrados cuando activas una alerta, incluyendo nombre y enlace de ubicación."],
                  ["Notificaciones de alerta (correo)", "Notificar a los miembros de tu grupo familiar por correo cuando se activa una alerta en el grupo."],
                  ["Gestión del grupo familiar", "Permitir que los miembros de tu grupo vean el historial y estado de las alertas compartidas."],
                  ["Historial y estadísticas", "Mostrarte el registro histórico de alertas y estadísticas de uso dentro de tu grupo."],
                  ["Auditoría de seguridad", "Mantener un registro interno de eventos críticos para garantizar la integridad del sistema."],
                  ["Mejora del servicio", "Analizar el funcionamiento general de la plataforma en el contexto del proyecto académico."],
                ].map(([label, desc]) => (
                  <DataRow key={label} label={label} value={desc} d={d} />
                ))}
              </div>
            </SectionBlock>

            {/* Sec. 05 */}
            <SectionBlock id="base-legal" n="05" icon={Scale} title="Base legal del tratamiento" accent="slate" d={d}>
              <p>
                El tratamiento de tus datos personales se realiza con fundamento en las siguientes
                bases legales establecidas por la LFPDPPP:
              </p>
              <BList d={d}>
                <Bullet d={d} icon={CheckCircle2} color={d ? "text-violet-400" : "text-violet-600"}>
                  <Strong d={d}>Consentimiento:</Strong> otorgado libre, específica e informadamente al
                  crear tu cuenta y aceptar esta Política de Privacidad.
                </Bullet>
                <Bullet d={d} icon={CheckCircle2} color={d ? "text-violet-400" : "text-violet-600"}>
                  <Strong d={d}>Relación contractual:</Strong> el tratamiento es necesario para prestar
                  los servicios que te ofrecemos.
                </Bullet>
                <Bullet d={d} icon={CheckCircle2} color={d ? "text-violet-400" : "text-violet-600"}>
                  <Strong d={d}>Interés legítimo:</Strong> mantener la seguridad, integridad y
                  funcionamiento correcto del sistema.
                </Bullet>
              </BList>
            </SectionBlock>

            {/* Sec. 06 */}
            <SectionBlock id="terceros" n="06" icon={Share2} title="Compartición de datos con terceros" accent="amber" d={d}>
              <Callout type="success" d={d}>
                Tus datos <Strong d={d}>NO se venden, arriendan ni comparten</Strong> con fines
                comerciales. Nunca.
              </Callout>
              <p className="mt-2">
                Los únicos terceros que pueden recibir datos limitados de forma automatizada son los
                proveedores de servicio esenciales para el funcionamiento de las alertas:
              </p>

              <div className="space-y-3 mt-3">
                {[
                  {
                    name: "Meta (WhatsApp Business API)",
                    accent: d ? "bg-green-500/10 border-green-500/30" : "bg-green-50 border-green-200",
                    badge: d ? "text-green-400" : "text-green-700",
                    items: [
                      "Solo se transmite: nombre del Usuario y URL de ubicación del mapa.",
                      "Se utiliza exclusivamente para enviar el mensaje de alerta a tus contactos de emergencia.",
                      "Meta cuenta con su propia Política de Privacidad aplicable al procesamiento de mensajes.",
                    ],
                  },
                  {
                    name: "Proveedor de correo electrónico certificado",
                    accent: d ? "bg-sky-500/10 border-sky-500/30" : "bg-sky-50 border-sky-200",
                    badge: d ? "text-sky-400" : "text-sky-700",
                    items: [
                      "Solo se transmite: nombre completo, dirección de correo electrónico y el contenido del mensaje de alerta.",
                      "Se utiliza para: correos de verificación de cuenta, recuperación de contraseña y notificaciones de alerta a miembros del grupo.",
                      "El proveedor tiene obligaciones contractuales de confidencialidad.",
                    ],
                  },
                ].map(({ name, accent, badge, items }) => (
                  <div key={name} className={`rounded-xl border p-4 ${accent}`}>
                    <p className={`text-xs font-black uppercase tracking-wide mb-2 ${badge}`}>{name}</p>
                    <BList d={d}>
                      {items.map((item, i) => (
                        <Bullet key={i} d={d} icon={Info} color={badge}>
                          {item}
                        </Bullet>
                      ))}
                    </BList>
                  </div>
                ))}
              </div>
              <p className="mt-2">
                En ningún otro caso tus datos serán comunicados a terceros, salvo requerimiento
                expreso de autoridad competente conforme a la legislación mexicana.
              </p>
            </SectionBlock>

            {/* Sec. 07 */}
            <SectionBlock id="transferencias" n="07" icon={Globe} title="Transferencias internacionales de datos" accent="slate" d={d}>
              <p>
                Los proveedores de servicios mencionados en la sección anterior (servicio de mensajería
                y servicio de correo electrónico) pueden procesar datos en servidores ubicados fuera
                del territorio mexicano, incluyendo la Unión Europea y Estados Unidos de América.
              </p>
              <BList d={d}>
                <Bullet d={d}>Estas transferencias se realizan únicamente con proveedores que cuentan con <Strong d={d}>mecanismos adecuados de protección de datos</Strong>, incluyendo cláusulas contractuales estándar y/o certificaciones internacionales reconocidas.</Bullet>
                <Bullet d={d}>El volumen de datos transferidos es el <Strong d={d}>mínimo indispensable</Strong> para prestar el servicio de notificación.</Bullet>
                <Bullet d={d}>Al aceptar esta Política, consientes expresamente dichas transferencias en los términos aquí descritos, conforme al artículo 36 de la LFPDPPP.</Bullet>
              </BList>
            </SectionBlock>

            {/* Sec. 08 */}
            <SectionBlock id="seguridad" n="08" icon={Lock} title="Seguridad de los datos" accent="emerald" d={d}>
              <p>
                Implementamos medidas técnicas y organizativas razonables para proteger tus datos
                contra acceso no autorizado, pérdida, alteración o divulgación:
              </p>
              <div className={`rounded-xl border divide-y overflow-hidden
                ${d ? "border-slate-700 divide-slate-700/60" : "border-slate-200 divide-slate-100"}`}>
                {[
                  ["Cifrado de contraseñas", "Las contraseñas se almacenan mediante una función de hashing de un solo sentido (unidireccional e irreversible). Es técnicamente imposible recuperar tu contraseña original. Nadie, incluyendo el equipo de desarrollo, puede verla."],
                  ["Cifrado en tránsito", "Toda la comunicación entre tu navegador y nuestros servidores viaja protegida mediante HTTPS con TLS."],
                  ["Tokens de autenticación", "El acceso a la plataforma se controla mediante tokens de sesión con caducidad automática. Al cerrar sesión o al vencer el plazo, el acceso se revoca."],
                  ["Control de acceso por roles", "Las funcionalidades sensibles están restringidas a roles específicos (administrador, jefe de familia). Cada acción privilegiada queda registrada en el log de auditoría."],
                  ["Separación de datos por grupo", "Cada Usuario solo puede ver los datos de alertas de su propio grupo familiar. No existe acceso cruzado entre grupos."],
                  ["Minimización de datos", "Solo almacenamos los datos estrictamente necesarios para el funcionamiento del servicio."],
                ].map(([label, desc]) => (
                  <DataRow key={label} label={label} value={desc} d={d} />
                ))}
              </div>
              <Callout type="warning" d={d}>
                Ningún sistema es 100% seguro. Si detectas una vulnerabilidad, repórtala
                responsablemente a <Strong d={d}>{EMAIL}</Strong> antes de hacerla pública.
              </Callout>
            </SectionBlock>

            {/* Sec. 09 */}
            <SectionBlock id="retencion" n="09" icon={Clock} title="Retención de datos" accent="slate" d={d}>
              <div className={`rounded-xl border divide-y overflow-hidden
                ${d ? "border-slate-700 divide-slate-700/60" : "border-slate-200 divide-slate-100"}`}>
                {[
                  ["Datos de cuenta (nombre, correo)", "Durante toda la vida útil de la cuenta activa."],
                  ["Historial de alertas", "Hasta que el Usuario elimine su cuenta."],
                  ["Datos de auditoría", "Mínimo 12 meses para garantizar la integridad del sistema."],
                  ["Tokens de sesión", "7 días o hasta que el Usuario cierre sesión explícitamente."],
                  ["Códigos de verificación / recuperación", "15 minutos desde su generación. Se eliminan tras su uso o al vencer."],
                  ["Datos de contactos de emergencia", "Hasta que el Usuario los elimine manualmente o borre su cuenta."],
                  ["Ubicación GPS de alertas", "Indefinidamente asociada al historial de alertas del grupo, hasta eliminación de cuenta."],
                ].map(([label, desc]) => (
                  <DataRow key={label} label={label} value={desc} d={d} />
                ))}
              </div>
              <p>
                Al <Strong d={d}>eliminar tu cuenta</Strong>, se borran permanentemente todos tus datos
                personales identificables. Los registros de auditoría pueden conservarse de forma
                anonimizada para fines de integridad del sistema académico.
              </p>
            </SectionBlock>

            {/* Sec. 10 */}
            <SectionBlock id="derechos" n="10" icon={UserCheck} title="Tus derechos (Derechos ARCO)" accent="violet" d={d}>
              <p>
                Conforme a la <Strong d={d}>LFPDPPP</Strong>, tienes los siguientes derechos respecto
                a tus datos personales:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                {[
                  ["A — Acceso",       "Conocer qué datos personales tenemos sobre ti, cómo los usamos y con quién los compartimos.",           d ? "bg-violet-500/15 border-violet-500/30 text-violet-300" : "bg-violet-50 border-violet-200 text-violet-800"],
                  ["R — Rectificación","Solicitar la corrección de tus datos cuando sean inexactos, incompletos o desactualizados.",             d ? "bg-sky-500/15 border-sky-500/30 text-sky-300"         : "bg-sky-50 border-sky-200 text-sky-800"],
                  ["C — Cancelación",  "Pedir la eliminación de tus datos cuando ya no sean necesarios o cuando revoques tu consentimiento.",     d ? "bg-red-500/15 border-red-500/30 text-red-300"         : "bg-red-50 border-red-200 text-red-800"],
                  ["O — Oposición",    "Oponerte al tratamiento de tus datos para finalidades específicas, cuando exista causa legítima.",        d ? "bg-amber-500/15 border-amber-500/30 text-amber-300"   : "bg-amber-50 border-amber-200 text-amber-800"],
                ].map(([title, desc, styles]) => (
                  <div key={title} className={`rounded-xl border p-4 ${styles}`}>
                    <p className="text-xs font-black uppercase tracking-wide mb-1">{title}</p>
                    <p className="text-xs font-medium leading-relaxed opacity-80">{desc}</p>
                  </div>
                ))}
              </div>
              <p className={`font-semibold ${d ? "text-slate-300" : "text-slate-700"}`}>
                ¿Cómo ejercer tus derechos?
              </p>
              <BList d={d}>
                <Bullet d={d} icon={CheckCircle2} color={d ? "text-emerald-400" : "text-emerald-600"}>
                  <Strong d={d}>Opción rápida:</Strong> Elimina tu cuenta directamente desde{" "}
                  <span className={d ? "text-slate-200" : "text-slate-800"}>
                    Configuración → Eliminar cuenta
                  </span>.
                </Bullet>
                <Bullet d={d} icon={CheckCircle2} color={d ? "text-emerald-400" : "text-emerald-600"}>
                  <Strong d={d}>Por correo:</Strong> Escríbenos a{" "}
                  <a href={`mailto:${EMAIL}`} className={`underline font-medium ${d ? "text-sky-400" : "text-sky-600"}`}>{EMAIL}</a>{" "}
                  con el asunto <span className={d ? "text-slate-200" : "text-slate-800"}>"Solicitud ARCO"</span>,
                  indicando el derecho que deseas ejercer.
                </Bullet>
              </BList>
              <Callout type="info" d={d}>
                Responderemos en un plazo máximo de <Strong d={d}>20 días hábiles</Strong> contados
                desde la recepción de tu solicitud, conforme al artículo 32 de la LFPDPPP. Para
                facilitar la atención, incluye el correo electrónico con el que te registraste.
              </Callout>
            </SectionBlock>

            {/* Sec. 11 */}
            <SectionBlock id="cookies" n="11" icon={Database} title="Cookies y almacenamiento local del navegador" accent="slate" d={d}>
              <Callout type="success" d={d}>
                SIGMAFAM <Strong d={d}>no utiliza cookies de rastreo</Strong>, publicidad conductual
                ni herramientas de analítica de terceros de ningún tipo.
              </Callout>
              <p>
                Hacemos uso del <Strong d={d}>almacenamiento local del navegador (localStorage)</Strong>{" "}
                exclusivamente para:
              </p>
              <BList d={d}>
                <Bullet d={d} icon={CheckCircle2} color={d ? "text-emerald-400" : "text-emerald-600"}>
                  <Strong d={d}>Token de sesión:</Strong> para mantenerte conectado durante tu visita,
                  con caducidad automática de 7 días.
                </Bullet>
                <Bullet d={d} icon={CheckCircle2} color={d ? "text-emerald-400" : "text-emerald-600"}>
                  <Strong d={d}>Preferencia de tema:</Strong> para recordar si prefieres el modo
                  claro u oscuro.
                </Bullet>
              </BList>
              <p>
                Estos datos son almacenados localmente en tu navegador, nunca se transmiten a terceros
                y puedes eliminarlos en cualquier momento limpiando el almacenamiento de tu navegador.
              </p>
            </SectionBlock>

            {/* Sec. 12 */}
            <SectionBlock id="menores" n="12" icon={AlertTriangle} title="Menores de edad" accent="red" d={d}>
              <Callout type="danger" d={d}>
                SIGMAFAM <Strong d={d}>no está dirigido a menores de 18 años</Strong> sin la
                supervisión y consentimiento expreso de un padre, madre o tutor legal.
              </Callout>
              <BList d={d}>
                <Bullet d={d}>No recopilamos conscientemente datos personales de menores de 18 años sin autorización de tutor.</Bullet>
                <Bullet d={d}>Si identificamos que un usuario es menor sin autorización, procederemos a cancelar su cuenta y eliminar los datos asociados.</Bullet>
                <Bullet d={d}>
                  Si eres padre, madre o tutor y crees que tu hijo ha creado una cuenta sin tu
                  consentimiento, contáctanos de inmediato en{" "}
                  <a href={`mailto:${EMAIL}`} className={`underline font-medium ${d ? "text-sky-400" : "text-sky-600"}`}>{EMAIL}</a>.
                </Bullet>
              </BList>
            </SectionBlock>

            {/* Sec. 13 */}
            <SectionBlock id="cambios" n="13" icon={FileText} title="Cambios a esta política" accent="slate" d={d}>
              <BList d={d}>
                <Bullet d={d}>Podemos actualizar esta Política de Privacidad periódicamente para reflejar cambios en las funcionalidades del servicio o en la legislación aplicable.</Bullet>
                <Bullet d={d}>Los cambios <Strong d={d}>significativos</Strong> serán notificados al correo registrado del Usuario con al menos <Strong d={d}>15 días calendario de anticipación</Strong>.</Bullet>
                <Bullet d={d}>La <Strong d={d}>"Última actualización"</Strong> mostrada al inicio de este documento refleja siempre la versión más reciente vigente.</Bullet>
                <Bullet d={d}>El uso continuado de SIGMAFAM tras la publicación de cambios implica tu aceptación de la Política actualizada.</Bullet>
              </BList>
            </SectionBlock>

            {/* Sec. 14 */}
            <SectionBlock id="contacto" n="14" icon={Mail} title="Contacto" accent="sky" d={d}>
              <p>
                Para cualquier duda, aclaración o solicitud relacionada con esta Política de Privacidad
                o el tratamiento de tus datos personales, contáctanos:
              </p>
              <a
                href={`mailto:${EMAIL}`}
                className={`inline-flex items-center gap-2.5 mt-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all
                  ${d
                    ? "bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20"
                    : "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100"}`}>
                <Mail size={15} /> {EMAIL}
              </a>
              <p className={`text-xs mt-4 ${muted}`}>
                Respondemos solicitudes relacionadas con privacidad en un plazo máximo de{" "}
                <Strong d={d}>20 días hábiles</Strong>, conforme a la LFPDPPP.
              </p>
              <p className={`text-xs mt-2 ${muted}`}>
                También puedes acudir al{" "}
                <strong className={d ? "text-slate-300" : "text-slate-700"}>
                  Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos
                  Personales (INAI)
                </strong>{" "}
                si consideras que tu derecho a la protección de datos ha sido vulnerado.
                Sitio web:{" "}
                <a href="https://www.inai.org.mx" target="_blank" rel="noopener noreferrer"
                  className={`underline ${d ? "text-sky-400" : "text-sky-600"}`}>
                  www.inai.org.mx
                </a>
              </p>
            </SectionBlock>

            {/* Footer card */}
            <div className={`rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4
              ${d ? "bg-[#0f1628] border-slate-800" : "bg-white border-slate-200"}`}>
              <div>
                <p className={`text-sm font-bold ${d ? "text-slate-200" : "text-slate-800"}`}>
                  ¿Quieres conocer las condiciones de uso del servicio?
                </p>
                <p className={`text-xs mt-1 ${muted}`}>Lee nuestros Términos de Servicio.</p>
              </div>
              <Link to="/terminos"
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0
                  ${d
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    : "bg-slate-900 hover:bg-slate-800 text-white"}`}>
                <Scale size={14} /> Términos de Servicio
              </Link>
            </div>

          </main>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className={`border-t mt-12 transition-colors ${d ? "border-slate-800" : "border-slate-200"}`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium ${muted}`}>
          <span>© 2026 SIGMAFAM · CETI Tonalá · Todos los derechos reservados</span>
          <div className="flex items-center gap-4">
            <Link to="/terminos" className={`transition-colors ${d ? "hover:text-violet-400" : "hover:text-violet-600"}`}>Términos de Servicio</Link>
            <Link to="/login"    className={`transition-colors ${d ? "hover:text-slate-300" : "hover:text-slate-700"}`}>Iniciar sesión</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
