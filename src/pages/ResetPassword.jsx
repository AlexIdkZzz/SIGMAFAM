import React, { useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

export default function ResetPassword() {
  const nav      = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email ?? "";

  const [code, setCode]         = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const inputs = useRef([]);

  function handleChange(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
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

  const mismatch   = password && confirm && password !== confirm;
  const fullCode   = code.join("");
  const canSubmit  = fullCode.length === 6 && password.length >= 6 && !mismatch;

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailFromState, code: fullCode, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs = {
          INVALID_CODE:    "Código incorrecto. Verifica e intenta de nuevo.",
          CODE_EXPIRED:    "El código expiró. Solicita uno nuevo.",
          USER_NOT_FOUND:  "No encontramos este correo.",
          PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 6 caracteres.",
        };
        throw new Error(msgs[data.error] ?? "No se pudo restablecer la contraseña.");
      }
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          <p className="text-sm text-slate-500 mt-2">Nueva contraseña</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

          {done ? (
            /* ── Éxito ── */
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h2 className="font-extrabold text-slate-900 mb-2">¡Contraseña actualizada!</h2>
              <p className="text-sm text-slate-500 mb-6">
                Tu contraseña fue restablecida correctamente. Ya puedes iniciar sesión.
              </p>
              <button
                onClick={() => nav("/login")}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
              >
                Ir a iniciar sesión
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-5">
                <p className="text-sm text-slate-600">
                  Ingresa el código que enviamos a<br />
                  <span className="font-semibold text-slate-800">{emailFromState || "tu correo"}</span>
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2 mb-4">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-5">
                {/* Código */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2 text-center">
                    Código de 6 dígitos
                  </label>
                  <div className="flex gap-2 justify-center" onPaste={handlePaste}>
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
                </div>

                {/* Nueva contraseña */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nueva contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                  />
                </div>

                {/* Confirmar */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Confirmar contraseña</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
                      mismatch ? "border-red-300 focus:ring-red-400" : "border-slate-200 focus:ring-slate-900"
                    }`}
                  />
                  {mismatch && (
                    <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                      Guardando...
                    </span>
                  ) : "Restablecer contraseña"}
                </button>
              </form>

              <p className="text-sm text-slate-500 text-center mt-4">
                <Link to="/forgot-password" className="text-slate-900 font-semibold hover:underline">
                  ← Solicitar nuevo código
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
