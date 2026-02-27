import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const nav = [
  { to: "/app/dashboard", label: "Dashboard", roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/alerts", label: "Alertas", roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/map", label: "Mapa en vivo", roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/history", label: "Historial", roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/stats", label: "Estadísticas", roles: ["ADMIN","JEFE_FAMILIA"] },
  { to: "/app/family", label: "Familia", roles: ["ADMIN","JEFE_FAMILIA"] },
  { to: "/app/contacts", label: "Contactos", roles: ["ADMIN","JEFE_FAMILIA"] },
  { to: "/app/device", label: "Dispositivo", roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/audit", label: "Auditoría", roles: ["ADMIN"] },
  { to: "/app/settings", label: "Configuración", roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <aside className="bg-slate-900 text-white border-r border-slate-800 p-3 overflow-auto">
      <div className="px-3 py-2 text-xs text-slate-300">Navegación</div>

      <div className="flex flex-col gap-1">
        {nav
          .filter((i) => !role || i.roles.includes(role))
          .map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              className={({ isActive }) =>
                [
                  "px-3 py-2 rounded-xl text-sm transition",
                  isActive ? "bg-blue-500/20" : "hover:bg-white/5",
                ].join(" ")
              }
            >
              {i.label}
            </NavLink>
          ))}
      </div>

      <div className="mt-6 px-3 py-2 text-xs text-slate-400">
        Tip: cambia rol en Login
      </div>
    </aside>
  );
}