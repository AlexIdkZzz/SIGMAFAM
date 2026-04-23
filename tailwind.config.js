/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    // Botones
    "bg-blue-600", "hover:bg-blue-700",
    "bg-red-600",  "hover:bg-red-700",
    "bg-slate-900","hover:bg-slate-700",
    "border", "border-slate-200", "hover:bg-slate-50",
    "text-white", "text-slate-900",
    // Pills
    "bg-red-50",     "text-red-700",     "border-red-200",
    "bg-emerald-50", "text-emerald-700", "border-emerald-200",
    "bg-amber-50",   "text-amber-700",   "border-amber-200",
    "bg-blue-50",    "text-blue-700",    "border-blue-200",
    "bg-slate-100",  "text-slate-700",   "border-slate-200",
  ],
  theme: { extend: {} },
  plugins: [],
};