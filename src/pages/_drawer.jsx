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
          "fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white border-l border-slate-200 shadow-xl transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between">
          <div className="font-extrabold text-slate-900">{title}</div>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm"
          >
            Cerrar
          </button>
        </div>
        <div className="p-4 overflow-auto h-[calc(100%-56px)]">{children}</div>
      </div>
    </>
  );
}