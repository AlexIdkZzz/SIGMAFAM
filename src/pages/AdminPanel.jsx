import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/auth/AuthContext";
import AdminOverview from "./admin/AdminOverview";
import AdminUsers from "./admin/AdminUsers";
import AdminGroups from "./admin/AdminGroups";
import AdminDevices from "./admin/AdminDevices";
import AdminAlerts from "./admin/AdminAlerts";

const NAV_ITEMS = [
  { id: "overview", label: "Resumen global",   icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg> },
  { id: "users",    label: "Usuarios",          icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><circle cx="8" cy="5" r="3"/><path d="M2 13c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg> },
  { id: "groups",   label: "Grupos familiares", icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><circle cx="5" cy="6" r="2.5"/><circle cx="11" cy="6" r="2.5"/><path d="M1 13c0-2.2 1.8-4 4-4s4 1.8 4 4" opacity=".6"/><path d="M7 13c0-2.2 1.8-4 4-4s4 1.8 4 4" opacity=".6"/></svg> },
  { id: "devices",  label: "Dispositivos",      icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><rect x="2" y="4" width="12" height="9" rx="1.5"/><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1"/><circle cx="8" cy="8.5" r="1.5"/></svg> },
  { id: "alerts",   label: "Todas las alertas", icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M8 1L1 13h14L8 1z"/><path d="M8 6v4M8 11.5v.5" stroke="white" strokeWidth="1.2" fill="none"/></svg> },
];

export default function AdminPanel() {
  const [view, setView] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.theme === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.theme = "light";
      setIsDark(false);
    } else {
      html.classList.add("dark");
      localStorage.theme = "dark";
      setIsDark(true);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0a0f1e]">

      {/* Topbar */}
      <header className="h-[56px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between transition-colors relative z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
          <div className="font-extrabold tracking-wide text-slate-900 dark:text-white">SIGMAFAM</div>
          <span className="hidden sm:inline text-xs bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">Admin</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition text-lg"
            title="Cambiar tema"
          >
            {isDark ? "☀️" : "🌙"}
          </button>
          <button
            onClick={() => navigate("/app/dashboard")}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition hidden sm:inline"
          >
            ← App
          </button>
          {user && (
            <span className="text-sm text-slate-700 dark:text-slate-300 hidden sm:inline">
              {user.fullName} · <b className="text-slate-900 dark:text-white">{user.role}</b>
            </span>
          )}
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">

        {/* Overlay móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed z-40 top-[56px] left-0 h-[calc(100vh-56px)] w-64 transition-transform duration-300 ease-in-out
            md:static md:translate-x-0 md:h-auto md:z-auto
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <aside className="h-full bg-slate-900 text-white border-r border-slate-800 p-3 overflow-auto flex flex-col">
            <div className="px-3 py-2 text-xs text-slate-300">Panel de administración</div>

            <div className="flex flex-col gap-1 flex-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition text-left w-full ${
                    view === item.id
                      ? "bg-blue-500/20 text-white font-semibold"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}

              <button
                onClick={() => { setSidebarOpen(false); navigate("/app/dashboard"); }}
                className="mt-2 px-3 py-2.5 rounded-xl text-sm transition text-left bg-red-500/20 text-red-300 hover:bg-red-500/30 font-semibold"
              >
                ← Volver a la app
              </button>
            </div>

            <div className="mt-4 px-3 py-2 text-xs text-slate-500 leading-relaxed border-t border-slate-800">
              <button
                onClick={logout}
                className="w-full text-xs text-slate-500 hover:text-red-400 hover:bg-red-900/20 px-3 py-2 rounded-lg transition mb-2 text-left"
              >
                ← Cerrar sesión
              </button>
              <div>Trabajo académico CETI Tonalá 2025</div>
              <div>Yael De Alba 21300160</div>
              <div>Francisco Yañez 22300208</div>
              <div>Uziel Noriega 22300232</div>
              <div>Cristian Oñate 22300198</div>
            </div>
          </aside>
        </div>

        {/* Contenido principal */}
        <main className="flex-1 bg-slate-50 dark:bg-[#0a0f1e] p-4 md:p-5 overflow-auto w-full transition-colors">
          {view === "overview" && <AdminOverview />}
          {view === "users"    && <AdminUsers />}
          {view === "groups"   && <AdminGroups />}
          {view === "devices"  && <AdminDevices />}
          {view === "alerts"   && <AdminAlerts />}
        </main>
      </div>
    </div>
  );
}
