import React, { useEffect } from "react";

export default function Drawer({ open, title, onClose, children }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* overlay */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/40 dark:bg-black/60 transition",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      />
      {/* panel */}
      <div
        className={[
          "fixed top-0 right-0 z-50 h-full w-full sm:w-[420px]",
          "bg-white dark:bg-[#0d1426] border-l border-slate-200 dark:border-slate-800",
          "shadow-xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="font-extrabold text-slate-900 dark:text-slate-100">{title}</div>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:b