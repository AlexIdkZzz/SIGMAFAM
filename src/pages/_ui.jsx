import React from "react";
import { useTheme } from "../app/theme/ThemeContext";

// ── PageShell ─────────────────────────────────────────────────────
export function PageShell({ title, subtitle, children, right }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      {children}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────
// Acepta className para que cada página pueda sobreescribir bg/border/shadow
export function Card({ title, children, className = "" }) {
  return (
    <div
      className={`bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm ${className}`}
    >
      {title ? (
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
          {title}
        </div>
      ) : null}
      {children}
    </div>
  );
}

// ── Pill ──────────────────────────────────────────────────────────
// Usa clases Tailwind con variantes dark: en lugar de inline styles
export function Pill({ children, variant = "slate" }) {
  const styles = {
    red:    "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20",
    green:  "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20",
    yellow: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20",
    blue:   "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20",
    slate:  "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
  };

  const cls = styles[variant] ?? styles.slate;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

// ── Button ────────────────────────────────────────────────────────
// Si className trae sus propios colores (bg- / text-), se omiten los
// estilos inline del variant para evitar conflictos de especificidad.
export function Button({ children, variant = "primary", className = "", ...props }) {
  const [hovered, setHovered] = React.useState(false);
  const { dark } = useTheme();

  // Detectar selectivamente qué estilos ya vienen en className
  // para no pisar con estilos inline solo lo que ya está cubierto.
  const hasBg     = className.includes("bg-");
  const hasText   = /\btext-[a-z]/.test(className);
  const hasBorder = className.includes("border-");

  const getStyle = () => {
    const s = {};

    if (variant === "primary" || variant === "danger") {
      const [bg, bgH, color] = variant === "primary"
        ? ["#2563eb", "#1d4ed8", "#fff"]
        : ["#dc2626", "#b91c1c", "#fff"];
      if (!hasBg)   s.background = hovered ? bgH : bg;
      if (!hasText) s.color = color;
      return s;
    }

    if (variant === "outline") {
      if (dark) {
        if (!hasBg)     s.background = hovered ? "rgba(255,255,255,0.05)" : "transparent";
        if (!hasText)   s.color  = "#94a3b8";
        if (!hasBorder) s.border = "1px solid #334155";
      } else {
        if (!hasBg)     s.background = hovered ? "#f8fafc" : "#ffffff";
        if (!hasText)   s.color  = "#0f172a";
        if (!hasBorder) s.border = "1px solid #e2e8f0";
      }
      return s;
    }

    if (!hasBg)   s.background = hovered ? "#1d4ed8" : "#2563eb";
    if (!hasText) s.color = "#fff";
    return s;
  };

  return (
    <button
      {...props}
      style={getStyle()}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}
