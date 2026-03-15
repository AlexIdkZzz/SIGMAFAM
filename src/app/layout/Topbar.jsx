import React from "react";
import { useAuth } from "../auth/AuthContext";

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Botón hamburguesa — solo visible en móvil */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition"
          aria-label="Abrir menú"
        >
          <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>

        <div className="font-extrabold tracking-wide text-slate-900">SIGMAFAM</div>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-slate-700 hidden sm:inline">
              {user.fullName} · <b className="text-slate-900">{user.role}</b>
            </span>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm transition"
            >
              Logout
            </button>
          </>
        ) : (
          <span className="text-sm text-slate-500">No autenticado</span>
        )}
      </div>
    </header>
  );
}