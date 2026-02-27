import React, { useEffect } from "react";

export default function ConfirmModal({ open, title, desc, confirmText="Confirmar", onConfirm, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={open ? "fixed inset-0 z-50" : "hidden"}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-5">
          <div className="text-lg font-extrabold text-slate-900">{title}</div>
          <p className="text-sm text-slate-600 mt-1">{desc}</p>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}