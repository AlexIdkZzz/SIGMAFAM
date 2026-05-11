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
          "fixed inset-0 bg-black/30 transition",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      />
      {/* panel */}
      <div
        className={[
          "fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="h-14 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{title}</div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors"
          >
            Cerrar
          </button>
        </div>
        <div className="p-5 overflow-auto h-[calc(100%-56px)]">{children}</div>
      </div>
    </>
  );
}