import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../app/auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

export default function Verify() {
  const { login: setSession } = useAuth();
  const nav      = useNavigate();
  const location = useLocation();

  // El email viene desde Register.jsx via state
  const email = location.state?.email ?? "";

  const [code, setCode]       = useState(["", "", "", "", "", ""]);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent]   = useState(false);
  const inputs = useRef([]);

  function handleChange(i, val) {
    if (!/^\d?$/.test(val)) return; // solo números
    const next = [...code];
    next[i] = val;
    setCode(next);
    // Auto-avanzar al siguiente input
    if (val && i < 5) inputs.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setCode(text.split(""));
      inputs.current[5]?.focus();
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setError("Ingresa el código completo de 6 dígitos.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msgs = {
          INVALID_CODE:    "Código incorrecto. Verifica e intenta de nuevo.",
          CODE_EXPIRED:    "El código expiró. Solicita uno nuevo.",
          ALREADY_VERIFIED:"Esta cuenta ya fue verificada. Inicia sesión.",
          USER_NOT_FOUND:  "No encontramos este correo.",
        };
        throw new Error(msgs[data.error] ?? "Error al verificar.");
      }

      // Auto-login: guardar token y usuario
      localStorage.setItem("sigmafam_token", data.access_token);
      window.location.href = "/app/dashboard";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setResent(false);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResent(true);
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch (err) {
      setError("No se pudo reenviar el código.");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </span>
            <span className="font-extrabold text-slate-900 text-xl tracking-tight">SIGMAFAM</span>
          </span>
          <p className="text-sm text-slate-500 mt-2">Verifica tu correo electrónico</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <p className="text-sm text-slate-600">
              Enviamos un código a<br />
              <span className="font-semibold text-slate-900">{email}</span>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2 mb-4">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              {error}
            </div>
          )}

          {/* Resent banner */}
          {resent && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-3 py-2 mb-4 text-center">
              ✅ Nuevo código enviado a tu correo
            </div>
          )}

          {/* Inputs de código */}
          <form onSubmit={onSubmit}>
            <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-11 h-14 text-center text-xl font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || code.join("").length < 6}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#0f172a", color: "#ffffff" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Verificando...
                </span>
              ) : "Verificar cuenta"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            ¿No recibiste el correo?{" "}
            <button
              onClick={resendCode}
              className="text-slate-900 font-semibold hover:underline"
            >
              Reenviar código
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
