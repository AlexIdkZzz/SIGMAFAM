import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../app/auth/AuthContext";
import {
  Shield, Mail, Lock, User, ArrowRight,
  AlertCircle, Loader2, Sun, Moon, Eye, EyeOff,
  CheckCircle2, Users, Bell, MapPin
} from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [dark, setDark]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  // ── Validaciones en vivo ──
  const nameValid = useMemo(
    () => fullName.trim().length > 1 && /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(fullName.trim()),
    [fullName]
  );
  const emailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    [email]
  );
  const passwordValid = password.length >= 6;
  const confirmValid  = confirm.length > 0 && confirm === password;
  const confirmMismatch = confirm.length > 0 && confirm !== password;

  // Fuerza de la contraseña (0-4)
  const passwordStrength = useMemo(() => {
    let s = 0;
    if (password.length >= 6)  s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    if (!/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(fullName.trim())) {
      setError("El nombre solo puede contener letras.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await register(fullName.trim(), email.trim(), password);
      nav("/verify", { state: { email: email.trim() } });
    } catch (err) {
      const msg = err.message ?? "";
      if (msg.includes("EMAIL_EXISTS")) {
        setError("Este correo ya está registrado.");
      } else {
        setError(msg || "No se pudo conectar con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  }

  const d = dark;
  const strengthColors = ["bg-slate-300", "bg-red-400", "bg-amber-400", "bg-sky-500", "bg-emerald-500"];
  const strengthLabels = ["Muy débil", "Débil", "Aceptable", "Buena", "Excelente"];

  return (
    <div className={`min-h-screen w-full flex font-sans transition-colors duration-500 ${d ? "bg-[#0a0f1e]" : "bg-white"}`}>

      {/* Toggle dark mode — pill animado */}
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

          {/* Badge móvil */}
          <div className={`lg:hidden inline-flex items-center gap-2 px-2.5 py-1 rounded-full mb-4 text-[10px] font-bold tracking-widest uppercase border
            ${d ? "bg-slate-800/60 border-slate-700 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
            Crea tu cuenta gratis
          </div>

          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 transition-colors ${d ? "text-slate-100" : "text-slate-900"}`}>
            Crea tu cuenta
          </h1>
          <p className={`text-sm font-medium mb-7 leading-relaxed transition-colors ${d ? "text-slate-400" : "text-slate-500"}`}>
            Empieza a proteger a tu familia en menos de un minuto.
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
          <form onSubmit={onSubmit} className="space-y-4">

            {/* Nombre completo */}
            <div>
              <label className={`block text-xs font-bold mb-2 transition-colors ${d ? "text-slate-300" : "text-slate-700"}`}>
                Nombre completo
              </label>
              <div className="relative group">
                <User
                  size={15}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors
                    ${d ? "text-slate-500 group-focus-within:text-sky-400" : "text-slate-400 group-focus-within:text-slate-900"}`}
                />
                <input
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Yael De Alba"
                  className={`block w-full pl-10 pr-11 py-3 rounded-xl text-sm font-medium outline-none border transition-all duration-200
                    ${d
                      ? "bg-[#111827] border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-sky-500/60 focus:bg-[#1a2234] focus:ring-4 focus:ring-sky-500/10"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"}`}
                />
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300
                  ${nameValid ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}>
                  <CheckCircle2 size={16} className={d ? "text-emerald-400" : "text-emerald-500"} />
                </div>
              </div>
            </div>

            {/* Email */}
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
                  className={`block w-full pl-10 pr-11 py-3 rounded-xl text-sm font-medium outline-none border transition-all duration-200
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

            {/* Password */}
            <div>
              <label className={`block text-xs font-bold mb-2 transition-colors ${d ? "text-slate-300" : "text-slate-700"}`}>
                Contraseña
              </label>
              <div className="relative group">
                <Lock
                  size={15}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors
                    ${d ? "text-slate-500 group-focus-within:text-sky-400" : "text-slate-400 group-focus-within:text-slate-900"}`}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={`block w-full pl-10 pr-12 py-3 rounded-xl text-sm font-medium outline-none border transition-all duration-200
                    ${d
                      ? "bg-[#111827] border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-sky-500/60 focus:bg-[#1a2234] focus:ring-4 focus:ring-sky-500/10"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors p-0.5
                    ${d ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-700"}`}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Barra de fuerza */}
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300
                        ${i < passwordStrength
                          ? strengthColors[passwordStrength]
                          : d ? "bg-slate-800" : "bg-slate-200"}`}
                      />
                    ))}
                  </div>
                  <span className={`text-[10px] font-bold tracking-wider uppercase min-w-[60px] text-right
                    ${d ? "text-slate-500" : "text-slate-500"}`}>
                    {strengthLabels[passwordStrength]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className={`block text-xs font-bold mb-2 transition-colors ${d ? "text-slate-300" : "text-slate-700"}`}>
                Confirmar contraseña
              </label>
              <div className="relative group">
                <Lock
                  size={15}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors
                    ${d ? "text-slate-500 group-focus-within:text-sky-400" : "text-slate-400 group-focus-within:text-slate-900"}`}
                />
                <input
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className={`block w-full pl-10 pr-20 py-3 rounded-xl text-sm font-medium outline-none border transition-all duration-200
                    ${confirmMismatch
                      ? d
                        ? "bg-red-950/20 border-red-500/50 text-slate-100 focus:ring-4 focus:ring-red-500/10"
                        : "bg-red-50 border-red-300 text-slate-900 focus:ring-4 focus:ring-red-500/10"
                      : d
                        ? "bg-[#111827] border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-sky-500/60 focus:bg-[#1a2234] focus:ring-4 focus:ring-sky-500/10"
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"}`}
                />
                <div className={`absolute right-11 top-1/2 -translate-y-1/2 transition-all duration-300
                  ${confirmValid ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}>
                  <CheckCircle2 size={16} className={d ? "text-emerald-400" : "text-emerald-500"} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors p-0.5
                    ${d ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-700"}`}
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {confirmMismatch && (
                <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${d ? "text-red-400" : "text-red-600"}`}>
                  <AlertCircle size={12} /> Las contraseñas no coinciden
                </p>
              )}
            </div>

            {/* ── BOTÓN PRINCIPAL ── */}
            <button
              type="submit"
              disabled={loading}
              className={`relative w-full overflow-hidden flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-xl font-bold text-sm
                tracking-tight transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2 group
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
                  Creando cuenta...
                </span>
              ) : (
                <span className="relative z-10 flex items-center gap-2">
                  Crear cuenta
                  <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              )}
            </button>
          </form>

          <p className={`mt-8 text-center text-xs font-medium ${d ? "text-slate-500" : "text-slate-500"}`}>
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/login"
              className={`font-bold underline underline-offset-4 decoration-2 transition-colors
                ${d ? "text-slate-200 hover:text-sky-400 decoration-slate-600" : "text-slate-900 hover:text-sky-600 decoration-slate-300"}`}
            >
              Inicia sesión
            </Link>
          </p>
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
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            Registro gratis · Sin tarjeta
          </div>

          <h2 className="text-[42px] font-black text-white leading-[1.08] mb-5 tracking-tighter">
            Únete a miles<br />de{" "}
            <span className="text-sky-400">familias.</span>
          </h2>

          <p className="text-slate-500 text-[15px] leading-relaxed font-medium mb-8">
            Configura tu red familiar, añade dispositivos IoT y empieza a recibir alertas en segundos.
          </p>

          {/* Checklist de beneficios */}
          <div className="space-y-3 mb-8">
            {[
              { Icon: Users,  title: "Red familiar",        desc: "Añade miembros con roles y permisos" },
              { Icon: Bell,   title: "Alertas en vivo",     desc: "Notificaciones instantáneas 24/7"    },
              { Icon: MapPin, title: "Ubicación en tiempo real", desc: "Monitoreo GPS de dispositivos"  },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-sky-500/30 hover:bg-white/[0.05] transition-all duration-300 group">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 group-hover:bg-sky-500/20 transition-colors">
                  <Icon className="text-sky-400" size={16} />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">{title}</p>
                  <p className="text-slate-500 text-xs mt-0.5 font-medium">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stat card inferior */}
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 flex items-center gap-4">
            <div className="flex -space-x-2">
              {["bg-sky-500", "bg-indigo-500", "bg-emerald-500"].map((c, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-[#0f172a]`} />
              ))}
            </div>
            <div>
              <p className="text-white font-bold text-sm">+2,500 familias</p>
              <p className="text-slate-500 text-[11px] font-mono mt-0.5">confiaron esta semana</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}