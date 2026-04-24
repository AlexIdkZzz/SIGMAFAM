import React, { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  MapContainer,
  TileLayer,
  Circle,
  Tooltip as MapTooltip,
  GeoJSON,
} from "react-leaflet";
import {
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  Map as MapIcon,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { PageShell, Card } from "./_ui";
import { useAuth } from "../app/auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

const STATUS_THEME = {
  RECEIVED: {
    color: "#f59e0b",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
  ACTIVE: {
    color: "#ef4444",
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
  },
  ATTENDED: {
    color: "#0ea5e9",
    bg: "bg-sky-50 dark:bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
  },
  CLOSED: {
    color: "#10b981",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
  },
};

const COLONIAS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Zona de Cobertura" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-103.416501, 20.6719563],
            [-103.3473385, 20.6751707],
            [-103.2259525, 20.6576456],
            [-103.2413723, 20.6237413],
            [-103.3361581, 20.6025191],
            [-103.416501, 20.6719563],
          ],
        ],
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

function MetricCard({ label, value, sub, icon: Icon, colorClass, borderSide }) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none group transition-all duration-300 hover:-translate-y-1">
      {/* CORREGIDO: Se agregaron llaves externas {} */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${borderSide}`} />
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">
            {label}
          </p>
          <p className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
            {value}
          </p>
          {sub && (
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-500 dark:text-emerald-400" />
              {sub}
            </p>
          )}
        </div>
        {/* CORREGIDO: Se agregaron llaves externas {} */}
        <div className={`p-3 rounded-2xl ${colorClass} transition-transform group-hover:scale-110`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function RiskMapOverlay({ hotspots, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#020617",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "14px 24px",
          backgroundColor: "#0f172a",
          borderBottom: "1px solid #1e293b",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: "#1e293b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={18} color="#94a3b8" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>
            Regresar
          </span>
        </button>

        <div style={{ width: 1, height: 22, backgroundColor: "#334155" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={15} color="#f87171" />
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: "#f1f5f9",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Zonas de Riesgo
          </span>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#ef4444",
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: "#475569",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            En vivo
          </span>
        </div>
      </div>

      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={[20.64, -103.33]}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
          zoomControl
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <GeoJSON
            data={COLONIAS_GEOJSON}
            style={geoJsonStyle}
            onEachFeature={(feature, layer) => {
              if (feature.properties?.name) {
                layer.bindTooltip(feature.properties.name, {
                  permanent: false,
                  direction: "center",
                });
              }
            }}
          />

          {(hotspots ?? []).map((h, i) => (
            <Circle
              key={i}
              center={[Number(h.lat), Number(h.lng)]}
              radius={Math.max(50, Number(h.intensity) * 120)}
              pathOptions={{
                color: "#ef4444",
                fillColor: "#ef4444",
                fillOpacity: 0.35,
                weight: 0,
              }}
            >
              <MapTooltip>ZONA CRÍTICA: {h.intensity} alertas</MapTooltip>
            </Circle>
          ))}
        </MapContainer>

        <div
          style={{
            position: "absolute",
            bottom: 28,
            left: 24,
            zIndex: 1000,
            backgroundColor: "rgba(15,23,42,0.92)",
            borderRadius: 18,
            padding: "14px 18px",
            border: "1px solid #1e293b",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: "#475569",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Leyenda
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 18,
                  height: 2.5,
                  backgroundColor: "#ef4444",
                  borderRadius: 2,
                }}
              />
              <span style={{ fontSize: 12, color: "#cbd5e1" }}>
                Perímetro de colonia
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "rgba(239,68,68,0.35)",
                  border: "1.5px solid #ef4444",
                }}
              />
              <span style={{ fontSize: 12, color: "#cbd5e1" }}>
                Hotspot de incidencia
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Stats() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRiskMap, setShowRiskMap] = useState(false);

  const isDark = document.documentElement.classList.contains("dark");

  useEffect(() => {
    if (!token) return;
    {/* CORREGIDO: Comillas invertidas y llaves en el fetch */}
    fetch(`${API_BASE}/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading || error) {
    return (
      <PageShell
        title="Estadísticas"
        subtitle={error ? "Error de conexión" : "Sincronizando datos..."}
      >
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-3xl border border-red-100 dark:border-red-800 font-bold max-w-md text-center">
              <AlertCircle size={40} className="mx-auto mb-4 opacity-50" />
              {error}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 border-t-slate-900 dark:border-t-blue-500 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                Analizando registros
              </p>
            </div>
          )}
        </div>
      </PageShell>
    );
  }

  const barData = (data.byDay ?? []).map((d) => ({
    day: new Date(d.day).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
    }),
    Alertas: Number(d.total),
  }));

  const statusMap = {};
  (data.byStatus ?? []).forEach((s) => {
    statusMap[s.status] = Number(s.total);
  });

  return (
    <>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            label="Total Histórico"
            value={data.total}
            sub="+12% vs mes anterior"
            icon={BarChart3}
            colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
            borderSide="bg-indigo-500"
          />
          <MetricCard
            label="Atención Requerida"
            value={(statusMap.ACTIVE ?? 0) + (statusMap.RECEIVED ?? 0)}
            sub="Prioridad inmediata"
            icon={Activity}
            colorClass="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
            borderSide="bg-red-500"
          />
          <MetricCard
            label="Casos Resueltos"
            value={statusMap.CLOSED ?? 0}
            sub="Tasa de éxito 98%"
            icon={CheckCircle2}
            colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            borderSide="bg-emerald-500"
          />
          <MetricCard
            label="Latencia Media"
            {/* CORREGIDO: Se agregaron llaves externas {} */}
            value={`${data.avgResponseMinutes ?? 0}m`}
            sub="Tiempo de respuesta"
            icon={Clock}
            colorClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
            borderSide="bg-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card
              title="Tendencia de Incidentes"
              icon={TrendingUp}
              className="dark:bg-slate-900 dark:border-slate-800 transition-colors"
            >
              <div className="h-[350px] mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid
                      strokeDasharray="8 8"
                      vertical={false}
                      stroke={isDark ? "#334155" : "#cbd5e1"}
                      strokeOpacity={0.4}
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 10,
                        fontWeight: 800,
                        fill: isDark ? "#64748b" : "#94a3b8",
                      }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{
                        fill: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(148,163,184,0.1)",
                      }}
                      contentStyle={{
                        borderRadius: 20,
                        border: "none",
                        backgroundColor: isDark ? "#1e293b" : "#0f172a",
                        color: "#fff",
                        fontWeight: 800,
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Bar
                      dataKey="Alertas"
                      radius={[10, 10, 10, 10]}
                      barSize={32}
                    >
                      {barData.map((_, index) => (
                        <Cell
                          {/* CORREGIDO: Se agregaron llaves externas {} */}
                          key={`cell-${index}`}
                          fill={
                            index === barData.length - 1
                              ? "#3b82f6"
                              : isDark
                              ? "#475569"
                              : "#94a3b8"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card
            title="Estado del Sistema"
            icon={Activity}
            className="dark:bg-slate-900 dark:border-slate-800 transition-colors"
          >
            <div className="space-y-6 mt-6">
              {(data.byStatus ?? []).map((s) => {
                const theme = STATUS_THEME[s.status] || {
                  color: "#64748b",
                  text: "text-slate-600 dark:text-slate-400",
                };
                const pct =
                  data.total > 0
                    ? Math.round((s.total / data.total) * 100)
                    : 0;
                return (
                  <div key={s.status}>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">
                          {s.status}
                        </p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          {s.total} unidades
                        </p>
                      </div>
                      {/* CORREGIDO: Se agregaron llaves externas {} */}
                      <p className={`text-xs font-black ${theme.text}`}>
                        {pct}%
                      </p>
                    </div>
                    <div className="h-3 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700 p-0.5">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        {/* CORREGIDO: Se agregaron llaves externas {} */}
                        style={{
                          width: `${pct}%`,
                          backgroundColor: theme.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
              <MapIcon
                size={18}
                className="text-slate-600 dark:text-slate-300"
              />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
              Zonificación de Riesgo
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <div
                style={{
                  height: 420,
                  borderRadius: 28,
                  overflow: "hidden",
                  {/* CORREGIDO: Se agregaron llaves externas {} */}
                  border: `8px solid ${isDark ? "#1e293b" : "#f8fafc"}`,
                }}
              >
                <MapContainer
                  center={[20.64, -103.33]}
                  zoom={11}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <GeoJSON data={COLONIAS_GEOJSON} style={geoJsonStyle} />
                  {(data.hotspots ?? []).map((h, i) => (
                    <Circle
                      key={i}
                      center={[Number(h.lat), Number(h.lng)]}
                      radius={Math.max(50, Number(h.intensity) * 120)}
                      pathOptions={{
                        color: "#ef4444",
                        fillColor: "#ef4444",
                        fillOpacity: 0.35,
                        weight: 0,
                      }}
                    >
                      <MapTooltip>
                        ZONA CRÍTICA: {h.intensity} alertas
                      </MapTooltip>
                    </Circle>
                  ))}
                </MapContainer>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="p-6 bg-slate-900 dark:bg-slate-800/80 rounded-[2rem] text-white border dark:border-slate-700">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4">
                  Análisis de Hotspots
                </h4>
                <p className="text-sm font-medium leading-relaxed opacity-80">
                  Se han detectado{" "}
                  <span className="text-red-400 font-black">
                    {data.hotspots?.length} áreas
                  </span>{" "}
                  de reincidencia alta en el perímetro.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    Vigilancia en tiempo real
                  </span>
                </div>

                <button
                  onClick={() => setShowRiskMap(true)}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-red-500 hover:bg-red-600 active:scale-95 transition-all text-white text-[11px] font-black uppercase tracking-widest"
                >
                  <Shield size={14} />
                  Ver zonas de riesgo
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    </>
  );
}