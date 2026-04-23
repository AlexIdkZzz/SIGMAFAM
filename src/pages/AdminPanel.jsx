import { useState } from "react";
import { useAuth } from "../app/auth/AuthContext";
import AdminOverview from "./admin/AdminOverview";
import AdminUsers from "./admin/AdminUsers";
import AdminGroups from "./admin/AdminGroups";
import AdminDevices from "./admin/AdminDevices";
import AdminAlerts from "./admin/AdminAlerts";

const NAV_ITEMS = [
  { id: "overview", label: "Resumen global",     icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg> },
  { id: "users",    label: "Usuarios",            icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><circle cx="8" cy="5" r="3"/><path d="M2 13c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg> },
  { id: "groups",   label: "Grupos familiares",   icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><circle cx="5" cy="6" r="2.5"/><circle cx="11" cy="6" r="2.5"/><path d="M1 13c0-2.2 1.8-4 4-4s4 1.8 4 4" opacity=".6"/><path d="M7 13c0-2.2 1.8-4 4-4s4 1.8 4 4" opacity=".6"/></svg> },
  { id: "devices",  label: "Dispositivos",        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><rect x="2" y="4" width="12" height="9" rx="1.5"/><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1"/><circle cx="8" cy="8.5" r="1.5"/></svg> },
  { id: "alerts",   label: "Todas las alertas",   icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M8 1L1 13h14L8 1z"/><path d="M8 6v4M8 11.5v.5" stroke="white" strokeWidth="1.2" fill="none"/></svg> },
];

const VIEW_META = {
  overview: { title: "Resumen global",          sub: "Vista general del sistema SIGMAFAM" },
  users:    { title: "Usuarios del sistema",    sub: "Gestionar todos los usuarios y roles" },
  groups:   { title: "Grupos familiares",       sub: "Ver y administrar grupos familiares" },
  devices:  { title: "Dispositivos IoT",        sub: "Monitoreo de dispositivos conectados" },
  alerts:   { title: "Todas las alertas",       sub: "Historial global de alertas del sistema" },
};

export default function AdminPanel() {
  const [view, setView] = useState("overview");
  const { user, logout } = useAuth();
  const meta = VIEW_META[view];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-4 pt-5 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-red-500 rounded-md flex items-center justify-center">
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-white">
                <path d="M8 1L2 4v4c0 3.5 2.5 6.5 6 7 3.5-.5 6-3.5 6-7V4L8 1z"/>
              </svg>
            </div>
            <span className="font-medium text-sm">SIGMAFAM</span>
          </div>
          <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium">PANEL ADMIN</span>
        </div>

        <nav className="flex-1 p-2 flex flex-col gap-0.5">
          <p className="text-[10px] text-slate-400 px-2 pt-3 pb-1 uppercase tracking-widest">Admin</p>
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setView(item.id)}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left w-full
                ${view === item.id ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}>
              <span className={view === item.id ? "opacity-100" : "opacity-60"}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <button onClick={logout}
            className="w-full text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-left">
            ← Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-base font-medium">{meta.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{meta.sub}</p>
          </div>
          <span className="text-xs text-slate-400">{user?.email}</span>
        </header>

        <main className="flex-1 overflow-auto p-6">
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
