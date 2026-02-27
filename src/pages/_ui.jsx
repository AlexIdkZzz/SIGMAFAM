import React from "react";

export function PageShell({ title, subtitle, children, right }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
          {subtitle ? <p className="text-sm text-slate-600 mt-1">{subtitle}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function Card({ title, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      {title ? <div className="text-xs text-slate-500 mb-2">{title}</div> : null}
      {children}
    </div>
  );
}

export function Pill({ children, variant = "slate" }) {
  const styles = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    red: "bg-red-50 text-red-700 border-red-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  }[variant];

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${styles}`}>
      {children}
    </span>
  );
}

export function Button({ children, variant = "primary", ...props }) {
  const cls = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    outline: "border border-slate-200 hover:bg-slate-50 text-slate-900",
  }[variant];

  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${cls}`}
    >
      {children}
    </button>
  );
}