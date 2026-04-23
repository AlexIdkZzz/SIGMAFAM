import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../app/auth/AuthContext";
import {
  Shield, Mail, Lock, ArrowRight,
  AlertCircle, Loader2, Sun, Moon, Eye, EyeOff
} from "lucide-react";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "EMAIL_NOT_VERIFIED") {
          navigate("/verify", { state: { email } });
          return;
        }
        throw new Error(data.error || "Error al iniciar sesión");
      }
      login(data.user, data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const d = dark;

  return (
    <div className={`min-h-screen w-full flex font-sans transition-colors duration-300 ${d ? "bg-[#0a0f1e]" : "bg-white"}`}>

      {/* Toggle dark mode */}
      <button
        onClick={() => setDark(!d)}
        className={`fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-all
          ${d
            ? "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
            : "bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-400"}`}
      >
        {d ? <Sun size={13} /> : <Moon size={13} />}
        <span className="hidden sm:inline">{d ? "Modo claro" : "Modo oscuro"}</span>
      </button>

      {/* ── LEFT: Formulario ── */}
      <div className={`w-full lg:w-[480px] lg:min-w-[480px] flex flex-col justify-center
        min-h-screen
        px-5 sm:px-10 lg:px-16
        py-16 sm:py-12
        z-10 transition-colors duration-300
        ${d ? "bg-[#0d1426] lg:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)]" : "bg-white lg:shadow-2xl"}`}>

        <div className="max-w-sm w-full mx-auto">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] flex items-center justify-center transition-colors shrink-0
              ${d ? "bg-slate-100" : "bg-slate-900"}`}>
              <Shield className={d ? "text-slate-900" : "text-white"} size={20} />
            </div>
            <span className={`text-lg sm:text-xl font-black tracking-tighter transition-colors ${d ? "text-slate-100" : "text-slate-900"}`}>
              SIGMAFAM
            </span>
          </div>

          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 transition-colors ${d ? "text-slate-100" : "text-slate-900"}`}>
            Bienvenido de nuevo
          </h1>
          <p className={`text-sm font-medium mb-7 leading-relaxed transition-colors ${d ? "text-slate-400" : "text-slate-500"}`}>
            Ingresa tus credenciales para acceder a tu panel familiar.
          </p>

          {/* Error */}
          {error && (
            <div className={`mb-5 p-3.5 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3
              ${d ? "bg-red-950/40" : "bg-red-50"}`}>
              <AlertCircle className="text-red-500 shrink-0" size={17} />
              <p className={`text-xs sm:text-sm font-semibold ${d ? "text-red-400" : "text-red-700"}`}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

            {/* Email */}
            <div>
              <label className={`block text-xs font-bold mb-2 transition-colors ${d ? "text-slate-300" : "text-slate-700"}`}>
                Correo Electrónico
              </label>
              <div className="relative group">
                <Mail
                  size={15}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors
                    ${d ? "text-slate-500 group-focus-within:text-slate-200" : "text-slate-400 group-focus-within:text-slate-900"}`}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className={`block w-full pl-10 pr-4 py-3 sm:py-3.5 rounded-xl text-sm font-medium outline-none border transition-all
                    ${d
                      ? "bg-[#111827] border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-slate-400 focus:bg-[#1a2234] focus:ring-2 focus:ring-slate-600"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-200"}`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-xs font-bold transition-colors ${d ? "text-slate-300" : "text-slate-700"}`}>
                  Contraseña
                </label>
                <Link
                  to="/forgot-password"
                  className={`text-xs font-bold transition-colors ${d ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-900"}`}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative group">
                <Lock
                  size={15}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors
                    ${d ? "text-slate-500 group-focus-within:text-slate-200" : "text-slate-400 group-focus-within:text-slate-900"}`}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-12 py-3 sm:py-3.5 rounded-xl text-sm font-medium outline-none border transition-all
                    ${d
                      ? "bg-[#111827] border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-slate-400 focus:bg-[#1a2234] focus:ring-2 focus:ring-slate-600"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-200"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors p-0.5
                    ${d ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-700"}`}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-xl font-bold text-sm
                tracking-tight transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1
                ${d
                  ? "bg-slate-100 text-slate-900 hover:bg-white shadow-lg shadow-black/30"
                  : "bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200"}`}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={17} />
              ) : (
                <>Entrar al sistema <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className={`mt-8 sm:mt-10 text-center text-xs font-medium ${d ? "text-slate-500" : "text-slate-500"}`}>
            ¿No tienes una cuenta?{" "}
            <Link
              to="/register"
              className={`font-bold underline underline-offset-4 decoration-2 transition-colors
                ${d ? "text-slate-200 decoration-slate-600" : "text-slate-900 decoration-slate-300"}`}
            >
              Regístrate gratis
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

        <div className="absolute top-[-80px] right-[-80px] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", filter: "blur(60px)" }} />

        <div className="relative z-10 max-w-[400px] w-full px-10 text-center">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[11px] font-bold tracking-widest uppercase mb-8">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
            Sistema en tiempo real
          </div>

          <h2 className="text-[42px] font-black text-white leading-[1.08] mb-5 tracking-tighter">
            Protege lo que<br />más{" "}
            <span className="text-sky-400">importa.</span>
          </h2>

          <p className="text-slate-500 text-[15px] leading-relaxed font-medium mb-10">
            Gestiona alertas, monitorea dispositivos IoT y mantén a tu familia segura desde una plataforma centralizada.
          </p>

          <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 text-left">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <AlertCircle className="text-red-400" size={18} />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Alerta Activa</p>
                <p className="text-slate-500 text-[11px] font-mono mt-0.5">hace 2 min · Sensor #04</p>
              </div>
            </div>

            <div className="space-y-2.5 mb-5">
              <div className="h-2 w-full bg-white/[0.07] rounded-full" />
              <div className="h-2 w-[65%] bg-white/[0.07] rounded-full" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { num: "12",  label: "Online",  color: "text-emerald-400" },
                { num: "3",   label: "Alertas", color: "text-sky-400"     },
                { num: "99%", label: "Uptime",  color: "text-slate-200"   },
              ].map(({ num, label, color }) => (
                <div key={label} className="bg-white/[0.04] border border-white/[0.07] rounded-xl py-3 text-center">
                  <div className={`text-lg font-black tracking-tighter ${color}`}>{num}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;