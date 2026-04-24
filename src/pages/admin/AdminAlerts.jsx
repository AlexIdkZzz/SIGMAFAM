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

      <div className="flex flex-wrap gap-1 px-5 py-2 border-b border-slate-100 bg-slate-50">
        {STATUS_OPTIONS.map((s) => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            // CORRECCIÓN 2: Llaves y backticks agregados
            className={`text-xs px-3 py-1 rounded-full transition-colors ${filterStatus === s ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-200"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
      <table className="w-full min-w-[750px] text-[13px]">
        <TableHead cols={["ID", "Usuario", "Grupo", "Origen", "Coordenadas", "Estado", "Fecha"]} />
        <tbody>
          {/* ... (mapeo de alertas) */}
            <tr key={a.id}>
              {/* ... (celdas anteriores) */}
              <td className="px-5 py-2.5 font-mono text-[11px] text-slate-400">
                {/* CORRECCIÓN 3: Backticks agregados para mostrar las coordenadas */}
                {a.lat != null ? `${Number(a.lat).toFixed(4)}, ${Number(a.lng).toFixed(4)}` : "—"}
              </td>
              {/* ... (resto de celdas) */}
            </tr>
          {/* ... */}
        </tbody>
      </table>
      </div>
    </SectionCard>
  );
}