import { useEffect, useState, useCallback } from "react";
import {
  useAdminFetch, Avatar, Badge, SectionCard, SearchBar, TableHead,
  LoadingRows, ErrorRow, alertBadgeClass, formatDate,
} from "./adminShared";

const STATUS_OPTIONS = ["Todos", "ACTIVE", "RECEIVED", "ATTENDED", "CLOSED"];

/* ─── Helpers de exportación ─── */
function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows) {
  const cols = ["id","status","source","created_at","closed_at","user_name","user_email","group_name","lat","lng"];
  const header = cols.join(",");
  const lines = rows.map((r) =>
    cols.map((c) => {
      const v = r[c] ?? "";
      return typeof v === "string" && v.includes(",") ? `"${v}"` : v;
    }).join(",")
  );
  return [header, ...lines].join("\n");
}

function toXML(rows) {
  const esc = (v) => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const items = rows.map((r) => `
  <alerta>
    <id>${esc(r.id)}</id>
    <estado>${esc(r.status)}</estado>
    <origen>${esc(r.source)}</origen>
    <usuario>${esc(r.user_name)}</usuario>
    <email>${esc(r.user_email)}</email>
    <grupo>${esc(r.group_name)}</grupo>
    <lat>${esc(r.lat)}</lat>
    <lng>${esc(r.lng)}</lng>
    <creada>${esc(r.created_at)}</creada>
    <cerrada>${esc(r.closed_at)}</cerrada>
  </alerta>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<alertas>${items}\n</alertas>`;
}

export default function AdminAlerts() {
  const { apiFetch } = useAdminFetch();
  const [alerts, setAlerts]         = useState([]);
  const [pagination, setPag]        = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilter]   = useState("Todos");
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");
  const [page, setPage]             = useState(1);
  const [exporting, setExporting]   = useState(false);

  const buildParams = useCallback((extraPage) => {
    const p = new URLSearchParams({ page: extraPage ?? page, limit: 30 });
    if (filterStatus !== "Todos") p.append("status", filterStatus);
    if (dateFrom) p.append("date_from", dateFrom);
    if (dateTo)   p.append("date_to",   dateTo);
    return p;
  }, [page, filterStatus, dateFrom, dateTo]);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch(`/admin/alerts?${buildParams()}`)
      .then((d) => { setAlerts(d.alerts); setPag(d.pagination); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [buildParams]);

  useEffect(() => { load(); }, [load]);

  const filtered = alerts.filter(
    (a) => !search ||
      a.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.group_name?.toLowerCase().includes(search.toLowerCase()) ||
      String(a.id).includes(search)
  );

  /* ─── Exportar ─── */
  async function handleExport(format) {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "Todos") params.append("status", filterStatus);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo)   params.append("date_to",   dateTo);

      const data = await apiFetch(`/admin/alerts/export?${params}`);
      const rows = data.alerts;
      const stamp = new Date().toISOString().slice(0,10);

      if (format === "json") {
        downloadBlob(JSON.stringify(rows, null, 2), `alertas_${stamp}.json`, "application/json");
      } else if (format === "xml") {
        downloadBlob(toXML(rows), `alertas_${stamp}.xml`, "application/xml");
      } else if (format === "csv") {
        downloadBlob(toCSV(rows), `alertas_${stamp}.csv`, "text/csv");
      }
    } catch {
      /* silent */
    } finally {
      setExporting(false);
    }
  }

  const hasDateFilter = dateFrom || dateTo;

  return (
    <SectionCard title="Alertas del sistema" count={pagination.total}>

      {/* Barra superior: búsqueda + exportar */}
      <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex-1 min-w-[200px]">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por usuario, grupo o ID..." />
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-slate-400 dark:text-slate-500 mr-1">Exportar:</span>
          {["json","xml","csv"].map((fmt) => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt)}
              disabled={exporting}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {fmt === "csv" ? "Excel/CSV" : fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros: estado + fechas */}
      <div className="flex flex-wrap items-end gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
        {/* Estado */}
        <div>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Estado</p>
          <div className="flex flex-wrap gap-1">
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
        </div>

        {/* Fechas */}
        <div className="flex items-end gap-2">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Desde</p>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Hasta</p>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          {hasDateFilter && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
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
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="text-xs px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">
              ← Anterior
            </button>
            <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}
              className="text-xs px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
