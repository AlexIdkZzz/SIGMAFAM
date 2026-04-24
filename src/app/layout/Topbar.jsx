import React from "react";
import { useAuth } from "../auth/AuthContext";
import { Menu, LogOut, Shield } from "lucide-react";

export default function Topbar({ toggleMobileMenu }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white dark:bg-[#0a0f1e] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex w-8 h-8 bg-slate-900 dark:bg-white rounded-lg items-center justify-center shadow-md">
            <Shield className="text-white dark:text-slate-900 w-4 h-4" />
          </div>
          <span className="font-extrabold tracking-wide text-lg text-slate-900 dark:text-white">SIGMAFAM</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                {user.fullName}
              </span>
              <span className="text-[10px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400 mt-1">
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition-colors bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400"
            >
              <span className="hidden sm:inline">Logout</span>
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">No autenticado</span>
        )}
      </div>
    </header>
  );
}