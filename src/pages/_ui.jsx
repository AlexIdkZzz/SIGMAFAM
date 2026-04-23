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
    red:    { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" },
    green:  { background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" },
    yellow: { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" },
    blue:   { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" },
    slate:  { background: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0" },
  }[variant] ?? { background: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0" };

  return (
    <span style={styles} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs">
      {children}
    </span>
  );
}

export function Button({ children, variant = "primary", ...props }) {
  const [hovered, setHovered] = React.useState(false);

  const base = {
    primary: { background: "#2563eb", color: "#ffffff" },
    danger:  { background: "#dc2626", color: "#ffffff" },
    outline: { background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0" },
  }[variant] ?? { background: "#2563eb", color: "#ffffff" };

  const hover = {
    primary: { background: "#1d4ed8" },
    danger:  { background: "#b91c1c" },
    outline: { background: "#f8fafc" },
  }[variant] ?? { background: "#1d4ed8" };

  return (
    <button
      {...props}
      style={{ ...base, ...(hovered ? hover : {}) }}
      className="px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}