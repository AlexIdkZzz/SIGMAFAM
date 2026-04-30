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
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#0d1426] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-5">
          <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{title}</div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{desc}</p>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rou