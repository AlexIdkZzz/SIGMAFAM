import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Inyectar el modo oscuro a nivel de la etiqueta <html> al cargar la app
  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0a0f1e]">
      
      {/* Topbar siempre arriba y con z-index alto */}
      <div className="relative z-50">
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        
        {/* Overlay móvil (soluciona problemas de clics sueltos) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar (Ajusté los z-index y la posición) */}
        <div
          className={`
            fixed z-40 top-[56px] left-0 h-[calc(100vh-56px)] w-64 transition-transform duration-300 ease-in-out
            md:static md:translate-x-0 md:h-auto md:z-auto
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </div>

        {/* Contenido principal: ¡AQUÍ MATAMOS EL RECUADRO BLANCO! */}
        <main className="flex-1 bg-slate-50 dark:bg-[#0a0f1e] p-4 md:p-5 overflow-auto w-full transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  );
}