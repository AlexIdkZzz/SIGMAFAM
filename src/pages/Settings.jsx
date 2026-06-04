import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/auth/AuthContext";
import { useTheme } from "../app/theme/ThemeContext";
import {
  Sun, Moon, Lock, LogOut, Eye, EyeOff,
  CheckCircle2, AlertCircle, ChevronRight, Shield,
  ScrollText, ShieldAlert, Mail, HelpCircle, ChevronDown,
  ExternalLink, Ticket, Trash2, ArrowLeft, FileText, BookOpen,
  Download, Smartphone,
} from "lucide-react";
import ManualView from "./_manual";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

function authHeaders(token) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

/* ─── Iconos de marca (SVG inline) ─── */
function IconInstagram({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}
function IconGithub({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

/* ─── Átomos reutilizables ─── */
function Section({ icon: Icon, title, subtitle, children, accent = "sky" }) {
  const accents = {
    sky:     "bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400",
    violet:  "bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400",
    red:     "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400",
    emerald: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    amber:   "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
    slate:   "bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400",
    indigo:  "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  }[accent];
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1628] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accents}`}>
          <Icon size={17} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</p>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all"
        />
        <button type="button" onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" tabIndex={-1}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

function InlineAlert({ type, message }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
      isError
        ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30"
        : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
    }`}>
      {isError ? <AlertCircle size={15} className="flex-shrink-0" /> : <CheckCircle2 size={15} className="flex-shrink-0" />}
      {message}
    </div>
  );
}

/* ─── Componentes para la vista Legal ─── */
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 py-3.5 text-left group">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{question}</span>
        <ChevronDown size={15} className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="pb-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{answer}</p>}
    </div>
  );
}

function ContactLink({ icon: Icon, label, value, href, accent = "text-sky-600 dark:text-sky-400" }) {
  const content = (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
      <div className="flex items-center gap-3">
        <Icon size={16} className={`flex-shrink-0 ${accent}`} />
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</p>
        </div>
      </div>
      {href && <ExternalLink size={13} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />}
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noopener noreferrer">{content}</a> : <div>{content}</div>;
}

function TermItem({ number, children }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold flex items-center justify-center mt-0.5">{number}</span>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{children}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  SUB-VISTA: LEGAL                                           */
/* ═══════════════════════════════════════════════════════════ */
function isStandaloneMode() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

function InstallPwaSection() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => isStandaloneMode());
  const [message, setMessage] = useState("");

  useEffect(() => {
    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setInstallPrompt(e);
      setMessage("");
    }

    function handleInstalled() {
      setInstalled(true);
      setInstallPrompt(null);
      setMessage("SIGMAFAM ya está instalada en este dispositivo.");
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (installed) {
      setMessage("SIGMAFAM ya está instalada en este dispositivo.");
      return;
    }

    if (!installPrompt) {
      setMessage("Si no aparece el instalador, usa el menú del navegador y elige Agregar a pantalla de inicio o Instalar aplicación.");
      return;
    }

    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setMessage("Instalación iniciada.");
    } else {
      setMessage("Instalación cancelada. Puedes intentarlo de nuevo desde esta sección.");
    }
  }

  return (
    <Section icon={Smartphone} title="Instalar SIGMAFAM" subtitle="Agrega la app al celular o PC" accent="emerald">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Usa SIGMAFAM como aplicación
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 leading-relaxed">
            Se abrirá sin barra del navegador y quedará disponible desde tu pantalla de inicio o escritorio.
          </p>
          {message && (
            <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {message}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all shadow-sm active:scale-[0.98]"
        >
          <Download size={15} />
          {installed ? "Instalada" : "Instalar app"}
        </button>
      </div>
    </Section>
  );
}

function LegalView({ onBack, onGoToManual }) {
  return (
    <div className="space-y-5">
      <button onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
        <ArrowLeft size={15} /> Volver a Configuración
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center shadow-md flex-shrink-0">
          <FileText size={18} className="text-white dark:text-slate-900" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Legal e Información</h1>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-0.5">Términos, privacidad, contacto y ayuda</p>
        </div>
      </div>

      {/* Manual de usuario — enlace destacado */}
      <button
        onClick={onGoToManual}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border border-slate-900 dark:border-slate-600 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white transition-all group shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <BookOpen size={17} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white">Manual de Usuario</p>
            <p className="text-xs text-slate-400 mt-0.5">Guía completa de todas las funciones de SIGMAFAM</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-400 group-hover:text-white transition-colors flex-shrink-0" />
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* TyC */}
        <Section icon={ScrollText} title="Términos y Condiciones" subtitle="Última actualización: mayo 2026" accent="slate">
          <TermItem number="1">El uso de SIGMAFAM implica la aceptación plena de estos términos. Si no estás de acuerdo, debes discontinuar el uso de la aplicación.</TermItem>
          <TermItem number="2">SIGMAFAM es exclusivamente para uso personal y familiar. Queda prohibido su uso con fines comerciales sin autorización expresa.</TermItem>
          <TermItem number="3">El usuario es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades realizadas bajo su cuenta.</TermItem>
          <TermItem number="4">Nos reservamos el derecho de modificar, suspender o discontinuar el servicio en cualquier momento, con o sin previo aviso.</TermItem>
          <TermItem number="5">Los datos personales se almacenan conforme a nuestra política de privacidad. No compartimos información con terceros sin consentimiento.</TermItem>
        </Section>

        {/* Descarga de responsabilidad */}
        <Section icon={ShieldAlert} title="Descarga de Responsabilidad" subtitle="Leer antes de usar el sistema de alertas" accent="amber">
          <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-3 mb-4">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">Aviso importante</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
              SIGMAFAM es un proyecto académico del CETI Tonalá. <strong>No reemplaza</strong> a los servicios de emergencia oficiales.
            </p>
          </div>
          <TermItem number="•">Ante cualquier emergencia real, contacta al <strong className="text-slate-700 dark:text-slate-300">911</strong> u otras autoridades competentes.</TermItem>
          <TermItem number="•">La ubicación es aproximada y puede verse afectada por la señal GPS del dispositivo.</TermItem>
          <TermItem number="•">No garantizamos disponibilidad continua. El sistema puede presentar interrupciones sin previo aviso.</TermItem>
          <TermItem number="•">Los desarrolladores no asumen responsabilidad por daños derivados del uso incorrecto o fallas técnicas.</TermItem>
        </Section>

      </div>

      {/* Política de privacidad (ancho completo) */}
      <Section icon={Lock} title="Política de Privacidad" subtitle="Última actualización: mayo 2026" accent="violet">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500 dark:text-violet-400 mb-2">1. Datos que recopilamos</p>
            <TermItem number="•"><strong className="text-slate-700 dark:text-slate-300">Cuenta:</strong> nombre completo y correo electrónico al registrarte.</TermItem>
            <TermItem number="•"><strong className="text-slate-700 dark:text-slate-300">Ubicación:</strong> coordenadas GPS únicamente al activar una alerta. No rastreamos en segundo plano.</TermItem>
            <TermItem number="•"><strong className="text-slate-700 dark:text-slate-300">Dispositivo:</strong> identificador único del IoT vinculado a tu cuenta.</TermItem>
            <TermItem number="•"><strong className="text-slate-700 dark:text-slate-300">Contactos:</strong> nombre y teléfono que tú registres voluntariamente.</TermItem>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500 dark:text-violet-400 mt-5 mb-2">2. Cómo usamos tus datos</p>
            <TermItem number="•">Enviar notificaciones de emergencia por WhatsApp cuando se activa una alerta.</TermItem>
            <TermItem number="•">Mostrar el historial de alertas a ti y a tu grupo familiar.</TermItem>
            <TermItem number="•">Registrar eventos de auditoría internos para garantizar la integridad del sistema.</TermItem>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500 dark:text-violet-400 mb-2">3. Compartición de datos</p>
            <TermItem number="•">Tus datos <strong className="text-slate-700 dark:text-slate-300">no se venden ni comparten</strong> con terceros, salvo la Meta WhatsApp API para el envío de alertas.</TermItem>
            <TermItem number="•">Los miembros de tu grupo familiar pueden ver las alertas generadas dentro del grupo.</TermItem>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500 dark:text-violet-400 mt-5 mb-2">4. Seguridad</p>
            <TermItem number="•">Las contraseñas almacenadas son encriptadas con métodos avanzados. Nunca en texto plano.</TermItem>
            <TermItem number="•">Comunicación encriptada y segura con tokens de sesión.</TermItem>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500 dark:text-violet-400 mt-5 mb-2">5. Tus derechos</p>
            <TermItem number="•">Puedes solicitar la eliminación de tu cuenta escribiendo a <strong className="text-slate-700 dark:text-slate-300">sigmafam@castoresceti.com</strong> o desde Configuración.</TermItem>
            <TermItem number="•">Sin cookies de rastreo ni analítica de terceros.</TermItem>
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* Contacto */}
        <Section icon={Mail} title="Contacto y Redes Sociales" subtitle="Comunícate con el equipo de desarrollo" accent="sky">
          <div className="flex flex-col gap-2">
            <ContactLink icon={Mail} label="Correo electrónico" value="sigmafam@castoresceti.com" href="mailto:sigmafam@castoresceti.com" accent="text-sky-600 dark:text-sky-400" />
            <ContactLink icon={IconInstagram} label="Instagram" value="@alexidk_zzz" href="https://www.instagram.com/alexidk_zzz/" accent="text-pink-500 dark:text-pink-400" />
            <ContactLink icon={IconGithub} label="GitHub" value="github.com/AlexIdkZzz" href="https://github.com/AlexIdkZzz" accent="text-slate-700 dark:text-slate-300" />
          </div>
          <p className="mt-4 text-xs text-slate-400 dark:text-slate-600 italic">Proyecto académico - CETI Tonalá 2026.</p>
        </Section>

        {/* FAQ */}
        <Section icon={HelpCircle} title="Preguntas Frecuentes" subtitle="Respuestas a las dudas más comunes" accent="emerald">
          <FaqItem question="¿Qué es SIGMAFAM?" answer="Sistema Integral de Gestión y Monitoreo Familiar. Envía alertas geolocalizadas a contactos de confianza y miembros del grupo familiar." />
          <FaqItem question="¿Cómo funciona el botón de alerta?" answer="Al activar una alerta, el sistema registra tu ubicación y envía notificaciones por WhatsApp a tus contactos de emergencia con un enlace de localización." />
          <FaqItem question="¿Mis datos de ubicación están seguros?" answer="Sí. Solo son accesibles por ti y tu grupo familiar. No compartimos información con terceros." />
          <FaqItem question="¿Qué hago si se activa una alerta por error?" answer="Cambia su estado a 'Cerrada' desde Gestión de Alertas y notifica directamente a tus contactos." />
          <FaqItem question="¿Puedo usar SIGMAFAM sin dispositivo IoT?" answer="Sí. La app web permite enviar alertas manualmente. El dispositivo IoT es complementario." />
        </Section>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  PÁGINA PRINCIPAL                                           */
/* ═══════════════════════════════════════════════════════════ */
export default function Settings() {
  const { user, token, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [view, setView] = useState("main"); // "main" | "legal" | "manual"

  /* ── Contraseña ── */
  const [pwForm, setPwForm]     = useState({ current: "", next: "", confirm: "" });
  const [pwStatus, setPwStatus] = useState({ type: null, msg: "" });
  const [pwLoading, setPwLoading] = useState(false);

  /* ── Sesión ── */
  const [confirmLogout, setConfirmLogout] = useState(false);

  /* ── Ticket ── */
  const TICKET_TYPES = [
    { value: "REMOVE_FROM_GROUP", label: "Salir / eliminar del grupo familiar" },
    { value: "DELETE_DATA",       label: "Eliminar mis datos del sistema" },
    { value: "CHANGE_NAME",       label: "Cambiar mi nombre" },
    { value: "CHANGE_PASSWORD",   label: "Ayuda con contraseña" },
    { value: "BUG_REPORT",        label: "Reportar un error" },
    { value: "OTHER",             label: "Otro" },
  ];
  const [ticketType, setTicketType]     = useState("");
  const [ticketDesc, setTicketDesc]     = useState("");
  const [ticketStatus, setTicketStatus] = useState({ type: null, msg: "" });
  const [ticketLoading, setTicketLoading] = useState(false);
  const [myTickets, setMyTickets]       = useState([]);

  /* ── Eliminar cuenta ── */
  const [deleteStep, setDeleteStep]     = useState(0); // 0=idle 1=confirm 2=password
  const [deletePw, setDeletePw]         = useState("");
  const [deleteStatus, setDeleteStatus] = useState({ type: null, msg: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* Cargar mis tickets al montar */
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/tickets/mine`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((d) => { if (d.tickets) setMyTickets(d.tickets); })
      .catch(() => {});
  }, [token, ticketStatus.type]);

  /* ── Handlers ── */
  async function handleChangePassword(e) {
    e.preventDefault();
    setPwStatus({ type: null, msg: "" });
    if (!pwForm.current || !pwForm.next || !pwForm.confirm)
      return setPwStatus({ type: "error", msg: "Completa todos los campos." });
    if (pwForm.next.length < 6)
      return setPwStatus({ type: "error", msg: "La nueva contraseña debe tener al menos 6 caracteres." });
    if (pwForm.next !== pwForm.confirm)
      return setPwStatus({ type: "error", msg: "Las contraseñas nuevas no coinciden." });
    setPwLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/change-password`, {
        method: "PUT", headers: authHeaders(token),
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs = { WRONG_CURRENT_PASSWORD: "La contraseña actual es incorrecta.", PASSWORD_TOO_SHORT: "Mínimo 6 caracteres.", MISSING_FIELDS: "Completa todos los campos." };
        return setPwStatus({ type: "error", msg: msgs[data.error] ?? "Error al cambiar la contraseña." });
      }
      setPwForm({ current: "", next: "", confirm: "" });
      setPwStatus({ type: "success", msg: "¡Contraseña actualizada!" });
    } catch {
      setPwStatus({ type: "error", msg: "No se pudo conectar con el servidor." });
    } finally {
      setPwLoading(false);
    }
  }

  async function handleTicketSubmit(e) {
    e.preventDefault();
    setTicketStatus({ type: null, msg: "" });
    if (!ticketType) return setTicketStatus({ type: "error", msg: "Selecciona el tipo de solicitud." });
    setTicketLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tickets`, {
        method: "POST", headers: authHeaders(token),
        body: JSON.stringify({ type: ticketType, description: ticketDesc }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msgs = {
          INVALID_TYPE:  "Tipo de solicitud no válido.",
          SERVER_ERROR:  "Error interno del servidor. Intenta de nuevo.",
        };
        return setTicketStatus({ type: "error", msg: msgs[data.error] ?? "No se pudo enviar el ticket. Intenta de nuevo." });
      }
      setTicketType(""); setTicketDesc("");
      setTicketStatus({ type: "success", msg: "¡Ticket enviado! El equipo lo revisará pronto." });
    } catch {
      setTicketStatus({ type: "error", msg: "No se pudo conectar con el servidor." });
    } finally {
      setTicketLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteStatus({ type: null, msg: "" });
    if (!deletePw) return setDeleteStatus({ type: "error", msg: "Ingresa tu contraseña para confirmar." });
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/account`, {
        method: "DELETE", headers: authHeaders(token),
        body: JSON.stringify({ password: deletePw }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs = { WRONG_PASSWORD: "Contraseña incorrecta.", MISSING_FIELDS: "Ingresa tu contraseña." };
        return setDeleteStatus({ type: "error", msg: msgs[data.error] ?? "Error al eliminar la cuenta." });
      }
      logout();
      navigate("/login", { replace: true });
    } catch {
      setDeleteStatus({ type: "error", msg: "No se pudo conectar con el servidor." });
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleLogout() { logout(); navigate("/login", { replace: true }); }

  const ticketStatusLabel = { OPEN: "Abierto", IN_PROGRESS: "En revisión", CLOSED: "Resuelto" };
  const ticketStatusColor = {
    OPEN:        "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    IN_PROGRESS: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    CLOSED:      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };

  /* ── Sub-vistas ── */
  if (view === "manual") return <ManualView onBack={() => setView("legal")} />;
  if (view === "legal")  return <LegalView onBack={() => setView("main")} onGoToManual={() => setView("manual")} />;

  /* ─────────────────────────── RENDER PRINCIPAL ─────────────────────────── */
  return (
    <div className="space-y-5">

      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center shadow-md flex-shrink-0">
          <Shield size={18} className="text-white dark:text-slate-900" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Configuración</h1>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-0.5">
            {user?.fullName && <span className="font-medium text-slate-700 dark:text-slate-300">{user.fullName}</span>}
            {user?.email && <span className="text-slate-400 dark:text-slate-600"> · {user.email}</span>}
          </p>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* Columna izquierda */}
        <div className="flex flex-col gap-5">

          {/* Apariencia */}
          <Section icon={dark ? Moon : Sun} title="Apariencia" subtitle="Cambia el tema visual de la aplicación" accent="violet">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Tema {dark ? "oscuro" : "claro"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                  {dark ? "Modo oscuro activo — ideal para ambientes con poca luz." : "Modo claro activo — ideal para uso diurno."}
                </p>
              </div>
              <button onClick={toggle} aria-label="Cambiar tema"
                className={`relative flex-shrink-0 w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 dark:focus:ring-offset-slate-900 ${dark ? "bg-violet-600" : "bg-slate-200"}`}>
                <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 flex items-center justify-center ${dark ? "translate-x-7" : "translate-x-0"}`}>
                  {dark ? <Moon size={12} className="text-violet-600" /> : <Sun size={12} className="text-slate-400" />}
                </span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={() => !dark || toggle()}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${!dark ? "border-slate-900 bg-slate-900 text-white shadow-md" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}>
                <Sun size={15} /> Claro
              </button>
              <button onClick={() => dark || toggle()}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${dark ? "border-violet-600 bg-violet-600 text-white shadow-md" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}>
                <Moon size={15} /> Oscuro
              </button>
            </div>
          </Section>

          {/* Sesión */}
          <InstallPwaSection />

          <Section icon={LogOut} title="Sesión" subtitle="Cierra tu sesión en este dispositivo" accent="red">
            {!confirmLogout ? (
              <button onClick={() => setConfirmLogout(true)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-700 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 transition-all group">
                <div className="flex items-center gap-3">
                  <LogOut size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                  <span className="text-sm font-medium">Cerrar sesión</span>
                </div>
                <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-red-400 transition-colors" />
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-700 dark:text-slate-300">¿Seguro que quieres cerrar sesión?</p>
                <div className="flex gap-2">
                  <button onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all shadow-sm">
                    <LogOut size={14} /> Sí, cerrar sesión
                  </button>
                  <button onClick={() => setConfirmLogout(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </Section>

          {/* Navegar a Legales */}
          <button onClick={() => setView("legal")}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1628] hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
                <FileText size={17} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Legal e Información</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">TyC, privacidad, contacto y preguntas frecuentes</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
          </button>

        </div>

        {/* Columna derecha */}
        <div className="flex flex-col gap-5">

          {/* Contraseña */}
          <Section icon={Lock} title="Cambiar contraseña" subtitle="Elige una contraseña segura de al menos 6 caracteres" accent="sky">
            <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
              <PasswordField label="Contraseña actual" value={pwForm.current} onChange={(v) => setPwForm((f) => ({ ...f, current: v }))} placeholder="Tu contraseña actual" />
              <PasswordField label="Nueva contraseña" value={pwForm.next} onChange={(v) => setPwForm((f) => ({ ...f, next: v }))} placeholder="Mínimo 6 caracteres" />
              <PasswordField label="Confirmar nueva contraseña" value={pwForm.confirm} onChange={(v) => setPwForm((f) => ({ ...f, confirm: v }))} placeholder="Repite la nueva contraseña" />
              <InlineAlert type={pwStatus.type} message={pwStatus.msg} />
              <div className="flex justify-end pt-1">
                <button type="submit" disabled={pwLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-sm">
                  {pwLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Actualizando…</> : <><Lock size={14} /> Actualizar contraseña</>}
                </button>
              </div>
            </form>
          </Section>

          {/* Ticket */}
          <Section icon={Ticket} title="Abrir un ticket" subtitle="Envía una solicitud al equipo de administración" accent="indigo">
            <form onSubmit={handleTicketSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 tracking-wide">Tipo de solicitud</label>
                <select
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                >
                  <option value="">— Selecciona una opción —</option>
                  {TICKET_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 tracking-wide">Descripción <span className="font-normal text-slate-400">(opcional)</span></label>
                <textarea
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  rows={3}
                  placeholder="Describe tu solicitud con detalle..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 resize-none transition-all"
                />
              </div>
              <InlineAlert type={ticketStatus.type} message={ticketStatus.msg} />
              <div className="flex justify-end">
                <button type="submit" disabled={ticketLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-sm">
                  {ticketLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando…</> : <><Ticket size={14} /> Enviar ticket</>}
                </button>
              </div>
            </form>

            {/* Mis tickets */}
            {myTickets.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wide">Mis tickets recientes</p>
                {myTickets.slice(0, 4).map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        #{t.id} · {TICKET_TYPES.find((x) => x.value === t.type)?.label ?? t.type}
                      </p>
                      {t.admin_note && <p className="text-xs text-slate-400 mt-0.5 italic">"{t.admin_note}"</p>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${ticketStatusColor[t.status]}`}>
                      {ticketStatusLabel[t.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

        </div>
      </div>

      {/* Eliminar cuenta — ancho completo, al fondo */}
      <Section icon={Trash2} title="Eliminar cuenta" subtitle="Esta acción es permanente e irreversible" accent="red">
        {deleteStep === 0 && (
          <button onClick={() => setDeleteStep(1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
            <Trash2 size={14} /> Eliminar mi cuenta
          </button>
        )}

        {deleteStep === 1 && (
          <div className="space-y-4">
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3">
              <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">¿Estás completamente seguro?</p>
              <p className="text-sm text-red-600 dark:text-red-400/80 leading-relaxed">
                Se eliminarán permanentemente tu cuenta, datos personales y acceso al sistema. Esta acción <strong>no se puede deshacer</strong>.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteStep(2)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all shadow-sm">
                Sí, quiero eliminar mi cuenta
              </button>
              <button onClick={() => setDeleteStep(0)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {deleteStep === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-700 dark:text-slate-300">Confirma tu contraseña para proceder:</p>
            <PasswordField label="Contraseña actual" value={deletePw} onChange={setDeletePw} placeholder="Tu contraseña" />
            <InlineAlert type={deleteStatus.type} message={deleteStatus.msg} />
            <div className="flex gap-2">
              <button onClick={handleDeleteAccount} disabled={deleteLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-sm">
                {deleteLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Eliminando…</> : <><Trash2 size={14} /> Eliminar definitivamente</>}
              </button>
              <button onClick={() => { setDeleteStep(0); setDeletePw(""); setDeleteStatus({ type: null, msg: "" }); }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Section>

    </div>
  );
}
