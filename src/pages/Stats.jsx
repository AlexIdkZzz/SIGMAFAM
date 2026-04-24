import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { 
  MapContainer, TileLayer, Circle, Polygon, 
  Tooltip as MapTooltip 
} from "react-leaflet";
import { 
  TrendingUp, Activity, CheckCircle2, Clock, 
  AlertCircle, BarChart3, Map as MapIcon, FileCode, Maximize2, X
} from "lucide-react";
import { PageShell, Card, Button } from "./_ui";
import { useAuth } from "../app/auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

const STATUS_THEME = {
  RECEIVED: { color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  ACTIVE:   { color: "#ef4444", bg: "bg-red-50 dark:bg-red-500/10",   text: "text-red-600 dark:text-red-400" },
  ATTENDED: { color: "#0ea5e9", bg: "bg-sky-50 dark:bg-sky-500/10",   text: "text-sky-600 dark:text-sky-400" },
  CLOSED:   { color: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
};

const AREA_POLYGON = [
  [20.6719563, -103.416501],
  [20.6751707, -103.3473385],
  [20.6237413, -103.2413723],
  [20.6025191, -103.3361581],
  [20.6576456, -103.2259525],
];

/* ─────────────────────────────────────────────
    COMPONENTES AUXILIARES (UI)
───────────────────────────────────────────── */

function MetricCard({ label, value, sub, icon: Icon, colorClass, borderSide }) {
  return (
    <div className={`relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none group transition-all duration-300 hover:-translate-y-1`}>
      <div className={`absolute top-0 left-0 w-1.5 h-full ${borderSide}`} />
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">{label}</p>
          <p className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{value}</p>
          {sub && (
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-500 dark:text-emerald-400" /> {sub}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${colorClass} transition-transform group-hover:scale-110`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function XMLModal({ xml, onClose }) {
  const download = () => {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sigmafam-stats-${new Date().toISOString().slice(0, 10)}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileCode className="text-indigo-500" /> Exportar Datos XML
          </h3>
          <div className="flex gap-3">
            <Button onClick={download}>Descargar</Button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>
        <div className="overflow-auto flex-1 p-8 bg-slate-50 dark:bg-slate-950/50">
          <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {xml}
          </pre>
        </div>
      </div>
    </div>
  );
}

function FullMapModal({ onClose, center, hotspots }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold">← Volver</button>
            <span className="font-black uppercase tracking-widest text-sm dark:text-white">Mapa de Incidencias Pantalla Completa</span>
        </div>
      </div>
      <div className="flex-1 relative">
        <MapContainer center={center} zoom={13} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polygon positions={AREA_POLYGON} pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.15, weight: 3 }} />
          {hotspots.map((h, i) => (
            <Circle key={i} center={[Number(h.lat), Number(h.lng)]} radius={Math.max(50, Number(h.intensity) * 100)}
              pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.5, weight: 0 }}
            >
              <MapTooltip>ZONA CRÍTICA: {h.intensity} alertas</MapTooltip>
            </Circle>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
    LÓGICA DE GENERACIÓN XML
───────────────────────────────────────────── */
const generateStatsXML = (data) => {
  const escape = (str) => String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<sigmafam_stats generated="${new Date().toISOString()}">`,
    `  <summary>`,
    `    <total_alerts>${escape(data.total)}</total_alerts>`,
    `    <avg_response_minutes>${escape(data.avgResponseMinutes)}</avg_response_minutes>`,
    `  </summary>`,
    `  <by_status>`,
    ...(data.byStatus ?? []).map(s => `    <status name="${escape(s.status)}" total="${escape(s.total)}" />`),
    `  </by_status>`,
    `  <hotspots>`,
    ...(data.hotspots ?? []).map(h => `    <hotspot lat="${escape(h.lat)}" lng="${escape(h.lng)}" intensity="${escape(h.intensity)}" />`),
    `  </hotspots>`,
    `</sigmafam_stats>`
  ].join("\n");
};

/* ─────────────────────────────────────────────
    COMPONENTE PRINCIPAL (STATS)
───────────────────────────────────────────── */
export default function Stats() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showXML, setShowXML] = useState(false);
  const [showFullMap, setShowFullMap] = useState(false);

  const isDark = document.documentElement.classList.contains('dark');

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading || error) {
    return (
      <PageShell title="Estadísticas" subtitle={error ? "Error de conexión" : "Sincronizando datos..."}>
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-3xl border border-red-100 dark:border-red-800 font-bold max-w-md text-center">
              <AlertCircle size={40} className="mx-auto mb-4 opacity-50" /> {error}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 border-t-slate-900 dark:border-t-blue-500 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Analizando registros</p>
            </div>
          )}
        </div>
      </PageShell>
    );
  }

  const barData = (data.byDay ?? []).map((d) => ({
    day: new Date(d.day).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
    Alertas: Number(d.total),
  }));

  const statusMap = {};
  (data.byStatus ?? []).forEach((s) => { statusMap[s.status] = Number(s.total); });
  
  const mapCenter = data.hotspots?.length 
    ? [Number(data.hotspots[0].lat), Number(data.hotspots[0].lng)] 
    : [20.6736, -103.4053];

  return (
    <>
      {showXML && <XMLModal xml={generateStatsXML(data)} onClose={() => setShowXML(false)} />}
      {showFullMap && <FullMapModal center={mapCenter} hotspots={data.hotspots ?? []} onClose={() => setShowFullMap(false)} />}

      <PageShell
        title="Dashboard Operativo"
        subtitle="Análisis predictivo e histórico de seguridad."
        right={
            <Button onClick={() => setShowXML(true)} className="flex items-center gap-2">
                <FileCode size={16} /> Exportar XML
            </Button>
        }
      >
        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard label="Total Histórico" value={data.total} icon={BarChart3} colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" borderSide="bg-indigo-500" />
          <MetricCard label="En Curso" value={(statusMap.ACTIVE ?? 0) + (statusMap.RECEIVED ?? 0)} icon={Activity} colorClass="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" borderSide="bg-red-500" />
          <MetricCard label="Resueltos" value={statusMap.CLOSED ?? 0} icon={CheckCircle2} colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" borderSide="bg-emerald-500" />
          <MetricCard label="Latencia Media" value={`${data.avgResponseMinutes ?? 0}m`} icon={Clock} colorClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" borderSide="bg-amber-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Gráfico Tendencia */}
          <div className="lg:col-span-2">
            <Card title="Tendencia de Incidentes" icon={TrendingUp}>
              <div className="h-[350px] mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke={isDark ? "#334155" : "#cbd5e1"} strokeOpacity={0.4} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: isDark ? '#64748b' : '#94a3b8' }} />
                    <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '20px', backgroundColor: isDark ? '#1e293b' : '#0f172a', border: 'none', color: '#fff' }} />
                    <Bar dataKey="Alertas" radius={[10, 10, 10, 10]} barSize={32}>
                      {barData.map((e, i) => <Cell key={i} fill={i === barData.length - 1 ? '#3b82f6' : (isDark ? '#475569' : '#94a3b8')} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Estado del Sistema */}
          <Card title="Estado de Unidades" icon={Activity}>
            <div className="space-y-6 mt-6">
              {(data.byStatus ?? []).map((s) => {
                const theme = STATUS_THEME[s.status] || { color: "#64748b", text: "text-slate-500" };
                const pct = data.total > 0 ? Math.round((s.total / data.total) * 100) : 0;
                return (
                  <div key={s.status}>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.status}</p>
                      <p className={`text-xs font-black ${theme.text}`}>{pct}%</p>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: theme.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Mapa de Calor y Polígono */}
        <Card 
            title="Geofencing y Hotspots" 
            icon={MapIcon}
            right={
                <button onClick={() => setShowFullMap(true)} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full hover:bg-indigo-500 hover:text-white transition-all">
                    <Maximize2 size={12} /> Expandir Mapa
                </button>
            }
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
            <div className="lg:col-span-3">
              <div className="h-[450px] rounded-[2.5rem] overflow-hidden border-8 border-slate-50 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-950 relative">
                <div className="h-full w-full dark:invert dark:hue-rotate-180 dark:brightness-95 transition-all">
                  <MapContainer center={mapCenter} zoom={12} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {/* Polígono de Cobertura */}
                    <Polygon positions={AREA_POLYGON} pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.2, weight: 2 }} />
                    {/* Hotspots */}
                    {(data.hotspots ?? []).map((h, i) => (
                      <Circle key={i} center={[Number(h.lat), Number(h.lng)]} radius={Math.max(50, Number(h.intensity) * 100)}
                        pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.4, weight: 0 }}
                      >
                        <MapTooltip>Zona crítica: {h.intensity} incidentes</MapTooltip>
                      </Circle>
                    ))}
                  </MapContainer>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="p-6 bg-slate-900 dark:bg-slate-800/80 rounded-[2rem] text-white shadow-xl border border-slate-700">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Análisis Espacial</h4>
                <p className="text-sm leading-relaxed opacity-90">
                  Sistema operando sobre el polígono definido. Se detectan <span className="text-red-400 font-black">{data.hotspots?.length} áreas</span> críticas.
                </p>
                <div className="mt-6 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Geofencing Activo</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </PageShell>
    </>
  );
}