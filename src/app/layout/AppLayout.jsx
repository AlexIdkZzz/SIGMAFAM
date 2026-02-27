import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  return (
    <div className="h-screen grid grid-rows-[56px_1fr]">
      <Topbar />
      <div className="grid grid-cols-[260px_1fr] overflow-hidden">
        <Sidebar />
        <main className="bg-slate-50 p-5 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}