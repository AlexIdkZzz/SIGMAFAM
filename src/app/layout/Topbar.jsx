import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);

  // Revisar si ya estábamos en modo oscuro al cargar la barra
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  // Función para alternar el tema global
  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  return (
    <header className="h-[56px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        {/* Botón hamburguesa — corregido el área de clic */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
          aria-label="Abrir menú"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>

        <div className="font-extrabold tracking-wide text-slate-900 dark:text-white">SIGMAFAM</div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* INTERRUPTOR MODO OSCURO GLOBAL */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition text-lg"
          title="Cambiar tema"
        >
          {isDark ? "☀️" : "🌙"}
        </button>

        {user ? (
          <>
            <span className="text-sm text-slate-700 dark:text-slate-300 hidden sm:inline">
              {user.fullName} · <b className="text-slate-900 dark:text-white">{user.role}</b>
            </span>
          </>
        ) : (
          <span className="text-sm text-slate-500 dark:text-slate-400">No autenticado</span>
        )}
      </div>
    </header>
  );
}