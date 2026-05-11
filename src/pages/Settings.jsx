import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/auth/AuthContext";
import { useTheme } from "../app/theme/ThemeContext";
import {
  Sun, Moon, Lock, LogOut, Eye, EyeOff,
  CheckCircle2, AlertCircle, ChevronRight, Shield,
  ScrollText, ShieldAlert, Mail, HelpCircle, ChevronDown,
  Instagram, Github, ExternalLink,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

/* ─── Componente: sección contenedor ─── */
function Section({ icon: Icon, title, subtitle, children, accent = "sky" }) {
  const accents = {
    sky:     "bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400",
    violet:  "bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400",
    red:     "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400",
    emerald: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    amber:   "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
    slate:   "bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400",
  }[accent];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1628] overflow-hidden">
      {/* Encabezado de sección */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accents}`}>
          <Icon size={17} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</p>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {/* Contenido */}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

/* ─── Componente: campo de contraseña ─── */
function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 tracking-wide">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 dark:focus:border-sky-500 transition-all"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

/* ─── Componente: alerta inline ─── */
function InlineAlert({ type, message }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
      isError
        ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30"
        : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
    }`}>
      {isError
        ? <AlertCircle size={15} className="flex-shrink-0" />
        : <CheckCircle2 size={15} className="flex-shrink-0" />}
      {message}
    </div>
  );
}

/* ─── Componente: ítem de FAQ (acordeón) ─── */
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 py-3.5 text-left group"
      >
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {question}
        </span>
        <ChevronDown
          size={15}
          className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  );
}

/* ─── Componente: enlace de contacto/red social ─── */
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
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer">{content}</a>
    : <div>{content}</div>;
}

/* ─── Componente: ítem de términos ─── */
function TermItem({ number, children }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold flex items-center justify-center mt-0.5">
        {number}
      </span>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{children}</p>
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

  /* ── Estado: cambio de contraseña ── */
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwStatus, setPwStatus] = useState({ type: null, msg: "" });
  const [pwLoading, setPwLoading] = useState(false);

  /* ── Estado: cerrar sesión ── */
  const [confirmLogout, setConfirmLogout] = useState(false);

  /* ── Handler: cambiar contraseña ── */
  async function handleChangePassword(e) {
    e.preventDefault();
    setPwStatus({ type: null, msg: "" });

    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      return setPwStatus({ type: "error", msg: "Completa todos los campos." });
    }
    if (pwForm.next.length < 6) {
      return setPwStatus({ type: "error", msg: "La nueva contraseña debe tener al menos 6 caracteres." });
    }
    if (pwForm.next !== pwForm.confirm) {
      return setPwStatus({ type: "error", msg: "Las contraseñas nuevas no coinciden." });
    }

    setPwLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: pwForm.current,
          newPassword: pwForm.next,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msgs = {
          WRONG_CURRENT_PASSWORD: "La contraseña actual es incorrecta.",
          PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 6 caracteres.",
          MISSING_FIELDS: "Completa todos los campos.",
        };
        return setPwStatus({ type: "error", msg: msgs[data.error] ?? "Error al cambiar la contraseña." });
      }

      setPwForm({ current: "", next: "", confirm: "" });
      setPwStatus({ type: "success", msg: "¡Contraseña actualizada correctamente!" });
    } catch {
      setPwStatus({ type: "error", msg: "No se pudo conectar con el servidor." });
    } finally {
      setPwLoading(false);
    }
  }

  /* ── Handler: cerrar sesión ── */
  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div className="space-y-5">

      {/* ── Cabecera ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center shadow-md flex-shrink-0">
          <Shield size={18} className="text-white dark:text-slate-900" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Configuración
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-0.5">
            {user?.fullName && <span className="font-medium text-slate-700 dark:text-slate-300">{user.fullName}</span>}
            {user?.email && <span className="text-slate-400 dark:text-slate-600"> · {user.email}</span>}
          </p>
        </div>
      </div>

      {/* ── Grid: 2 columnas en desktop, 1 en móvil ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* ── Columna izquierda ── */}
        <div className="flex flex-col gap-5">

          {/* ══════════ SECCIÓN 1 — Tema ══════════ */}
          <Section icon={dark ? Moon : Sun} title="Apariencia" subtitle="Cambia el tema visual de la aplicación" accent="violet">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Tema {dark ? "oscuro" : "claro"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                  {dark
                    ? "Modo oscuro activo — ideal para ambientes con poca luz."
                    : "Modo claro activo — ideal para uso diurno."}
                </p>
              </div>

              {/* Toggle switch */}
              <button
                onClick={toggle}
                aria-label="Cambiar tema"
                className={`relative flex-shrink-0 w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 dark:focus:ring-offset-slate-900 ${
                  dark ? "bg-violet-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 flex items-center justify-center ${
                    dark ? "translate-x-7" : "translate-x-0"
                  }`}
                >
                  {dark
                    ? <Moon size={12} className="text-violet-600" />
                    : <Sun size={12} className="text-slate-400" />}
                </span>
              </button>
            </div>

            {/* Botones de selección rápida */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => !dark || toggle()}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  !dark
                    ? "border-slate-900 bg-slate-900 text-white shadow-md"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Sun size={15} />
                Claro
              </button>
              <button
                onClick={() => dark || toggle()}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  dark
                    ? "border-violet-600 bg-violet-600 text-white shadow-md"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Moon size={15} />
                Oscuro
              </button>
            </div>
          </Section>

          {/* ══════════ SECCIÓN 3 — Cerrar sesión ══════════ */}
          <Section icon={LogOut} title="Sesión" subtitle="Cierra tu sesión en este dispositivo" accent="red">
            {!confirmLogout ? (
              <button
                onClick={() => setConfirmLogout(true)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-700 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <LogOut size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                  <span className="text-sm font-medium">Cerrar sesión</span>
                </div>
                <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-red-400 transition-colors" />
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  ¿Seguro que quieres cerrar sesión?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all shadow-sm"
                  >
                    <LogOut size={14} />
                    Sí, cerrar sesión
                  </button>
                  <button
                    onClick={() => setConfirmLogout(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </Section>

        </div>

        {/* ── Columna derecha ── */}
        <div>

          {/* ══════════ SECCIÓN 2 — Contraseña ══════════ */}
          <Section icon={Lock} title="Cambiar contraseña" subtitle="Elige una contraseña segura de al menos 6 caracteres" accent="sky">
            <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
              <PasswordField
                label="Contraseña actual"
                value={pwForm.current}
                onChange={(v) => setPwForm((f) => ({ ...f, current: v }))}
                placeholder="Tu contraseña actual"
              />
              <PasswordField
                label="Nueva contraseña"
                value={pwForm.next}
                onChange={(v) => setPwForm((f) => ({ ...f, next: v }))}
                placeholder="Mínimo 6 caracteres"
              />
              <PasswordField
                label="Confirmar nueva contraseña"
                value={pwForm.confirm}
                onChange={(v) => setPwForm((f) => ({ ...f, confirm: v }))}
                placeholder="Repite la nueva contraseña"
              />

              <InlineAlert type={pwStatus.type} message={pwStatus.msg} />

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {pwLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Actualizando…
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      Actualizar contraseña
                    </>
                  )}
                </button>
              </div>
            </form>
          </Section>

        </div>

      </div>

      {/* ── Separador ── */}
      <div className="flex items-center gap-3 pt-2">
        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 dark:text-slate-700">Legal e información</span>
        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
      </div>

      {/* ── Grid 2 columnas: TyC + Descarga ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* ══════════ TyC ══════════ */}
        <Section icon={ScrollText} title="Términos y Condiciones" subtitle="Última actualización: enero 2025" accent="slate">
          <TermItem number="1">
            El uso de SIGMAFAM implica la aceptación plena de estos términos. Si no estás de acuerdo, debes discontinuar el uso de la aplicación.
          </TermItem>
          <TermItem number="2">
            SIGMAFAM es exclusivamente para uso personal y familiar. Queda prohibido su uso con fines comerciales o de redistribución sin autorización expresa.
          </TermItem>
          <TermItem number="3">
            El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades realizadas bajo su cuenta.
          </TermItem>
          <TermItem number="4">
            Nos reservamos el derecho de modificar, suspender o discontinuar el servicio en cualquier momento, con o sin previo aviso.
          </TermItem>
          <TermItem number="5">
            Los datos personales se almacenan y procesan conforme a nuestra política de privacidad. No compartimos información con terceros sin consentimiento.
          </TermItem>
        </Section>

        {/* ══════════ Descarga de responsabilidad ══════════ */}
        <Section icon={ShieldAlert} title="Descarga de Responsabilidad" subtitle="Leer antes de usar el sistema de alertas" accent="amber">
          <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-3 mb-4">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">Aviso importante</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
              SIGMAFAM es un proyecto académico del CETI Tonalá. <strong>No reemplaza</strong> a los servicios de emergencia oficiales.
            </p>
          </div>
          <TermItem number="•">
            Ante cualquier emergencia real, contacta de inmediato al <strong className="text-slate-700 dark:text-slate-300">911</strong> u otras autoridades competentes.
          </TermItem>
          <TermItem number="•">
            La ubicación reportada por el sistema es aproximada y puede verse afectada por la señal del dispositivo o GPS.
          </TermItem>
          <TermItem number="•">
            No garantizamos disponibilidad continua del servicio. El sistema puede presentar interrupciones sin previo aviso.
          </TermItem>
          <TermItem number="•">
            Los desarrolladores no asumen responsabilidad por daños derivados del uso incorrecto o de fallas técnicas del sistema.
          </TermItem>
        </Section>

      </div>

      {/* ── Grid 2 columnas: Contacto + FAQ ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* ══════════ Contacto y redes sociales ══════════ */}
        <Section icon={Mail} title="Contacto y Redes Sociales" subtitle="Comunícate con el equipo de desarrollo" accent="sky">
          <div className="flex flex-col gap-2">
            <ContactLink
              icon={Mail}
              label="Correo electrónico"
              value="sigmafam@castoresceti.com"
              href="mailto:sigmafam@castoresceti.com"
              accent="text-sky-600 dark:text-sky-400"
            />
            <ContactLink
              icon={Instagram}
              label="Instagram"
              value="@alexidk_zzz"
              href="https://www.instagram.com/alexidk_zzz/"
              accent="text-pink-500 dark:text-pink-400"
            />
            <ContactLink
              icon={Github}
              label="GitHub"
              value="github.com/AlexIdkZzz"
              href="https://github.com/AlexIdkZzz"
              accent="text-slate-700 dark:text-slate-300"
            />
          </div>
          <p className="mt-4 text-xs text-slate-400 dark:text-slate-600 italic">
            CETI Tonalá 2025. Proyecto académico de desarrollo de software. No usar con fines comerciales.
          </p>
        </Section>

        {/* ══════════ Preguntas y Respuestas ══════════ */}
        <Section icon={HelpCircle} title="Preguntas Frecuentes" subtitle="Respuestas a las dudas más comunes" accent="emerald">
          <FaqItem
            question="¿Qué es SIGMAFAM?"
            answer="SIGMAFAM es un Sistema Integral de Gestión y Monitoreo Familiar. Permite enviar alertas de emergencia geolocalizadas a contactos de confianza y a los miembros del grupo familiar registrados."
          />
          <FaqItem
            question="¿Cómo funciona el botón de alerta?"
            answer="Al activar una alerta (desde la app web o el dispositivo IoT), el sistema registra tu ubicación y envía notificaciones por WhatsApp a tus contactos de emergencia con un enlace de localización."
          />
          <FaqItem
            question="¿Mis datos de ubicación están seguros?"
            answer="Sí. Los datos de ubicación se almacenan de forma cifrada y solo son accesibles por ti y los miembros de tu grupo familiar. No compartimos información con terceros."
          />
          <FaqItem
            question="¿Qué hago si se activa una alerta por error?"
            answer="Puedes cambiar el estado de la alerta a 'Cerrada' desde la sección Gestión de Alertas. También puedes notificar directamente a tus contactos para informarles que fue un falso positivo."
          />
          <FaqItem
            question="¿Puedo usar SIGMAFAM sin dispositivo IoT?"
            answer="Sí. La aplicación web permite enviar alertas manualmente desde cualquier dispositivo con navegador. El dispositivo IoT es complementario y permite activar alertas físicamente sin necesidad del celular."
          />
        </Section>

      </div>

    </div>
  );
}
