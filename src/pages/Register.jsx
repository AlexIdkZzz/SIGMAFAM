import React from "react";
import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="font-extrabold text-slate-900 text-xl">Crear cuenta</div>
        <p className="text-sm text-slate-600 mt-1">
          (Placeholder) Aquí irá register real conectado al backend.
        </p>

        <div className="mt-4 grid gap-2">
          <input className="px-3 py-2 rounded-xl border border-slate-200" placeholder="Nombre completo" />
          <input className="px-3 py-2 rounded-xl border border-slate-200" placeholder="Correo" />
          <input className="px-3 py-2 rounded-xl border border-slate-200" placeholder="Contraseña" type="password" />
          <button className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">
            Registrar
          </button>
        </div>

        <div className="mt-3 text-sm text-slate-600">
          ¿Ya tienes cuenta? <Link className="text-blue-700 font-semibold" to="/login">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}