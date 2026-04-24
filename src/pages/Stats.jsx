import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { MapContainer, TileLayer, Circle, Tooltip as MapTooltip, GeoJSON } from "react-leaflet";
import { 
  TrendingUp, Activity, CheckCircle2, Clock, 
  AlertCircle, BarChart3, Map as MapIcon, ArrowLeft, Shield
} from "lucide-react";
import { PageShell, Card } from "./_ui";
import { useAuth } from "../app/auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

const STATUS_THEME = {
  RECEIVED: { color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  ACTIVE:   { color: "#ef4444", bg: "bg-red-50 dark:bg-red-500/10",   text: "text-red-600 dark:text-red-400" },
  ATTENDED: { color: "#0ea5e9", bg: "bg-sky-50 dark:bg-sky-500/10",   text: "text-sky-600 dark:text-sky-400" },
  CLOSED:   { color: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
};

// ── GeoJSON de colonias ──────────────────────────────────────────────────────
const COLONIAS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Colonia 1" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-103.4165010, 20.6719563],
          [-103.3473385, 20.6751707],
          [-103.2259525, 20.6576456],
          [-103.2413723, 20.6237413],
          [-103.3361581, 20.6025191],
          [-103.4165010, 20.6719563], // cierra el polígono
        ]],
      },
    },
    // → aquí agregas más colonias con el mismo esquema
  ],
};

const geoJsonStyle = {
  color: "#ef4444",
  weight: 2.5,
  opacity: 0.9,
  fillColor: "#ef4444",
  fillOpacity: 0.08,
};

// ── MetricCard ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, icon: Icon, colorClass, borderSide }) {
  return (
    <div className={relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none group transition-all duration-300 hover:-translate-y-1}>
      <div className={absolute top-0 left-0 w-1.5 h-full ${borderSide}} />
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
        <div className={p-3 rounded-2xl ${colorClass} transition-transform group-hover:scale-110}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

// ── Overlay full-screen de zonas de riesgo ───────────────────────────────────
function RiskMapOverlay({ hotspots, onClose }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
        >
          <div className="w-9 h-9 rounded-2xl bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center transition-colors">
            <ArrowLeft size={18} />
          </div>
          <span className="text-sm font-bold">Regresar</span>
        </button>
        <div className="h-6 w-px bg-slate-700" />
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-red-400" />
          <span className="text-sm font-black text-white uppercase tracking-widest">Zonas de Riesgo</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">En vivo</span>
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative">
        <MapContainer
          center={[20.6736, -103.4053]}
          zoom={12}
          className="h-full w-full"
          zoomControl={true}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Perímetro de colonias en GeoJSON */}
          <GeoJSON
            data={COLONIAS_GEOJSON}
            style={geoJsonStyle}
            onEachFeature={(feature, layer) => {
              if (feature.properties?.name) {
                layer.bindTooltip(feature.properties.name, {
                  permanent: false,
                  className: "sigma-tooltip",
                });
              }
            }}
          />

          {/* Círculos de hotspots */}
          {(hotspots ?? []).map((h, i) => (
            <Circle
              key={i}
              center={[Number(h.lat), Number(h.lng)]}
              radius={Math.max(50, Number(h.intensity) * 120)}
              pathOptions={{
                color: "#ef4444",
                fillColor: "#ef4444",
                fillOpacity: 0.4,
                weight: 0,
              }}
            >
              <MapTooltip className="sigma-tooltip">
                ZONA CRÍTICA: {h.intensity} alertas
              </MapTooltip>
            </Circle>
          ))}
        </MapContainer>

        {/* Leyenda flotante */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-slate-900/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-700">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Leyenda</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-500 rounded" />
              <span className="text-xs text-slate-300">Perímetro de colonia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/40 border border-red-500" />
              <span className="text-xs text-slate-300">Hotspot de incidencia</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stats (componente principal) ─────────────────────────────────────────────
export default function Stats() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRiskMap, setShowRiskMap] = useState(false);

  const isDark = document.documentElement.classList.contains("dark");

  useEffect(() => {
    if (!token) return;
    fetch(${API_BASE}/stats, { headers: { Authorization: Bearer ${token} } })
      .then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setData(d); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading || error) {
    return (
      <PageShell title="Estadísticas" subtitle={error ? "Error de conexión" : "Sincronizando datos..."}>
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-3xl border border-red-100 dark:border-red-800 font-bold max-w-md text-center">
              <AlertCircle size={40} className="mx-auto mb-4 opacity-50" />
              {error}
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

  return (
    <>
      {/* Overlay full-screen */}
      {showRiskMap && (
        <RiskMapOverlay
          hotspots={data.hotspots}
          onClose={() => setShowRiskMap(false)}
        />
      )}

      <PageShell
        title="Dashboard Operativo"
        subtitle="Análisis predictivo e histórico de seguridad familiar."
      >
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard label="Total Histórico" value={data.total} sub="+12% vs mes anterior" icon={BarChart3}
            colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" borderSide="bg-indigo-500" />
          <MetricCard label="Atención Requerida" value={(statusMap.ACTIVE ?? 0) + (statusMap.RECEIVED ?? 0)} sub="Prioridad inmediata" icon={Activity}
            colorClass="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" borderSide="bg-red-500" />
          <MetricCard label="Casos Resueltos" value={statusMap.CLOSED ?? 0} sub="Tasa de éxito 98%" icon={CheckCircle2}
            colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" borderSide="bg-emerald-500" />
          <MetricCard label="Latencia Media" value={${data.avgResponseMinutes ?? 0}m} sub="Tiempo de respuesta" icon={Clock}
            colorClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" borderSide="bg-amber-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Gráfico de Barras */}
          <div className="lg:col-span-2">
            <Card title="Tendencia de Incidentes" icon={TrendingUp} className="dark:bg-slate-900 dark:border-slate-800 transition-colors">
              <div className="h-[350px] mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke={isDark ? "#334155" : "#cbd5e1"} strokeOpacity={0.4} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: isDark ? "#64748b" : "#94a3b8" }} dy={10} />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(148, 163, 184, 0.1)" }}
                      contentStyle={{ borderRadius: "20px", border: "none", backgroundColor: isDark ? "#1e293b" : "#0f172a", color: "#fff", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.3)", fontWeight: 800 }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="Alertas" radius={[10, 10, 10, 10]} barSize={32}>
                      {barData.map((_, index) => (
                        <Cell key={cell-${index}} fill={index === barData.length - 1 ? "#3b82f6" : (isDark ? "#475569" : "#94a3b8")} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Estado del Sistema */}
          <Card title="Estado del Sistema" icon={Activity} className="dark:bg-slate-900 dark:border-slate-800 transition-colors">
            <div className="space-y-6 mt-6">
              {(data.byStatus ?? []).map((s) => {
                const theme = STATUS_THEME[s.status] || { color: "#64748b", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" };
                const pct = data.total > 0 ? Math.round((s.total / data.total) * 100) : 0;
                return (
                  <div key={s.status} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">{s.status}</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{s.total} unidades</p>
                      </div>
                      <p className={text-xs font-black ${theme.text}}>{pct}%</p>
                    </div>
                    <div className="h-3 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700 p-0.5">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: ${pct}%, backgroundColor: theme.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Card de Zonificación — botón arriba, análisis arriba del mapa */}
        <Card
          title="Zonificación de Riesgo"
          icon={MapIcon}
          className="dark:bg-slate-900 dark:border-slate-800 transition-colors"
          headerExtra={
            <button
              onClick={() => setShowRiskMap(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors"
            >
              <Shield size={14} />
              Zonas de riesgo
            </button>
          }
        >
          {/* Análisis de hotspots — ARRIBA */}
          <div className="mt-6 mb-6 p-6 bg-slate-900 dark:bg-slate-800/80 rounded-[2rem] text-white border dark:border-slate-700">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4">Análisis de Hotspots</h4>
            <p className="text-sm font-medium leading-relaxed opacity-80">
              Se han detectado <span className="text-red-400 font-black">{data.hotspots?.length} áreas</span> de reincidencia alta en el perímetro.
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Vigilancia en tiempo real</span>
              </div>
            </div>
          </div>

          {/* Mapa pequeño — ABAJO */}
          <div className="h-[350px] rounded-[2.5rem] overflow-hidden border-8 border-slate-50 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-950">
            <div className="h-full w-full grayscale-[0.2] dark:invert dark:hue-rotate-180 dark:brightness-95 dark:contrast-90">
              <MapContainer center={[20.6736, -103.4053]} zoom={12} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <GeoJSON data={COLONIAS_GEOJSON} style={geoJsonStyle} />
                {(data.hotspots ?? []).map((h, i) => (
                  <Circle key={i} center={[Number(h.lat), Number(h.lng)]}
                    radius={Math.max(50, Number(h.intensity) * 120)}
                    pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.4, weight: 0 }}>
                    <MapTooltip className="sigma-tooltip">ZONA CRÍTICA: {h.intensity} alertas</MapTooltip>
                  </Circle>
                ))}
              </MapContainer>
            </div>
          </div>
        </Card>
      </PageShell>
    </>
  );
}