import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../app/auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

const STATUS_LABEL = {
  RECEIVED: { label: "Recibida",   color: "bg-blue-100 text-blue-700"   },
  ACTIVE:   { label: "Activa",     color: "bg-red-100 text-red-700"     },
  ATTENDED: { label: "Atendida",   color: "bg-yellow-100 text-yellow-700" },
  CLOSED:   { label: "Cerrada",    color: "bg-slate-100 text-slate-500" },
};

const SOURCE_LABEL = {
  IOT: { label: "Dispositivo", icon: "📡" },
  WEB: { label: "Web",         icon: "🌐" },
};

export default function History() {
  const { token } = useAuth();

  const [alerts, setAlerts]         = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  // Filtros
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [page, setPage]                 = useState(1);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filterStatus) params.set("status", filterStatus);
      if (filterSource) params.set("source", filterSource);

      const res = await fetch(`${API_BASE}/alerts/history?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cargar historial");

      setAlerts(data.alerts);
      setPagination(data.pagination);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, page, filterStatus, filterSource]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Al cambiar filtros, volver a página 1
  function applyFilter(newStatus, newSource) {
    setFilterStatus(newStatus);
    setFilterSource(newSource);
    setPage(1);
  }

  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("es-MX", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Historial de Alertas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {pagination.total} alerta{pagination.total !== 1 ? "s" : ""} en total
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
        >
          <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Estado</label>
          <select
            value={filterStatus}
            onChange={(e) => applyFilter(e.target.value, filterSource)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Todos</option>
            <option value="RECEIVED">Recibida</option>
            <option value="ACTIVE">Activa</option>
            <option value="ATTENDED">Atendida</option>
            <option value="CLOSED">Cerrada</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Origen</label>
          <select
            value={filterSource}
            onChange={(e) => applyFilter(filterStatus, e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Todos</option>
            <option value="WEB">Web</option>
            <option value="IOT">Dispositivo</option>
          </select>
        </div>
        {(filterStatus || filterSource) && (
          <div className="flex items-end">
            <button
              onClick={() => applyFilter("", "")}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition"
            >
              Limpiar filtros ✕
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading && alerts.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
            Cargando historial...
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
            </svg>
            <span className="text-sm">Sin alertas con esos filtros</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Origen</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Creada</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cerrada</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ubicación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.map((a) => {
                const st  = STATUS_LABEL[a.status]  ?? { label: a.status,  color: "bg-slate-100 text-slate-500" };
                const src = SOURCE_LABEL[a.source] ?? { label: a.source, icon: "?" };
                return (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400 text-xs">#{a.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{a.user}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span>{src.icon}</span>
                        {src.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(a.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(a.closedAt)}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                      {a.lastLocation
                        ? `${a.lastLocation.lat.toFixed(4)}, ${a.lastLocation.lng.toFixed(4)}`
                        : "Sin ubicación"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-slate-500">
            Página {pagination.page} de {pagination.pages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages || loading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}