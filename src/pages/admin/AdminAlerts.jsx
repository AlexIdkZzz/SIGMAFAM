import { useEffect, useState, useCallback } from "react";
import {
  useAdminFetch, Avatar, Badge, SectionCard, SearchBar, TableHead,
  LoadingRows, ErrorRow, alertBadgeClass, formatDate,
} from "./adminShared";

const STATUS_OPTIONS = ["Todos", "ACTIVE", "RECEIVED", "ATTENDED", "CLOSED"];

export default function AdminAlerts() {
  const { apiFetch } = useAdminFetch();
  const [alerts, setAlerts]       = useState([]);
  const [pagination, setPag]      = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilter] = useState("Todos");
  const [page, setPage]           = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 30 });
    if (filterStatus !== "Todos") params.append("status", filterStatus);

    apiFetch(`/admin/alerts?${params}`)
      .then((d) => { setAlerts(d.alerts); setPag(d.pagination); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const filtered = alerts.filter(
    (a) => !search ||
      a.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.group_name?.toLowerCase().includes(search.toLowerCase()) ||
      String(a.id).includes(search)
  );

  return (
    <SectionCard title="Alertas del sistema" count={pagination.total}>
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar por usuario, grupo o ID..." />

      <div className="flex flex-wrap gap-1 px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(1); }}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              filterStatus === s
                ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px] text-[13px]">
          <TableHead cols={["ID", "Usuario", "Grupo", "Origen", "Coordenadas", "Estado", "Fecha"]} />
          <tbody>
            {loading ? <LoadingRows cols={7} /> :
             error   ? <ErrorRow cols={7} message={error} /> :
             filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400 dark:text-slate-500 text-sm">Sin resultados</td>
              </tr>
            ) : filtered.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 last:border-0">
                <td className="px-5 py-2.5 font-mono text-xs text-slate-400 dark:text-slate-500">#{a.id}</td>
                <td className="px-5 py-2.5 text-slate-900 dark:text-slate-100">
                  <span className="flex items-center gap-2">
                    <Avatar name={a.user_name} />
                    <span>
                      <div>{a.user_name}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">{a.user_email}</div>
                    </span>
                  </span>
                </td>
                <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{a.group_name ?? "Sin grupo"}</td>
                <td className="px-5 py-2.5 text-xs text-slate-700 dark:text-slate-300">{a.source}</td>
                <td className="px-5 py-2.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                  {a.lat != null ? `${Number(a.lat).toFixed(4)}, ${Number(a.lng).toFixed(4)}` : "—"}
                </td>
                <td className="px-5 py-2.5">
                  <Badge className={alertBadgeClass(a.status)}>{a.status}</Badge>
                </td>
                <td className="px-5 py-2.5 text-xs text-slate-400 dark:text-slate-500">{formatDate(a.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-400 dark:text-slate-500">Página {pagination.page} de {pagination.pages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-xs px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              ← Anterior
            </button>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
