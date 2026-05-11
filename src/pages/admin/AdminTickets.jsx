import { useState, useEffect, useCallback } from "react";
import { useAdminFetch, formatDate } from "./adminShared";

const TYPE_LABELS = {
  REMOVE_FROM_GROUP: "Salir del grupo familiar",
  DELETE_DATA:       "Eliminar mis datos",
  CHANGE_NAME:       "Cambiar nombre",
  CHANGE_PASSWORD:   "Cambio de contraseña",
  BUG_REPORT:        "Reporte de error",
  OTHER:             "Otro",
};

function statusBadge(status) {
  return {
    OPEN:        "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    IN_PROGRESS: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    CLOSED:      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  }[status] ?? "bg-slate-100 text-slate-500";
}

function statusLabel(status) {
  return { OPEN: "Abierto", IN_PROGRESS: "En revisión", CLOSED: "Resuelto" }[status] ?? status;
}

export default function AdminTickets() {
  const { apiFetch } = useAdminFetch();
  const [tickets, setTickets]   = useState([]);
  const [filter, setFilter]     = useState("ALL");
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(null);
  const [note, setNote]         = useState("");
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter !== "ALL" ? `?status=${filter}` : "";
      const data = await apiFetch(`/admin/tickets${q}`);
      setTickets(data.tickets);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function update(id, status, admin_note) {
    setSaving(true);
    try {
      await apiFetch(`/admin/tickets/${id}`, { method: "PATCH", body: { status, admin_note } });
      setSelected(null);
      setNote("");
      await load();
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  }

  const FILTERS = ["ALL", "OPEN", "IN_PROGRESS", "CLOSED"];
  const filterLabel = { ALL: "Todos", OPEN: "Abiertos", IN_PROGRESS: "En revisión", CLOSED: "Resueltos" };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tickets de soporte</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Solicitudes enviadas por los usuarios</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === f
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-400"
            }`}
          >
            {filterLabel[f]}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1628] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-r-transparent" />
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-center py-16 text-sm text-slate-400 dark:text-slate-600">Sin tickets{filter !== "ALL" ? " con ese filtro" : ""}</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-left">
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">#</th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Usuario</th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha</th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-500">#{t.id}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{t.user_name}</p>
                    <p className="text-xs text-slate-400">{t.user_email}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{TYPE_LABELS[t.type] ?? t.type}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusBadge(t.status)}`}>
                      {statusLabel(t.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{formatDate(t.created_at)}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => { setSelected(t); setNote(t.admin_note ?? ""); }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de gestión */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Ticket #{selected.id}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selected.user_name} · {selected.user_email}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusBadge(selected.status)}`}>
                {statusLabel(selected.status)}
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-3">
              <p className="text-xs font-semibold text-slate-500 mb-1">{TYPE_LABELS[selected.type]}</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{selected.description || <em className="text-slate-400">Sin descripción</em>}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Nota interna (visible solo para ti)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Agrega una nota o respuesta..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <button onClick={() => update(selected.id, "IN_PROGRESS", note)} disabled={saving}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors disabled:opacity-50">
                En revisión
              </button>
              <button onClick={() => update(selected.id, "CLOSED", note)} disabled={saving}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50">
                Resolver
              </button>
              <button onClick={() => { setSelected(null); setNote(""); }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
