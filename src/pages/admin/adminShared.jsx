import { useAuth } from "../../app/auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

export function useAdminFetch() {
  const { token } = useAuth();

  async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "SERVER_ERROR");
    return data;
  }

  return { apiFetch, token };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function roleBadgeClass(role) {
  return {
    ADMIN:        "bg-red-50 text-red-700",
    JEFE_FAMILIA: "bg-amber-50 text-amber-700",
    MIEMBRO:      "bg-blue-50 text-blue-700",
  }[role] ?? "bg-slate-100 text-slate-500";
}

export function alertBadgeClass(status) {
  return {
    ACTIVE:   "bg-red-50 text-red-700",
    RECEIVED: "bg-red-50 text-red-700",
    ATTENDED: "bg-emerald-50 text-emerald-700",
    CLOSED:   "bg-slate-100 text-slate-500",
  }[status] ?? "bg-slate-100 text-slate-500";
}

export function formatDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── UI Atoms ─────────────────────────────────────────────────────────────────

export function Avatar({ name = "?" }) {
  return (
    <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 inline-flex items-center justify-center text-[10px] font-medium flex-shrink-0">
      {initials(name)}
    </span>
  );
}

export function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${className}`}>
      {children}
    </span>
  );
}

export function SectionCard({ title, count, children, action }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-4">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <span className="text-sm font-medium">{title}</span>
        <div className="flex items-center gap-2">
          {action}
          {count !== undefined && (
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="px-5 py-3 border-b border-slate-100">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-slate-400"
      />
    </div>
  );
}

export function TableHead({ cols }) {
  return (
    <thead>
      <tr>
        {cols.map((col) => (
          <th key={col} className="text-left text-[11px] text-slate-400 font-medium px-5 py-2.5 bg-slate-50 border-b border-slate-100">
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function ActionBtn({ children, variant = "default", onClick, disabled }) {
  const styles = {
    default: "border-slate-200 text-slate-500 hover:bg-slate-50",
    danger:  "border-red-200 text-red-600 hover:bg-red-50",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-[11px] border rounded px-2.5 py-1 mr-1 transition-colors cursor-pointer disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl border border-slate-200 w-[calc(100%-2rem)] max-w-sm overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <span className="text-sm font-medium">{title}</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100">{footer}</div>}
      </div>
    </div>
  );
}

export function ModalField({ label, children }) {
  return (
    <div className="mb-3.5">
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

export function InputField({ ...props }) {
  return <input className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-slate-400" {...props} />;
}

export function SelectField({ children, ...props }) {
  return (
    <select className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-slate-400" {...props}>
      {children}
    </select>
  );
}

export function BtnPrimary({ children, onClick, variant = "danger", disabled }) {
  const styles = {
    danger:  "bg-red-500 hover:bg-red-600 text-white",
    default: "bg-slate-800 hover:bg-slate-900 text-white",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`text-sm px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${styles[variant]}`}>
      {children}
    </button>
  );
}

export function BtnSecondary({ children, onClick }) {
  return (
    <button onClick={onClick} className="text-sm px-4 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
      {children}
    </button>
  );
}

export function LoadingRows({ cols }) {
  return (
    <tr>
      <td colSpan={cols} className="px-5 py-10 text-center text-slate-400 text-sm">
        <div className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
          Cargando...
        </div>
      </td>
    </tr>
  );
}

export function ErrorRow({ cols, message }) {
  return (
    <tr>
      <td colSpan={cols} className="px-5 py-10 text-center text-red-500 text-sm">{message}</td>
    </tr>
  );
}
