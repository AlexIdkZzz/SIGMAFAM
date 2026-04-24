import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { 
  LayoutDashboard, AlertTriangle, Map, Clock, 
  ShoppingCart, BarChart2, Users, BookOpen, 
  Cpu, ClipboardList, Settings
} from "lucide-react";

const nav = [
  { to: "/app/dashboard", label: "Dashboard",   icon: LayoutDashboard, roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/alerts",    label: "Alertas",      icon: AlertTriangle,   roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/map",       label: "Mapa en vivo", icon: Map,             roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/history",   label: "Historial",    icon: Clock,           roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/stats",     label: "Estadísticas", icon: BarChart2,       roles: ["ADMIN","JEFE_FAMILIA"] },
  { to: "/app/family",    label: "Familia",      icon: Users,           roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/contacts",  label: "Contactos",    icon: BookOpen,        roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/device",    label: "Dispositivo",  icon: Cpu,             roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/audit",     label: "Auditoría",    icon: ClipboardList,   roles: ["ADMIN"] },
];

export default function Sidebar({ closeMenu }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;

  return (
    <aside className="h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-3 overflow-auto flex flex-col transition-colors duration-300">
      <div className="px-3 py-4 text-xs font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Navegación</div>

      <div className="flex flex-col gap-1.5 flex-1">
        {nav
          .filter((i) => !role || i.roles.includes(role))
          .map((i) => (
            <NavLink key={i.to} to={i.to} onClick={closeMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-slate-900 dark:bg-sky-500/15 text-white dark:text-sky-400 font-bold shadow-md dark:shadow-none" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                }`
              }
            >
              <i.icon size={18} />
              {i.label}
            </NavLink>
          ))}

        {role === "ADMIN" && (
          <button
            onClick={() => { closeMenu?.(); navigate("/admin"); }}
            className="flex items-center gap-3 mt-4 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/25 border border-red-100 dark:border-red-500/20"
          >
            <Settings size={18} />
            Panel Admin
          </button>
        )}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
        <div className="text-slate-700 dark:text-slate-300 font-bold mb-1">CETI Tonalá 2025</div>
        <div>Yael De Alba 21300160</div>
        <div>Francisco Yañez 22300208</div>
        <div>Uziel Noriega 22300232</div>
        <div>Cristian Onate 22300198</div>
      </div>
    </aside>
  );
}