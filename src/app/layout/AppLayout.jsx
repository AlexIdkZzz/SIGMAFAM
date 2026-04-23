import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen grid grid-rows-[56px_1fr]">
      <Topbar onMenuClick={() => setSidebarOpen((o) => !o)} />

      <div className="relative flex overflow-hidden">

        {/* Overlay móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed z-30 top-14 left-0 h-[calc(100vh-56px)] w-64 transition-transform duration-300
            md:static md:translate-x-0 md:h-auto md:z-auto
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </div>

        {/* Contenido principal */}
        <main className="flex-1 bg-slate-50 p-4 md:p-5 overflow-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}