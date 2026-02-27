import React from "react";
import { useAuth } from "../auth/AuthContext";

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between">
      <div className="font-extrabold tracking-wide text-slate-900">
        SIGMAFAM
        <span className="ml-2 text-xs font-semibold text-slate-500">SPA</span>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-slate-700">
              {user.fullName} · <b className="text-slate-900">{user.role}</b>
            </span>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm"
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