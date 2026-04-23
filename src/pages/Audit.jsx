import React, { useEffect, useState, useCallback } from "react";
import { PageShell, Card, Button, Pill } from "./_ui";
import { useAuth } from "../app/auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

const EVENT_LABELS = {
  LOGIN:               { label: "Login",             color: "blue"   },
  USER_REGISTER:       { label: "Registro",          color: "green"  },
  USER_VERIFIED:       { label: "Verificación",      color: "green"  },
  ALERT_STATUS_CHANGE: { label: "Cambio de alerta",  color: "yellow" },
  IOT_ALERT:           { label: "Alerta IoT",        color: "red"    },
  DEVICE_REGISTER:     { label: "Dispositivo",       color: "slate"  },
};

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

// ── Generar XML ──────────────────────────────────────────────────
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

// ── Modal XML ───────────────────────────────────────────────────
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <div className="font-extrabold text-slate-900">Exportar Auditoría XML</div>
            <div className="text-xs text-slate-400 mt-0.5">Vista previa del archivo generado</div>
          </div>
          <div className="flex gap-2">
            <Button onClick={download}>⬇ Descargar</Button>
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </div>
        </div>

        {/* XML Content */}
        <div className="overflow-auto flex-1 p-4">
          <pre className="text-xs font-mono text-slate-700 bg-slate-50 rounded-xl p-4 whitespace-pre-wrap">
            {xml}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────
export default function Audit() {
  const { token } = useAuth();

  const [logs, setLogs]         = useState([]);
  const [pagination, setPag]    = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [filter, setFilter]     = useState("");
  const [page, setPage]         = useState(1);
  const [showXML, setShowXML]   = useState(false);
  const [xml, setXml]           = useState("");
  const [loadingXML, setLoadingXML] = useState(false);

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
      // Traer todos los logs para el XML (sin paginación)
      const params = new URLSearchParams({ page: 1, limit: 100 });
      if (filter) params.append("event_type", filter);
      const res  = await fetch(`${API_BASE}/audit?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const generatedXml = generateAuditXML(data.logs);
      setXml(generatedXml);
      setShowXML(true);
    } catch (e) {
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
        subtitle="Registro de actividad del sistema."
        right={
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchLogs}>↺ Actualizar</Button>
            <Button onClick={handleExportXML} disabled={loadingXML}>
              {loadingXML ? "Generando..." : "⬇ Exportar XML"}
            </Button>
          </div>
        }
      >
        {/* ── Filtros ── */}
        <Card>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-500 font-medium">Filtrar por:</span>
            {[
              { key: "",                    label: "Todos"          },
              { key: "LOGIN",               label: "Logins"         },
              { key: "USER_REGISTER",       label: "Registros"      },
              { key: "USER_VERIFIED",       label: "Verificaciones" },
              { key: "ALERT_STATUS_CHANGE", label: "Alertas"        },
              { key: "IOT_ALERT",           label: "IoT"            },
              { key: "DEVICE_REGISTER",     label: "Dispositivos"   },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); setPage(1); }}
                className="px-3 py-1 rounded-full text-xs font-semibold transition"
                style={{
                  background: filter === f.key ? "#0f172a" : "#f1f5f9",
                  color:      filter === f.key ? "#ffffff" : "#475569",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Card>

        {/* ── Tabla de logs ── */}
        <Card title={`${pagination.total} eventos registrados`}>
          {loading ? (
            <div className="flex items-center justify-center h-32 text-slate-400 gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              Cargando logs...
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-8">
              Sin eventos registrados aún.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs text-slate-400 font-medium pb-2 pr-4">Evento</th>
                    <th className="text-left text-xs text-slate-400 font-medium pb-2 pr-4">Descripción</th>
                    <th className="text-left text-xs text-slate-400 font-medium pb-2 pr-4">Usuario</th>
                    <th className="text-left text-xs text-slate-400 font-medium pb-2">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 pr-4">
                        <EventPill type={log.eventType} />
                      </td>
                      <td className="py-2.5 pr-4 text-slate-700 max-w-xs truncate">
                        {log.description}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="text-slate-700 font-medium">{log.user}</div>
                        {log.email && (
                          <div className="text-xs text-slate-400">{log.email}</div>
                        )}
                      </td>
                      <td className="py-2.5 text-xs text-slate-500 whitespace-nowrap">
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
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Página {pagination.page} de {pagination.pages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Anterior
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente →
                </Button>
              </div>
            </div>
          )}
        </Card>
      </PageShell>
    </>
  );
}