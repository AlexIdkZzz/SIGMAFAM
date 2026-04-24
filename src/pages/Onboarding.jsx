import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/auth/AuthContext";
import { Shield, ArrowRight, Loader2, AlertCircle, Users, Crown } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

export default function Onboarding() {
  const { token, updateSession } = useAuth();
  const navigate = useNavigate();

  const [age, setAge]             = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError]         = useState(null);
  const [loading, setLoading]     = useState(false);

  // Determinar estado según edad ingresada
  const parsedAge = parseInt(age);
  const ageOk     = age !== "" && parsedAge > 0 && parsedAge <= 120;
  const isMinor   = ageOk && parsedAge < 18;
  const isAdult   = ageOk && parsedAge >= 18;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!ageOk) {
      setError("Por favor ingresa una edad válida.");
      return;
    }
    if (isMinor && !inviteCode.trim()) {
      setError("Debes ingresar el código de familia de tu tutor para continuar.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          age: parsedAge,
          invite_code: inviteCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msgs = {
          MISSING_AGE:         "Debes ingresar tu edad.",
          MISSING_INVITE_CODE: "El código de familia es obligatorio para menores.",
          INVALID_CODE:        "Código de familia inválido o inexistente.",
          GROUP_FULL:          "El grupo familiar ya está lleno (máximo 6 miembros).",
        };
        throw new Error(msgs[data.error] ?? "Ocurrió un error, intenta de nuevo.");
      }

      // Guardar nuevo token con rol y age incluidos
      updateSession(data.access_token, {
        id:       data.user.id,
        fullName: data.user.full_name,
        email:    data.user.email,
        role:     data.user.role,
        age:      data.user.age,
      });
      navigate("/app/dashboard", { replace: true });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-5">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Shield className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Completa tu perfil</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">
            Un último paso para configurar tu cuenta en SIGMAFAM.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Campo edad */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                ¿Cuántos años tienes?
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => { setAge(e.target.value); setError(null); }}
                placeholder="Ej: 25"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
              />
            </div>

            {/* Panel informativo según edad — se muestra solo si la edad es válida */}
            {isAdult && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-50 border border-sky-200">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                  <Crown size={16} className="text-sky-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-sky-800">Serás Jefe de Familia</p>
                  <p className="text-xs text-sky-600 mt-0.5 leading-relaxed">
                    Como mayor de edad podrás crear y gestionar tu grupo familiar, agregar miembros y administrar los dispositivos.
                  </p>
                </div>
              </div>
            )}

            {isMinor && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Users size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-800">Necesitas un código de familia</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      Eres menor de edad, por lo que no puedes crear un grupo familiar. Pide a tu tutor o padre de familia el código de invitación de su grupo para unirte.
                    </p>
                  </div>
                </div>

                {/* Campo código */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Código de invitación familiar
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => { setInviteCode(e.target.value); setError(null); }}
                    placeholder="Ej: A1B2C3D4"
                    maxLength={8}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all uppercase tracking-widest"
                  />
                </div>
              </div>
            )}

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading || !ageOk}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 hover:bg-slate-800 text-white shadow-md"
            >
              {loading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <>
                  {isAdult ? "Crear mi familia" : isMinor ? "Unirme a mi familia" : "Continuar"}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}