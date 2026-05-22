import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield, Sun, Moon, Scale, Users, AlertTriangle,
  Lock, Cpu, Ban, FileText, Mail, ChevronRight,
  BookOpen, Clock, CheckCircle2, XCircle, Info,
} from "lucide-react";

const UPDATED = "22 de mayo de 2026";
const EMAIL   = "sigmafam@castoresceti.com";

const TOC = [
  { id: "definiciones",    n: "01", label: "Definiciones" },
  { id: "aceptacion",      n: "02", label: "Aceptación de los términos" },
  { id: "servicio",        n: "03", label: "Descripción del servicio" },
  { id: "cuenta",          n: "04", label: "Registro y cuenta" },
  { id: "uso-aceptable",   n: "05", label: "Uso aceptable" },
  { id: "prohibido",       n: "06", label: "Uso prohibido" },
  { id: "grupos",          n: "07", label: "Grupos familiares" },
  { id: "alertas",         n: "08", label: "Sistema de alertas" },
  { id: "iot",             n: "09", label: "Dispositivos IoT" },
  { id: "propiedad",       n: "10", label: "Propiedad intelectual" },
  { id: "responsabilidad", n: "11", label: "Limitación de responsabilidad" },
  { id: "emergencias",     n: "12", label: "Aviso sobre emergencias" },
  { id: "modificaciones",  n: "13", label: "Modificaciones" },
  { id: "terminacion",     n: "14", label: "Terminación de cuenta" },
  { id: "ley",             n: "15", label: "Ley aplicable" },
  { id: "contacto",        n: "16", label: "Contacto" },
];

/* ── helpers ── */
function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ── sub-components ── */
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
    slate:  { icon: d ? "bg-slate-800 text-slate-300"   : "bg-slate-100 text-slate-600",   badge: d ? "text-slate-500"  : "text-slate-400"  },
    sky:    { icon: d ? "bg-sky-500/20 text-sky-300"    : "bg-sky-50 text-sky-600",         badge: d ? "text-sky-500"    : "text-sky-600"    },
    red:    { icon: d ? "bg-red-500/20 text-red-300"    : "bg-red-50 text-red-600",         badge: d ? "text-red-400"    : "text-red-600"    },
    amber:  { icon: d ? "bg-amber-500/20 text-amber-300": "bg-amber-50 text-amber-600",     badge: d ? "text-amber-400"  : "text-amber-600"  },
    violet: { icon: d ? "bg-violet-500/20 text-violet-300": "bg-violet-50 text-violet-600", badge: d ? "text-violet-400" : "text-violet-600" },
    emerald:{ icon: d ? "bg-emerald-500/20 text-emerald-300":"bg-emerald-50 text-emerald-600", badge: d?"text-emerald-400":"text-emerald-600"},
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
            Artículo {n}
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

function Bullet({ d, icon: Icon = CheckCircle2, children }) {
  return (
    <li className="flex gap-2.5">
      <Icon size={14} className={`flex-shrink-0 mt-0.5 ${d ? "text-slate-500" : "text-slate-400"}`} />
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

/* ══════════════════════════════════════════════════════════════ */
export default function Terms() {
  const [d, setD] = useState(() => {
    try { return window.localStorage.getItem("sigmafam.theme") === "dark"; } catch { return false; }
  });
  const [activeId, setActiveId] = useState("");

  /* scroll-spy */
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
            <Link to="/privacidad"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors
                ${d ? "text-slate-400 hover:text-sky-400 hover:bg-sky-500/10" : "text-slate-500 hover:text-sky-600 hover:bg-sky-50"}`}>
              Política de Privacidad <ChevronRight size={12} />
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
            <FileText size={10} /> Documento legal
          </Pill>
          <h1 className={`mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter ${text}`}>
            Términos de Servicio
          </h1>
          <p className={`mt-3 text-base sm:text-lg font-medium max-w-2xl leading-relaxed ${muted}`}>
            Lee con atención las condiciones bajo las cuales puedes usar SIGMAFAM.
            Al crear una cuenta o usar la plataforma, aceptas estos términos en su totalidad.
          </p>
          <div className={`mt-6 flex flex-wrap gap-4 text-xs font-semibold ${muted}`}>
            <span className="flex items-center gap-1.5"><Clock size={13} /> Última actualización: {UPDATED}</span>
            <span className="flex items-center gap-1.5"><Scale size={13} /> Ley Federal de México</span>
            <span className="flex items-center gap-1.5"><BookOpen size={13} /> 16 artículos</span>
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
                      ? d ? "bg-sky-500/15 text-sky-400 font-bold" : "bg-sky-50 text-sky-700 font-bold"
                      : d ? "text-slate-500 hover:text-slate-300 hover:bg-white/5" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
                  <span className={`text-[10px] font-black w-5 flex-shrink-0 ${activeId === id
                    ? d ? "text-sky-400" : "text-sky-600"
                    : muted}`}>{n}</span>
                  {label}
                </button>
              ))}
            </nav>
            <div className={`mt-6 pt-5 border-t ${d ? "border-slate-800" : "border-slate-200"}`}>
              <Link to="/privacidad"
                className={`flex items-center gap-2 text-xs font-bold transition-colors
                  ${d ? "text-slate-500 hover:text-sky-400" : "text-slate-400 hover:text-sky-600"}`}>
                <Lock size={12} /> Ver Política de Privacidad
              </Link>
            </div>
          </aside>

          {/* ── CONTENT ── */}
          <main className="flex-1 min-w-0 space-y-4">

            {/* Aviso destacado */}
            <Callout type="warning" d={d}>
              <Strong d={d}>SIGMAFAM es un proyecto académico</Strong> del Centro de Enseñanza Técnica
              Industrial (CETI), plantel Tonalá. No es un servicio comercial ni un sustituto de los
              servicios de emergencia oficiales. Ante cualquier emergencia real, llama al{" "}
              <Strong d={d}>911</Strong>.
            </Callout>

            {/* Art. 01 */}
            <SectionBlock id="definiciones" n="01" icon={BookOpen} title="Definiciones" accent="slate" d={d}>
              <p>Para los efectos de estos Términos de Servicio, los siguientes conceptos tendrán el significado que a continuación se indica:</p>
              <div className={`rounded-xl border divide-y text-sm mt-3
                ${d ? "border-slate-700 divide-slate-700/60" : "border-slate-200 divide-slate-100"}`}>
                {[
                  ["SIGMAFAM", "Sistema Integral de Gestión y Monitoreo Familiar. Plataforma web y ecosistema de alertas de emergencia familiar."],
                  ["Plataforma", "El conjunto de servicios, interfaces web y funcionalidades que componen SIGMAFAM."],
                  ["Usuario", "Persona física mayor de edad que crea una cuenta y accede a la Plataforma."],
                  ["Jefe de familia", "Usuario con rol administrativo dentro de un Grupo familiar."],
                  ["Miembro", "Usuario integrante de un Grupo familiar con permisos estándar."],
                  ["Alerta", "Notificación de emergencia generada manual o automáticamente desde un dispositivo o la interfaz web."],
                  ["Dispositivo IoT", "Hardware físico compatible vinculado a la cuenta de un Usuario para el envío de alertas físicas."],
                  ["Grupo familiar", "Agrupación de hasta seis (6) Usuarios dentro de la Plataforma con visibilidad compartida de alertas."],
                  ["Cuenta", "Registro personal e intransferible del Usuario en la Plataforma."],
                  ["Contacto de emergencia", "Persona externa registrada por el Usuario para recibir notificaciones de alerta."],
                ].map(([term, def]) => (
                  <div key={term} className="flex gap-3 px-4 py-3">
                    <span className={`font-bold text-xs flex-shrink-0 w-36 pt-0.5 ${d ? "text-slate-300" : "text-slate-700"}`}>{term}</span>
                    <span className={d ? "text-slate-400" : "text-slate-600"}>{def}</span>
                  </div>
                ))}
              </div>
            </SectionBlock>

            {/* Art. 02 */}
            <SectionBlock id="aceptacion" n="02" icon={CheckCircle2} title="Aceptación de los términos" accent="emerald" d={d}>
              <p>
                El acceso o uso de la Plataforma, incluyendo la creación de una cuenta, implica la
                aceptación plena, voluntaria e irrestricta de los presentes Términos de Servicio y de
                la Política de Privacidad de SIGMAFAM.
              </p>
              <p>
                Si no estás de acuerdo con alguna de las disposiciones aquí contenidas, debes
                abstenerte de usar la Plataforma y, de tener una cuenta activa, proceder a su
                eliminación desde el apartado de Configuración.
              </p>
              <Callout type="info" d={d}>
                Los presentes Términos pueden ser modificados. Te notificaremos por correo electrónico
                ante cambios significativos con al menos 15 días de anticipación.
              </Callout>
            </SectionBlock>

            {/* Art. 03 */}
            <SectionBlock id="servicio" n="03" icon={Shield} title="Descripción del servicio" accent="sky" d={d}>
              <p>
                SIGMAFAM es un proyecto de desarrollo tecnológico académico del CETI Tonalá que ofrece
                las siguientes funcionalidades a sus Usuarios registrados:
              </p>
              <BList d={d}>
                <Bullet d={d}><Strong d={d}>Gestión de alertas de emergencia:</Strong> envío, recepción y seguimiento de alertas con geolocalización opcional.</Bullet>
                <Bullet d={d}><Strong d={d}>Monitoreo de dispositivos IoT:</Strong> vinculación y supervisión de hardware físico compatible.</Bullet>
                <Bullet d={d}><Strong d={d}>Grupos familiares:</Strong> organización de hasta seis usuarios con visibilidad compartida de alertas.</Bullet>
                <Bullet d={d}><Strong d={d}>Notificaciones externas:</Strong> envío de mensajes de emergencia a contactos por mensajería y correo electrónico.</Bullet>
                <Bullet d={d}><Strong d={d}>Historial y estadísticas:</Strong> registro histórico y reportes de actividad del grupo.</Bullet>
                <Bullet d={d}><Strong d={d}>Panel de administración:</Strong> herramientas de gestión para usuarios con rol de administrador del sistema.</Bullet>
              </BList>
              <p className={`text-xs italic ${muted}`}>
                Las funcionalidades disponibles pueden variar sin previo aviso dado el carácter
                académico y evolutivo del proyecto.
              </p>
            </SectionBlock>

            {/* Art. 04 */}
            <SectionBlock id="cuenta" n="04" icon={Users} title="Registro y cuenta" accent="slate" d={d}>
              <p>Para crear una cuenta en SIGMAFAM debes:</p>
              <BList d={d}>
                <Bullet d={d}>Ser una persona física <Strong d={d}>mayor de 18 años</Strong>, o bien contar con la autorización expresa de un tutor o representante legal si eres menor de edad.</Bullet>
                <Bullet d={d}>Proporcionar información <Strong d={d}>veraz, completa y actualizada</Strong> al momento del registro.</Bullet>
                <Bullet d={d}><Strong d={d}>Verificar tu correo electrónico</Strong> mediante el código enviado al momento del registro.</Bullet>
                <Bullet d={d}>Mantener la <Strong d={d}>confidencialidad de tu contraseña</Strong> y no compartirla con terceros.</Bullet>
                <Bullet d={d}>No ceder, transferir ni compartir el acceso a tu cuenta.</Bullet>
                <Bullet d={d}>Usar una sola cuenta; la creación de cuentas múltiples por la misma persona está prohibida.</Bullet>
              </BList>
              <p>
                Eres responsable de todas las acciones realizadas desde tu cuenta. Si sospechas de
                acceso no autorizado, debes notificarnos de inmediato en{" "}
                <a href={`mailto:${EMAIL}`} className={`underline font-medium ${d ? "text-sky-400" : "text-sky-600"}`}>{EMAIL}</a>{" "}
                y cambiar tu contraseña de forma inmediata.
              </p>
            </SectionBlock>

            {/* Art. 05 */}
            <SectionBlock id="uso-aceptable" n="05" icon={CheckCircle2} title="Uso aceptable" accent="emerald" d={d}>
              <p>
                SIGMAFAM está diseñado exclusivamente para <Strong d={d}>uso personal y familiar</Strong>.
                Aceptas utilizar la Plataforma de manera responsable, ética y conforme a las leyes
                aplicables en los Estados Unidos Mexicanos.
              </p>
              <BList d={d}>
                <Bullet d={d}>Usar las alertas únicamente ante situaciones de riesgo o para pruebas controladas que se marquen y cierren de inmediato.</Bullet>
                <Bullet d={d}>Mantener actualizada la información de tu cuenta y contactos de emergencia.</Bullet>
                <Bullet d={d}>Reportar fallas o vulnerabilidades al equipo de desarrollo en lugar de explotarlas.</Bullet>
                <Bullet d={d}>Respetar a los demás miembros de tu grupo familiar dentro de la Plataforma.</Bullet>
              </BList>
            </SectionBlock>

            {/* Art. 06 */}
            <SectionBlock id="prohibido" n="06" icon={Ban} title="Uso prohibido" accent="red" d={d}>
              <Callout type="danger" d={d}>
                El incumplimiento de cualquiera de las siguientes restricciones puede resultar en la
                suspensión o cancelación permanente de tu cuenta.
              </Callout>
              <p className="mt-2">Queda estrictamente prohibido:</p>
              <BList d={d}>
                <Bullet d={d} icon={XCircle}>Intentar acceder de forma no autorizada a cuentas de otros Usuarios o a los sistemas internos de la Plataforma.</Bullet>
                <Bullet d={d} icon={XCircle}>Realizar <Strong d={d}>ingeniería inversa</Strong>, descompilar o intentar obtener el código fuente de la Plataforma.</Bullet>
                <Bullet d={d} icon={XCircle}>Introducir <Strong d={d}>malware, virus</Strong> o cualquier código malicioso o dañino.</Bullet>
                <Bullet d={d} icon={XCircle}>Saturar los sistemas con solicitudes automatizadas (<Strong d={d}>scraping, bots, DDoS</Strong> o similares).</Bullet>
                <Bullet d={d} icon={XCircle}>Suplantar la identidad de otros Usuarios, administradores o del equipo de SIGMAFAM.</Bullet>
                <Bullet d={d} icon={XCircle}>Usar la Plataforma para actividades de <Strong d={d}>hostigamiento, amenazas, extorsión</Strong> o cualquier acto ilícito.</Bullet>
                <Bullet d={d} icon={XCircle}>Registrar alertas falsas de manera deliberada y reiterada sin cerrarlas.</Bullet>
                <Bullet d={d} icon={XCircle}>Usar SIGMAFAM con <Strong d={d}>fines comerciales</Strong> sin autorización escrita del equipo de desarrollo.</Bullet>
                <Bullet d={d} icon={XCircle}>Compartir credenciales de acceso o tokens de dispositivo con personas no autorizadas.</Bullet>
              </BList>
            </SectionBlock>

            {/* Art. 07 */}
            <SectionBlock id="grupos" n="07" icon={Users} title="Grupos familiares" accent="violet" d={d}>
              <BList d={d}>
                <Bullet d={d}>Cada Grupo familiar admite un <Strong d={d}>máximo de seis (6) integrantes</Strong>.</Bullet>
                <Bullet d={d}>Un Usuario solo puede pertenecer a <Strong d={d}>un grupo a la vez</Strong>.</Bullet>
                <Bullet d={d}>El <Strong d={d}>Jefe de familia</Strong> administra el grupo: puede añadir o eliminar miembros y gestionar el código de invitación.</Bullet>
                <Bullet d={d}>El Jefe de familia es <Strong d={d}>responsable del uso del grupo</Strong> y de las actividades de sus miembros dentro de la Plataforma.</Bullet>
                <Bullet d={d}>La <Strong d={d}>disolución del grupo</Strong> es irreversible y provoca que todos los miembros pierdan el acceso compartido al historial de alertas del grupo.</Bullet>
                <Bullet d={d}>El código de invitación es confidencial y debe usarse únicamente para agregar personas de confianza.</Bullet>
              </BList>
            </SectionBlock>

            {/* Art. 08 */}
            <SectionBlock id="alertas" n="08" icon={AlertTriangle} title="Sistema de alertas" accent="amber" d={d}>
              <Callout type="warning" d={d}>
                Las alertas de SIGMAFAM son una herramienta de comunicación familiar complementaria.{" "}
                <Strong d={d}>No constituyen un servicio de emergencias oficial</Strong> y no sustituyen
                al 911 ni a ninguna autoridad competente.
              </Callout>
              <BList d={d}>
                <Bullet d={d}>El sistema no garantiza la <Strong d={d}>entrega inmediata</Strong> de notificaciones; esto depende de la conectividad del dispositivo y de los servicios de terceros.</Bullet>
                <Bullet d={d}>La <Strong d={d}>geolocalización es aproximada</Strong> y puede verse afectada por la señal GPS, la cobertura de red o la configuración del dispositivo.</Bullet>
                <Bullet d={d}>El Usuario es <Strong d={d}>responsable de las alertas generadas</Strong> desde su cuenta o su dispositivo IoT vinculado.</Bullet>
                <Bullet d={d}>Las alertas de <Strong d={d}>prueba o falsas</Strong> deben cerrarse de inmediato para no generar alarma innecesaria en el grupo.</Bullet>
                <Bullet d={d}>El equipo de SIGMAFAM no monitorea activamente las alertas en tiempo real.</Bullet>
              </BList>
            </SectionBlock>

            {/* Art. 09 */}
            <SectionBlock id="iot" n="09" icon={Cpu} title="Dispositivos IoT" accent="sky" d={d}>
              <BList d={d}>
                <Bullet d={d}>Cada Usuario puede vincular <Strong d={d}>un único dispositivo IoT</Strong> a su cuenta.</Bullet>
                <Bullet d={d}>El dispositivo es <Strong d={d}>responsabilidad exclusiva del Usuario</Strong>: su cuidado, mantenimiento y uso correcto.</Bullet>
                <Bullet d={d}>El <Strong d={d}>token de dispositivo</Strong> generado al vincularlo es confidencial y no debe compartirse con personas ajenas.</Bullet>
                <Bullet d={d}>En caso de <Strong d={d}>pérdida, robo o extravío</Strong> del dispositivo, el Usuario debe desvincularlo de inmediato desde la sección "Dispositivo" de la aplicación.</Bullet>
                <Bullet d={d}>SIGMAFAM no se hace responsable por <Strong d={d}>daños materiales o personales</Strong> derivados de fallas técnicas del hardware.</Bullet>
                <Bullet d={d}>La compatibilidad del dispositivo queda sujeta a las especificaciones técnicas vigentes del proyecto.</Bullet>
              </BList>
            </SectionBlock>

            {/* Art. 10 */}
            <SectionBlock id="propiedad" n="10" icon={Shield} title="Propiedad intelectual" accent="slate" d={d}>
              <p>
                El nombre <Strong d={d}>SIGMAFAM</Strong>, el logotipo, el diseño visual, el código fuente
                y todos los elementos que componen la Plataforma son propiedad de sus desarrolladores
                y del CETI Tonalá, protegidos por las leyes de propiedad intelectual aplicables en México.
              </p>
              <BList d={d}>
                <Bullet d={d}>El Usuario conserva la <Strong d={d}>titularidad de sus datos personales</Strong> y de la información que registra en la Plataforma.</Bullet>
                <Bullet d={d}>Se prohíbe <Strong d={d}>reproducir, distribuir, modificar o crear obras derivadas</Strong> de cualquier elemento de SIGMAFAM sin autorización escrita previa.</Bullet>
                <Bullet d={d}>El uso de la Plataforma no otorga al Usuario ninguna licencia sobre la propiedad intelectual de SIGMAFAM más allá del acceso personal para los fines descritos en estos Términos.</Bullet>
              </BList>
            </SectionBlock>

            {/* Art. 11 */}
            <SectionBlock id="responsabilidad" n="11" icon={Scale} title="Limitación de responsabilidad" accent="amber" d={d}>
              <Callout type="warning" d={d}>
                SIGMAFAM se proporciona <Strong d={d}>"tal cual"</Strong> y <Strong d={d}>"según disponibilidad"</Strong>,
                sin garantías expresas ni implícitas de ningún tipo.
              </Callout>
              <p>Los desarrolladores de SIGMAFAM no garantizan ni se responsabilizan por:</p>
              <BList d={d}>
                <Bullet d={d} icon={XCircle}>La <Strong d={d}>disponibilidad continua o ininterrumpida</Strong> del servicio.</Bullet>
                <Bullet d={d} icon={XCircle}>La <Strong d={d}>exactitud de la geolocalización</Strong> reportada por los dispositivos.</Bullet>
                <Bullet d={d} icon={XCircle}>La <Strong d={d}>entrega garantizada</Strong> de notificaciones por parte de servicios de terceros (mensajería, correo electrónico).</Bullet>
                <Bullet d={d} icon={XCircle}>Daños directos, indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de uso de la Plataforma.</Bullet>
                <Bullet d={d} icon={XCircle}>Pérdida de datos por causas ajenas al equipo de desarrollo.</Bullet>
              </BList>
              <p>
                En ningún caso la responsabilidad total de los desarrolladores de SIGMAFAM ante el
                Usuario superará el importe de cero pesos (MXN $0.00), dado el carácter gratuito y
                académico del servicio.
              </p>
            </SectionBlock>

            {/* Art. 12 */}
            <SectionBlock id="emergencias" n="12" icon={AlertTriangle} title="Aviso sobre emergencias" accent="red" d={d}>
              <Callout type="danger" d={d}>
                <Strong d={d}>SIGMAFAM no es un servicio de emergencias certificado.</Strong> No llames
                ni envíes alertas a través de SIGMAFAM como único canal en una emergencia real.
              </Callout>
              <p>Ante cualquier situación de peligro real, debes:</p>
              <div className={`rounded-xl border divide-y mt-3
                ${d ? "border-slate-700 divide-slate-700/60" : "border-slate-200 divide-slate-100"}`}>
                {[
                  ["1", "Llama inmediatamente al 911 (Emergencias México)."],
                  ["2", "Contacta a las autoridades locales competentes (policía, bomberos, Cruz Roja)."],
                  ["3", "Usa los servicios de emergencia oficiales de tu municipio o estado."],
                  ["4", "Notifica a familiares o vecinos de forma directa."],
                ].map(([n, text]) => (
                  <div key={n} className="flex gap-3 px-4 py-3 items-start">
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black mt-0.5
                      ${d ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700"}`}>{n}</span>
                    <span className={d ? "text-slate-400" : "text-slate-600"}>{text}</span>
                  </div>
                ))}
              </div>
              <p>
                SIGMAFAM puede ser un <Strong d={d}>complemento de comunicación familiar</Strong>,
                pero nunca un sustituto de los servicios de emergencia oficiales.
              </p>
            </SectionBlock>

            {/* Art. 13 */}
            <SectionBlock id="modificaciones" n="13" icon={FileText} title="Modificaciones al servicio y a los términos" accent="slate" d={d}>
              <BList d={d}>
                <Bullet d={d}>Nos reservamos el derecho de <Strong d={d}>modificar, suspender o discontinuar</Strong> cualquier parte del servicio en cualquier momento.</Bullet>
                <Bullet d={d}>Los cambios <Strong d={d}>significativos en estos Términos</Strong> se notificarán al correo registrado del Usuario con al menos <Strong d={d}>15 días calendario de anticipación</Strong>.</Bullet>
                <Bullet d={d}>El uso continuado de la Plataforma tras la entrada en vigor de los nuevos Términos implica la <Strong d={d}>aceptación de los cambios</Strong>.</Bullet>
                <Bullet d={d}>La versión vigente de estos Términos es siempre la publicada en esta página, con la fecha de "Última actualización" indicada en el encabezado.</Bullet>
              </BList>
            </SectionBlock>

            {/* Art. 14 */}
            <SectionBlock id="terminacion" n="14" icon={XCircle} title="Terminación de cuenta" accent="red" d={d}>
              <p>
                El Usuario puede <Strong d={d}>eliminar su cuenta</Strong> en cualquier momento desde
                Configuración → Eliminar cuenta. Esta acción es permanente e irreversible.
              </p>
              <p>SIGMAFAM puede suspender o cancelar una cuenta sin previo aviso cuando:</p>
              <BList d={d}>
                <Bullet d={d} icon={XCircle}>El Usuario <Strong d={d}>viola</Strong> estos Términos de Servicio.</Bullet>
                <Bullet d={d} icon={XCircle}>Se detecta <Strong d={d}>actividad fraudulenta, abusiva o maliciosa</Strong>.</Bullet>
                <Bullet d={d} icon={XCircle}>La cuenta permanece <Strong d={d}>inactiva por más de 12 meses</Strong> consecutivos.</Bullet>
                <Bullet d={d} icon={XCircle}>La institución académica decide <Strong d={d}>discontinuar el proyecto</Strong>.</Bullet>
              </BList>
            </SectionBlock>

            {/* Art. 15 */}
            <SectionBlock id="ley" n="15" icon={Scale} title="Ley aplicable y jurisdicción" accent="slate" d={d}>
              <p>
                Los presentes Términos de Servicio se rigen e interpretan de conformidad con las leyes
                vigentes de los <Strong d={d}>Estados Unidos Mexicanos</Strong>, incluyendo sin limitación:
              </p>
              <BList d={d}>
                <Bullet d={d}>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).</Bullet>
                <Bullet d={d}>Código Civil Federal.</Bullet>
                <Bullet d={d}>Código de Comercio.</Bullet>
                <Bullet d={d}>Ley Federal del Derecho de Autor.</Bullet>
              </BList>
              <p>
                Para cualquier controversia derivada de la interpretación o cumplimiento de estos
                Términos, las partes se someten expresamente a la jurisdicción de los tribunales
                competentes de la ciudad de <Strong d={d}>Guadalajara, Jalisco, México</Strong>,
                renunciando a cualquier otro fuero que pudiera corresponderles.
              </p>
            </SectionBlock>

            {/* Art. 16 */}
            <SectionBlock id="contacto" n="16" icon={Mail} title="Contacto" accent="sky" d={d}>
              <p>
                Para cualquier duda, aclaración o solicitud relacionada con estos Términos de Servicio,
                contáctanos:
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
                Respondemos en un plazo máximo de <Strong d={d}>5 días hábiles</Strong>.
              </p>
            </SectionBlock>

            {/* Footer card */}
            <div className={`rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4
              ${d ? "bg-[#0f1628] border-slate-800" : "bg-white border-slate-200"}`}>
              <div>
                <p className={`text-sm font-bold ${d ? "text-slate-200" : "text-slate-800"}`}>
                  ¿También quieres conocer cómo manejamos tus datos?
                </p>
                <p className={`text-xs mt-1 ${muted}`}>Lee nuestra Política de Privacidad.</p>
              </div>
              <Link to="/privacidad"
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0
                  ${d
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    : "bg-slate-900 hover:bg-slate-800 text-white"}`}>
                <Lock size={14} /> Política de Privacidad
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
            <Link to="/privacidad" className={`transition-colors ${d ? "hover:text-sky-400" : "hover:text-sky-600"}`}>Política de Privacidad</Link>
            <Link to="/login"      className={`transition-colors ${d ? "hover:text-slate-300" : "hover:text-slate-700"}`}>Iniciar sesión</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
