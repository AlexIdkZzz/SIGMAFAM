import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/auth/AuthContext";
import { useTheme } from "../app/theme/ThemeContext";
import {
  Sun, Moon, Lock, LogOut, Eye, EyeOff,
  CheckCircle2, AlertCircle, ChevronRight, Shield,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

/* ─── Componente: sección contenedor ─── */
function Section({ icon: Icon, title, subtitle, children, accent = "sky" }) {
  const accents = {
    sky:     "bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400",
    violet:  "bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400",
    red:     "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400",
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
    <div className="space-y-4 max-w-2xl">

      {/* ── Cabecera ── */}
      <div className="flex items-center gap-3 mb-2">
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
  );
}