import { useState } from "react";
import { useAuth } from "../app/auth/AuthContext";
import AdminOverview from "./admin/AdminOverview";
import AdminUsers from "./admin/AdminUsers";
import AdminGroups from "./admin/AdminGroups";
import AdminDevices from "./admin/AdminDevices";
import AdminAlerts from "./admin/AdminAlerts";

const NAV_ITEMS = [
  { id: "overview", label: "Resumen global", icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg> },
  { id: "users", label: "Usuarios", icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><circle cx="8" cy="5" r="3"/><path d="M2 13c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg> },
  { id: "groups", label: "Grupos familiares", icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><circle cx="5" cy="6" r="2.5"/><circle cx="11" cy="6" r="2.5"/><path d="M1 13c0-2.2 1.8-4 4-4s4 1.8 4 4" opacity=".6"/><path d="M7 13c0-2.2 1.8-4 4-4s4 1.8 4 4" opacity=".6"/></svg> },
  { id: "devices", label: "Dispositivos", icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><rect x="2" y="4" width="12" height="9" rx="1.5"/><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1"/><circle cx="8" cy="8.5" r="1.5"/></svg> },
  { id: "alerts", label: "Todas las alertas", icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M8 1L1 13h14L8 1z"/><path d="M8 6v4M8 11.5v.5" stroke="white" strokeWidth="1.2" fill="none"/></svg> },
];

const VIEW_META = {
  overview: { title: "Resumen global", sub: "Vista general del sistema SIGMAFAM" },
  users: { title: "Usuarios del sistema", sub: "Gestionar todos los usuarios y roles" },
  groups: { title: "Grupos familiares", sub: "Ver y administrar grupos familiares" },
  devices: { title: "Dispositivos IoT", sub: "Monitoreo de dispositivos conectados" },
  alerts: { title: "Todas las alertas", sub: "Historial global de alertas del sistema" },
};

export default function AdminPanel() {
  const [view, setView] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const meta = VIEW_META[view];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <>
          {/* Fondo */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <aside className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 z-50 border-r border-slate-200 dark:border-slate-800 shadow-xl flex flex-col">

            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-semibold text-sm">SIGMAFAM</span>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition
                  ${
                    view === item.id
                      ? "bg-slate-200 dark:bg-slate-800 font-medium"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={logout}
                className="w-full text-sm text-slate-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 px-3 py-2 rounded-lg"
              >
                ← Cerrar sesión
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur">
          
          {/* Logo + título */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 bg-red-500 rounded-lg flex items-center justify-center shadow hover:scale-105 transition"
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4 fill-white">
                <path d="M8 1L2 4v4c0 3.5 2.5 6.5 6 7 3.5-.5 6-3.5 6-7V4L8 1z"/>
              </svg>
            </button>

            <div>
              <h1 className="text-lg font-semibold">{meta.title}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {meta.sub}
              </p>
            </div>
          </div>

          {/* Usuario */}
          <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
            {user?.email}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {view === "overview" && <AdminOverview />}
            {view === "users" && <AdminUsers />}
            {view === "groups" && <AdminGroups />}
            {view === "devices" && <AdminDevices />}
            {view === "alerts" && <AdminAlerts />}
          </div>
        </main>
      </div>
    </div>
  );
}