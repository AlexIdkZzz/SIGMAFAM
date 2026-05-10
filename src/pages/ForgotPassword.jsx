import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Shield, Mail, ArrowRight, ArrowLeft,
  AlertCircle, Loader2, Sun, Moon,
  CheckCircle2, KeyRound, MailCheck, Lock, Clock
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [sent, setSent]       = useState(false);
  const [dark, setDark]       = useState(false);

  const emailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    [email]
  );

  async function onSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Ingresa tu correo electrónico."); return; }
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs = { USER_NOT_FOUND: "No encontramos una cuenta con ese correo." };
        throw new Error(msgs[data.error] ?? "No se pudo enviar el correo.");
      }
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const d = dark;

  return (
    <div className={`min-h-screen w-full flex font-sans transition-colors duration-500 ${d ? "bg-[#0a0f1e]" : "bg-white"}`}>

      {/* Toggle dark mode */}
      <button
        onClick={() => setDark(!d)}
        aria-label="Cambiar tema"
        className={`fixed top-4 right-4 z-50 group flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-full text-xs font-bold border backdrop-blur-md transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]
          ${d
            ? "bg-slate-800/70 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
            : "bg-white/70 border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-white shadow-sm"}`}
      >
        <span className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500
          ${d ? "bg-slate-700 text-amber-300 rotate-0" : "bg-slate-900 text-white -rotate-12"}`}>
          {d ? <Sun size={12} /> : <Moon size={12} />}
        </span>
        <span className="hidden sm:inline">{d ? "Claro" : "Oscuro"}</span>
      </button>

      {/* ── LEFT: Formulario ── */}
      <div className={`w-full lg:w-[480px] lg:min-w-[480px] flex flex-col justify-center
        min-h-screen
        px-5 sm:px-10 lg:px-16
        py-16 sm:py-12
        z-10 transition-colors duration-500
        ${d ? "bg-[#0d1426] lg:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)]" : "bg-white lg:shadow-2xl"}`}>

        <div className="max-w-sm w-full mx-auto">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] flex items-center justify-center transition-all duration-300 shrink-0 overflow-hidden
              ${d ? "bg-slate-100" : "bg-slate-900"}`}>
              <Shield className={`relative z-10 ${d ? "text-slate-900" : "text-white"}`} size={20} />
              <span className={`absolute inset-0 opacity-60
                ${d
                  ? "bg-gradient-to-br from-white/0 via-white/30 to-transparent"
                  : "bg-gradient-to-br from-white/15 via-transparent to-transparent"}`} />
            </div>
            <span className={`text-lg sm:text-xl font-black tracking-tighter transition-colors ${d ? "text-slate-100" : "text-slate-900"}`}>
              SIGMA<span className={d ? "text-sky-400" : "text-sky-600"}>FAM</span>
            </span>
          </div>

          {sent ? (
            /* ── ESTADO DE ÉXITO ── */
            <div className="animate-[fadeIn_0.4s_ease-out]">
              {/* Icono de éxito con glow */}
              <div className="relative w-16 h-16 mb-6">
                <div className={`absolute inset-0 rounded-2xl blur-xl opacity-60
                  ${d ? "bg-emerald-500/40" : "bg-emerald-400/60"}`} />
                <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center
                  ${d ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-emerald-50 border border-emerald-200"}`}>
                  <MailCheck className={d ? "text-emerald-400" : "text-emerald-600"} size={28} />
                </div>
              </div>

              <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 transition-colors ${d ? "text-slate-100" : "text-slate-900"}`}>
                Revisa tu correo
              </h1>
              <p className={`text-sm font-medium mb-2 leading-relaxed transition-colors ${d ? "text-slate-400" : "text-slate-500"}`}>
                Enviamos un código de recuperación a:
              </p>
              <div className={`mb-6 p-3 rounded-xl flex items-center gap-2.5 border
                ${d ? "bg-[#111827] border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                <Mail className={d ? "text-sky-400" : "text-sky-600"} size={15} />
                <span className={`text-sm font-bold ${d ? "text-slate-200" : "text-slate-900"}`}>
                  {email}
                </span>
              </div>

              {/* Aviso de caducidad */}
              <div className={`mb-6 flex items-start gap-2.5 text-xs font-medium p-2.5 rounded-lg
                ${d ? "text-slate-500" : "text-slate-500"}`}>
                <Clock size={13} className="shrink-0 mt-0.5" />
                <span>El código expira en 15 minutos. Si no lo ves, revisa tu carpeta de spam.</span>
              </div>

              {/* Botón: ingresar código */}
              <Link
                to="/reset-password"
                state={{ email }}
                className={`relative w-full overflow-hidden flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-xl font-bold text-sm
                  tracking-tight transition-all duration-300 active:scale-[0.98] group
                  ${d
                    ? "bg-gradient-to-b from-slate-50 to-slate-200 text-slate-900 hover:from-white hover:to-slate-100"
                    : "bg-gradient-to-b from-slate-800 to-slate-950 text-white hover:from-slate-700 hover:to-slate-900"}`}
                style={{
                  boxShadow: d
                    ? "inset 0 1px 0 rgba(255,255,255,0.6), 0 10px 25px -5px rgba(0,0,0,0.4)"
                    : "inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 25px -5px rgba(15,23,42,0.25)"
                }}
              >
                <span className={`absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none
                  ${d
                    ? "bg-gradient-to-r from-transparent via-sky-400/20 to-transparent"
                    : "bg-gradient-to-r from-transparent via-white/15 to-transparent"}`} />
                <span className="relative z-10 flex items-center gap-2">
                  Ingresar código
                  <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>

              <p className={`mt-5 text-center text-xs font-medium ${d ? "text-slate-500" : "text-slate-500"}`}>
                ¿No llegó el correo?{" "}
                <button
                  onClick={() => { setSent(false); setError(""); }}
                  className={`font-bold underline underline-offset-4 decoration-2 transition-colors
                    ${d ? "text-slate-200 hover:text-sky-400 decoration-slate-600" : "text-slate-900 hover:text-sky-600 decoration-slate-300"}`}
                >
                  Intentar de nuevo
                </button>
              </p>
            </div>
          ) : (
            /* ── FORMULARIO ── */
            <>
              {/* Badge móvil */}
              <div className={`lg:hidden inline-flex items-center gap-2 px-2.5 py-1 rounded-full mb-4 text-[10px] font-bold tracking-widest uppercase border
                ${d ? "bg-slate-800/60 border-slate-700 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                Recuperación segura
              </div>

              <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 transition-colors ${d ? "text-slate-100" : "text-slate-900"}`}>
                ¿Olvidaste tu contraseña?
              </h1>
              <p className={`text-sm font-medium mb-7 leading-relaxed transition-colors ${d ? "text-slate-400" : "text-slate-500"}`}>
                Ingresa tu correo y te enviaremos un código para restablecerla en segundos.
              </p>

              {/* Error */}
              {error && (
                <div className={`mb-5 p-3.5 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3 animate-[shake_0.4s_ease-in-out]
                  ${d ? "bg-red-950/40" : "bg-red-50"}`}>
                  <AlertCircle className="text-red-500 shrink-0" size={17} />
                  <p className={`text-xs sm:text-sm font-semibold ${d ? "text-red-400" : "text-red-700"}`}>{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">

                <div>
                  <label className={`block text-xs font-bold mb-2 transition-colors ${d ? "text-slate-300" : "text-slate-700"}`}>
                    Correo electrónico
                  </label>
                  <div className="relative group">
                    <Mail
                      size={15}
                      className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors
                        ${d ? "text-slate-500 group-focus-within:text-sky-400" : "text-slate-400 group-focus-within:text-slate-900"}`}
                    />
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className={`block w-full pl-10 pr-11 py-3 sm:py-3.5 rounded-xl text-sm font-medium outline-none border transition-all duration-200
                        ${d
                          ? "bg-[#111827] border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-sky-500/60 focus:bg-[#1a2234] focus:ring-4 focus:ring-sky-500/10"
                          : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"}`}
                    />
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300
                      ${emailValid ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}>
                      <CheckCircle2 size={16} className={d ? "text-emerald-400" : "text-emerald-500"} />
                    </div>
                  </div>
                </div>

                {/* ── BOTÓN PRINCIPAL ── */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`relative w-full overflow-hidden flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-xl font-bold text-sm
                    tracking-tight transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1 group
                    ${d
                      ? "bg-gradient-to-b from-slate-50 to-slate-200 text-slate-900 hover:from-white hover:to-slate-100"
                      : "bg-gradient-to-b from-slate-800 to-slate-950 text-white hover:from-slate-700 hover:to-slate-900"}`}
                  style={{
                    boxShadow: d
                      ? "inset 0 1px 0 rgba(255,255,255,0.6), 0 10px 25px -5px rgba(0,0,0,0.4)"
                      : "inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 25px -5px rgba(15,23,42,0.25)"
                  }}
                >
                  <span className={`absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none
                    ${d
                      ? "bg-gradient-to-r from-transparent via-sky-400/20 to-transparent"
                      : "bg-gradient-to-r from-transparent via-white/15 to-transparent"}`} />

                  {loading ? (
                    <span className="relative z-10 flex items-center gap-2">
                      <Loader2 className="animate-spin" size={17} />
                      Enviando...
                    </span>
                  ) : (
                    <span className="relative z-10 flex items-center gap-2">
                      Enviar código de recuperación
                      <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  )}
                </button>
              </form>

              <Link
                to="/login"
                className={`mt-8 inline-flex items-center gap-1.5 text-xs font-bold transition-colors group
                  ${d ? "text-slate-400 hover:text-sky-400" : "text-slate-500 hover:text-slate-900"}`}
              >
                <ArrowLeft size={13} className="transition-transform duration-300 group-hover:-translate-x-1" />
                Volver al inicio de sesión
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT: Decorativo — solo en desktop ── */}
      <div className="hidden lg:flex flex-1 relative bg-[#0f172a] items-center justify-center overflow-hidden">

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }}
        />

        <div className="absolute top-[-80px] right-[-80px] w-96 h-96 rounded-full pointer-events-none animate-[pulse_6s_ease-in-out_infinite]"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.14) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-80 h-80 rounded-full pointer-events-none animate-[pulse_8s_ease-in-out_infinite]"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />

        <div className="relative z-10 max-w-[420px] w-full px-10">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-slate-400 text-[11px] font-bold tracking-widest uppercase mb-8">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            Proceso seguro
          </div>

          <h2 className="text-[42px] font-black text-white leading-[1.08] mb-5 tracking-tighter">
            Recupera el<br />acceso en{" "}
            <span className="text-sky-400">3 pasos.</span>
          </h2>

          <p className="text-slate-500 text-[15px] leading-relaxed font-medium mb-8">
            Te enviamos un código único a tu correo. Caduca en 15 minutos y solo puede usarse una vez.
          </p>

          {/* Timeline de pasos */}
          <div className="space-y-3">
            {[
              { Icon: Mail,      title: "Ingresa tu correo",       desc: "Lo verificamos en segundos"     },
              { Icon: KeyRound,  title: "Recibe tu código",        desc: "Único y con expiración automática" },
              { Icon: Lock,      title: "Crea nueva contraseña",   desc: "Mínimo 6 caracteres seguros"    },
            ].map(({ Icon, title, desc }, i) => (
              <div key={title} className="relative flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-sky-500/30 hover:bg-white/[0.05] transition-all duration-300 group">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                    <Icon className="text-sky-400" size={16} />
                  </div>
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-500 text-white text-[9px] font-black flex items-center justify-center shadow-lg shadow-sky-500/40">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">{title}</p>
                  <p className="text-slate-500 text-xs mt-0.5 font-medium">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}