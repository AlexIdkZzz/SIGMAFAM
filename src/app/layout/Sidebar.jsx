import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const nav = [
  { to: "/app/dashboard", label: "Dashboard",    roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/alerts",    label: "Alertas",       roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/map",       label: "Mapa en vivo",  roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/history",   label: "Historial",     roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/store",     label: "Tienda", roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/stats",     label: "Estadísticas",  roles: ["ADMIN","JEFE_FAMILIA"] },
  { to: "/app/family",    label: "Familia",       roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/contacts",  label: "Contactos",     roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/device",    label: "Dispositivo",   roles: ["ADMIN","JEFE_FAMILIA","MIEMBRO"] },
  { to: "/app/audit",     label: "Auditoría",     roles: ["ADMIN"] },
];

export default function Sidebar({ onNavigate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;

  return (
    <aside className="h-full bg-slate-900 text-white border-r border-slate-800 p-3 overflow-auto flex flex-col">
      <div className="px-3 py-2 text-xs text-slate-300">Navegación</div>

      <div className="flex flex-col gap-1 flex-1">
        {nav
          .filter((i) => !role || i.roles.includes(role))
          .map((i) => (
            <NavLink key={i.to} to={i.to} onClick={onNavigate}
              className={({ isActive }) =>
                ["px-3 py-2.5 rounded-xl text-sm transition",
                  isActive ? "bg-blue-500/20 text-white font-semibold" : "text-slate-300 hover:bg-white/5 hover:text-white",
                ].join(" ")
              }
            >
              {i.label}
            </NavLink>
          ))}

        {/* Botón Panel Admin — solo ADMIN */}
        {role === "ADMIN" && (
          <button
            onClick={() => { onNavigate?.(); navigate("/admin"); }}
            className="mt-2 px-3 py-2.5 rounded-xl text-sm transition text-left bg-red-500/20 text-red-300 hover:bg-red-500/30 font-semibold"
          >
            ⚙ Panel Admin
          </button>
        )}
      </div>

      <div className="mt-4 px-3 py-2 text-xs text-slate-500 leading-relaxed">
        <div>Trabajo académico CETI Tonalá 2025</div>
        <div>Yael De Alba 21300160</div>
        <div>Axel Moreno 22300235</div>
        <div>Uziel Noriega 22300232</div>
      </div>
    </aside>
  );
}
