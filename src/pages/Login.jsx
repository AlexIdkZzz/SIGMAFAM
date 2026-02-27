import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../app/auth/AuthContext";

export default function Login() {
  const { loginMock } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState("ADMIN");

  function onSubmit(e) {
    e.preventDefault();
    loginMock(role);
    nav("/app/dashboard");
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="font-extrabold text-slate-900 text-xl">SIGMAFAM</div>
        <p className="text-sm text-slate-600 mt-1">Demo: elige rol para probar permisos.</p>

        <label className="block mt-4 text-xs text-slate-500">Rol</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200"
        >
          <option value="ADMIN">ADMIN</option>
          <option value="JEFE_FAMILIA">JEFE_FAMILIA</option>
          <option value="MIEMBRO">MIEMBRO</option>
        </select>

        <button className="w-full mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800">
          Entrar
        </button>

        <div className="mt-3 text-sm text-slate-600">
          ¿No tienes cuenta? <Link className="text-blue-700 font-semibold" to="/register">Regístrate</Link>
        </div>
      </form>
    </div>
  );
}