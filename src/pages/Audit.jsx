import React, { useEffect, useState, useCallback } from "react";
import { PageShell, Card, Button, Pill } from "./_ui";
import { useAuth } from "../app/auth/AuthContext";
import {
  RefreshCw, Download, X, ShieldCheck,
  Loader2, AlertCircle, FileText, ChevronLeft, ChevronRight,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

const EVENT_LABELS = {
  LOGIN:               { label: "Login",            color: "blue"   },
  USER_REGISTER:       { label: "Registro",         color: "green"  },
  USER_VERIFIED:       { label: "Verificación",     color: "green"  },
  ALERT_STATUS_CHANGE: { label: "Cambio de alerta", color: "yellow" },
  IOT_ALERT:           { label: "Alerta IoT",       color: "red"    },
  DEVICE_REGISTER:     { label: "Dispositivo",      color: "slate"  },
};

const FILTERS = [
  { key: "",                    label: "Todos"          },
  { key: "LOGIN",               label: "Logins"         },
  { key: "USER_REGISTER",       label: "Registros"      },
  { key: "USER_VERIFIED",       label: "Verificaciones" },
  { key: "ALERT_STATUS_CHANGE", label: "Alertas"        },
  { key: "IOT_ALERT",           label: "IoT"            },
  { key: "DEVICE_REGISTER",     label: "Dispositivos"   },
];

function EventPill({ type }) {
  const cfg = EVENT_LABELS[type] ?? { label: type, color: "slate" };
  return <Pill variant={cfg.color}>{cfg.label}</Pill>;
}

function formatDate(dt) {
  return new Date(dt).toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Generar XML ──────────────────────────────────────────────────────
function generateAuditXML(logs) {
  const escape = (str) =>
    String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<sigmafam_audit generated="${new Date().toISOString()}">`,
    `  <summary>`,
    `    <total_logs>${logs.length}</total_logs>`,
    `    <exported_at>${new Date().toISOString()}</exported_at>`,
    `  </summary>`,
    `  <logs>`,
  ];

  for (const log of logs) {
    lines.push(`    <log id="${log.id}">`);
    lines.push(`      <event_type>${escape(log.eventType)}</event_type>`);
    lines.push(`      <description>${escape(log.description)}</description>`);
    lines.push(`      <user>${escape(log.user)}</user>`);
    lines.push(`      <email>${escape(log.email)}</email>`);
    lines.push(`      <created_at>${escape(log.createdAt)}</created_at>`);
    if (log.metadata) {
      lines.push(`      <metadata>`);
      for (const [k, v] of Object.entries(log.metadata)) {
        lines.push(`        <${escape(k)}>${escape(v)}</${escape(k)}>`);
      }
      lines.push(`      </metadata>`);
    }
    lines.push(`    </log>`);
  }

  lines.push(`  </logs>`);
  lines.push(`</sigmafam_audit>`);
  return lines.join("\n");
}

// ── Modal XML ────────────────────────────────────────────────────────
function XMLModal({ xml, onClose }) {
  function download() {
    const blob = new Blob([xml], { type: "application/xml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `sigmafam-audit-${new Date().toISOString().slice(0, 10)}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0d1426] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center">
              <FileText size={16} className="text-blue-500" />
            </div>
            <div>
              <div className="font-black text-slate-900 dark:text-white uppercase text-[11px] tracking-widest">
                Exportar Auditoría XML
              </div>
              <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">
                Vista previa del archivo generado
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={download}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] tracking-widest uppercase flex items-center gap-1.5"
            >
              <Download size={13} /> Descargar
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* XML Content */}
        <div className="overflow-auto flex-1 p-4">
          <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 whitespace-pre-wrap border border-slate-100 dark:border-slate-800 leading-relaxed">
            {xml}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────
export default function Audit() {
  const { token } = useAuth();

  const [logs, setLogs]                   = useState([]);
  const [pagination, setPag]              = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [filter, setFilter]               = useState("");
  const [page, setPage]                   = useState(1);
  const [showXML, setShowXML]             = useState(false);
  const [xml, setXml]                     = useState("");
  const [loadingXML, setLoadingXML]       = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (filter) params.append("event_type", filter);
      const res  = await fetch(`${API_BASE}/audit?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLogs(data.logs);
      setPag(data.pagination);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, page, filter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  async function handleExportXML() {
    setLoadingXML(true);
    try {
      const params = new URLSearchParams({ page: 1, limit: 100 });
      if (filter) params.append("event_type", filter);
      const res  = await fetch(`${API_BASE}/audit?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setXml(generateAuditXML(data.logs));
      setShowXML(true);
    } catch {
      setError("No se pudo generar el XML.");
    } finally {
      setLoadingXML(false);
    }
  }

  return (
    <>
      {showXML && <XMLModal xml={xml} onClose={() => setShowXML(false)} />}

      <PageShell
        title="Auditoría"
        subtitle={
          <span className="text-slate-500 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] italic">
            REGISTRO DE ACTIVIDAD DEL SISTEMA
          </span>
        }
        right={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-1.5 font-black text-[10px] tracking-widest uppercase"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Actualizar
            </Button>
            <Button
              onClick={handleExportXML}
              disabled={loadingXML}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] tracking-widest uppercase flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
            >
              {loadingXML
                ? <><Loader2 size={13} className="animate-spin" /> Generando...</>
                : <><Download size={13} /> Exportar XML</>
              }
            </Button>
          </div>
        }
      >
        {/* ── Filtros ── */}
        <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mr-1">
              Filtrar:
            </span>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                  filter === f.key
                    ? "bg-slate-900 dark:bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-transparent dark:border-slate-700/50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Card>

        {/* ── Tabla de logs ── */}
        <Card className="bg-white dark:bg-[#0d1426] border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl p-0">
          {/* Sub-header de la tabla */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
            <ShieldCheck size={15} className="text-blue-500 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {loading ? "Cargando registros..." : `${pagination.total} eventos registrados`}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40 gap-3 text-slate-400 dark:text-slate-600">
              <Loader2 size={20} className="animate-spin text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Cargando logs...</span>
            </div>
          ) : error ? (
            <div className="m-4 flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs rounded-xl px-5 py-4">
              <AlertCircle size={16} className="shrink-0" />
              <span className="font-black uppercase text-[10px] tracking-wide">{error}</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <FileText size={36} className="text-slate-200 dark:text-slate-800 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700 italic">
                Sin eventos registrados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/80">
                    <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 px-6 py-4">
                      Evento
                    </th>
                    <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 px-4 py-4">
                      Descripción
                    </th>
                    <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 px-4 py-4">
                      Usuario
                    </th>
                    <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 px-6 py-4">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 px-6">
                        <EventPill type={log.eventType} />
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400 text-[11px] max-w-xs truncate font-medium">
                        {log.description}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-black text-[11px] uppercase tracking-tight">
                          {log.user}
                        </div>
                        {log.email && (
                          <div className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-tighter mt-0.5">
                            {log.email}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase italic whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Paginación ── */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Pág. {pagination.page} de {pagination.pages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </Card>
      </PageShell>
    </>
  );
}
