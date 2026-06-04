import React, { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  MapContainer, TileLayer, GeoJSON,
} from "react-leaflet";
import {
  TrendingUp, Activity, CheckCircle2, Clock,
  AlertCircle, Map as MapIcon, ArrowLeft, Shield, Maximize2,
} from "lucide-react";
import { PageShell, Card } from "./_ui";
import { useAuth } from "../app/auth/AuthContext";
import HeatmapLayer from "../app/maps/HeatmapLayer";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

// ── GeoJSON ──────────────────────────────────────────────────────────
const COLONIAS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Zona de Cobertura" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-103.4165010, 20.6719563],
          [-103.3473385, 20.6751707],
          [-103.2259525, 20.6576456],
          [-103.2413723, 20.6237413],
          [-103.3361581, 20.6025191],
          [-103.4165010, 20.6719563],
        ]],
      },
    },
  ],
};

const geoJsonStyle = {
  color: "#ef4444",
  weight: 2.5,
  opacity: 0.9,
  fillColor: "#ef4444",
  fillOpacity: 0.07,
};

// ── MetricCard ───────────────────────────────────────────────────────
function MetricCard({ label, value, sub, icon: Icon, accentColor, bgClass, textClass }) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 rounded-[1.75rem] p-6 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
      {/* Barra lateral de color */}
      <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-[1.75rem] ${accentColor}`} />
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {label}
          </p>
          <p className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">
            {value}
          </p>
          {sub && (
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {sub}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${bgClass}`}>
          <Icon size={20} className={textClass} />
        </div>
      </div>
    </div>
  );
}

// ── Tooltip personalizado para BarChart ──────────────────────────────
function ChartTooltip({ active, payload, label, dark }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: dark ? "#0f172a" : "#ffffff",
        border: `1px solid ${dark ? "#1e293b" : "#e2e8f0"}`,
        borderRadius: 12,
        padding: "10px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      }}
    >
      <p style={{ color: dark ? "#64748b" : "#94a3b8", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ color: dark ? "#f1f5f9" : "#0f172a", fontSize: 14, fontWeight: 900 }}>
        {payload[0]?.value}{" "}
        <span style={{ color: "#3b82f6", fontWeight: 700 }}>alertas</span>
      </p>
    </div>
  );
}

function HeatLegend() {
  return (
    <div className="absolute bottom-5 left-4 z-[500] pointer-events-none">
      <div className="bg-white/90 dark:bg-[#050a18]/95 backdrop-blur-xl border border-white/60 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-2xl">
        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">
          Nivel de Incidencia
        </p>
        <div
          className="h-2.5 w-28 rounded-full mb-1.5"
          style={{ background: "linear-gradient(to right, #00e676, #ffee58, #ff9800, #f44336, #b71c1c)" }}
        />
        <div className="flex justify-between text-[8px] font-black text-slate-400 w-28">
          <span>BAJO</span>
          <span>MEDIO</span>
          <span>ALTO</span>
        </div>
      </div>
    </div>
  );
}

function ScopedHeatmap({ points, maxIntensity, radius = 58, opacity = 0.85 }) {
  if (!points.length) return null;
  return (
    <HeatmapLayer
      points={points}
      radius={radius}
      maxInt={maxIntensity}
      opacity={opacity}
    />
  );
}

function getHeatPoints(hotspots = []) {
  return hotspots
    .map((h) => ({
      lat: Number(h.lat),
      lng: Number(h.lng),
      intensity: Number(h.intensity) || 1,
    }))
    .filter((h) => Number.isFinite(h.lat) && Number.isFinite(h.lng));
}

function getMaxIntensity(points) {
  return points.length
    ? Math.max(Math.max(...points.map((p) => Number(p.intensity))), 5)
    : 5;
}

// ── Overlay mapa de riesgo ───────────────────────────────────────────
function RiskMapOverlay({ hotspots, onClose }) {
  const heatPoints = getHeatPoints(hotspots);
  const maxIntensity = getMaxIntensity(heatPoints);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#020617", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 24px", background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
          <ArrowLeft size={18} color="#94a3b8" />
        </button>
        <Shield size={15} color="#f87171" />
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Mapa de Calor - Grupo Familiar / Cuenta
        </span>
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={[
            COLONIAS_GEOJSON.features[0].geometry.coordinates[0][0][1],
            COLONIAS_GEOJSON.features[0].geometry.coordinates[0][0][0],
          ]}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <GeoJSON data={COLONIAS_GEOJSON} style={geoJsonStyle} />
          <ScopedHeatmap points={heatPoints} maxIntensity={maxIntensity} radius={72} opacity={0.88} />
        </MapContainer>
        <HeatLegend />
      </div>
    </div>
  );
}

// ── Stats ────────────────────────────────────────────────────────────
export default function Stats() {
  const { token }                       = useAuth();
  const [data, setData]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [showRiskMap, setShowRiskMap]   = useState(false);
  const [isDark, setIsDark]             = useState(false);
  const [retryKey, setRetryKey]         = useState(0);

  // Detectar modo oscuro vía MutationObserver
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, retryKey]);

  if (loading) {
    return (
      <PageShell title="Dashboard Operativo">
        <div className="flex items-center justify-center py-32 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
            Cargando estadísticas...
          </span>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Dashboard Operativo">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <AlertCircle size={36} className="text-red-400" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            No se pudieron cargar las estadísticas
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{error}</p>
          <button
            onClick={() => setRetryKey(k => k + 1)}
            className="mt-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            Reintentar
          </button>
        </div>
      </PageShell>
    );
  }

  // ── Preparar datos ────────────────────────────────────────────────
  const barData = (data.byDay ?? []).map(d => ({
    day: new Date(d.day).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
    Alertas: Number(d.total),
  }));

  const statusMap = {};
  (data.byStatus ?? []).forEach(s => { statusMap[s.status] = Number(s.total); });

  const totalAlertas  = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const criticas      = (statusMap.ACTIVE || 0) + (statusMap.RECEIVED || 0);
  const atendidas     = statusMap.ATTENDED || 0;
  const cerradas      = statusMap.CLOSED   || 0;
  const heatPoints    = getHeatPoints(data.hotspots);
  const maxIntensity  = getMaxIntensity(heatPoints);
  const totalIncidents = heatPoints.reduce((sum, point) => sum + Number(point.intensity), 0);

  // Colores de la gráfica según tema
  const gridColor   = isDark ? "#1e293b" : "#f1f5f9";
  const axisColor   = isDark ? "#475569" : "#94a3b8";
  const barDefault  = isDark ? "#334155" : "#cbd5e1";

  return (
    <>
      {showRiskMap && (
        <RiskMapOverlay hotspots={data.hotspots} onClose={() => setShowRiskMap(false)} />
      )}

      <PageShell
        title="Dashboard Operativo"
        subtitle={
          <span className="text-slate-500 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] italic">
            ANÁLISIS Y MÉTRICAS DEL SISTEMA
          </span>
        }
      >
        {/* ── MetricCards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Alertas"
            value={totalAlertas}
            sub="Histórico acumulado"
            icon={TrendingUp}
            accentColor="bg-blue-500"
            bgClass="bg-blue-500/10 dark:bg-blue-500/15"
            textClass="text-blue-500"
          />
          <MetricCard
            label="Críticas"
            value={criticas}
            sub="Activas + recibidas"
            icon={AlertCircle}
            accentColor="bg-red-500"
            bgClass="bg-red-500/10 dark:bg-red-500/15"
            textClass="text-red-500"
          />
          <MetricCard
            label="Atendidas"
            value={atendidas}
            sub="En seguimiento"
            icon={Clock}
            accentColor="bg-sky-500"
            bgClass="bg-sky-500/10 dark:bg-sky-500/15"
            textClass="text-sky-500"
          />
          <MetricCard
            label="Cerradas"
            value={cerradas}
            sub="Resueltas"
            icon={CheckCircle2}
            accentColor="bg-emerald-500"
            bgClass="bg-emerald-500/10 dark:bg-emerald-500/15"
            textClass="text-emerald-500"
          />
        </div>

        {/* ── Gráfica + Desglose ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card title="Tendencia de Alertas · Últimos 30 días" className="bg-white dark:bg-[#0d1426] border-slate-200 dark:border-slate-800">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="4 4" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: axisColor, fontSize: 10, fontWeight: 700 }}
                    axisLine={{ stroke: gridColor }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: axisColor, fontSize: 10, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<ChartTooltip dark={isDark} />}
                    cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)", radius: 8 }}
                  />
                  <Bar dataKey="Alertas" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {barData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i === barData.length - 1 ? "#3b82f6" : barDefault}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Desglose por estado */}
          <Card title="Desglose por Estado" className="bg-white dark:bg-[#0d1426] border-slate-200 dark:border-slate-800">
            <div className="space-y-1 mt-1">
              {Object.entries(statusMap).length === 0 ? (
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 italic text-center py-8">
                  Sin datos
                </p>
              ) : (
                Object.entries(statusMap).map(([k, v]) => {
                  const pct = totalAlertas > 0 ? Math.round((v / totalAlertas) * 100) : 0;
                  const colors = {
                    ACTIVE:   "bg-red-500",
                    RECEIVED: "bg-amber-500",
                    ATTENDED: "bg-sky-500",
                    CLOSED:   "bg-emerald-500",
                  };
                  const barColor = colors[k] ?? "bg-slate-400";
                  return (
                    <div key={k}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{k}</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{v}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%`, transition: "width 0.8s ease" }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* ── Mapa de incidencia ── */}
        <Card title="Mapa de Calor - Incidencias" className="bg-white dark:bg-[#0d1426] border-slate-200 dark:border-slate-800 p-0">
          <div className="px-5 pt-4 pb-0">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 mb-3">
              ALERTAS DEL GRUPO FAMILIAR O CUENTA PERSONAL
            </p>
          </div>
          <div className="rounded-b-2xl overflow-hidden relative" style={{ height: 380 }}>
            <MapContainer center={[20.64, -103.33]} zoom={11} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <GeoJSON data={COLONIAS_GEOJSON} style={geoJsonStyle} />
              <ScopedHeatmap points={heatPoints} maxIntensity={maxIntensity} />
            </MapContainer>
            <HeatLegend />
            <div className="absolute top-4 right-4 z-[500] pointer-events-none">
              <div className="bg-slate-900/85 dark:bg-[#050a18]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 shadow-xl">
                <p className="text-[9px] font-black text-white uppercase tracking-[0.15em]">
                  {totalIncidents} incidencias
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <button
              onClick={() => setShowRiskMap(true)}
              className="w-full py-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-lg"
            >
              <Maximize2 size={13} />
              Ver mapa de calor detallado
            </button>
          </div>
        </Card>

      </PageShell>
    </>
  );
}
