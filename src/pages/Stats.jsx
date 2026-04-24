import React, { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  MapContainer, TileLayer, Circle, Tooltip as MapTooltip, GeoJSON
} from "react-leaflet";
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

// ── GeoJSON ───────────────────────────────────────────────
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

// ── MetricCard ────────────────────────────────────────────
function MetricCard({ label, value, sub, icon: Icon, colorClass, borderSide }) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-xl">
      {/* CORREGIDO: Sintaxis de template literal con llaves */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${borderSide}`} />
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
          <p className="text-4xl font-black">{value}</p>
          {sub && <p className="text-[11px] font-bold text-slate-400 mt-1">{sub}</p>}
        </div>
        {/* CORREGIDO: Sintaxis de template literal con llaves */}
        <div className={`p-3 rounded-2xl ${colorClass}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

// ── Overlay ───────────────────────────────────────────────
function RiskMapOverlay({ hotspots, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#020617", display: "flex", flexDirection: "column" }}>

      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 24px", background: "#0f172a" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={18} color="#94a3b8" />
        </button>
        <Shield size={15} color="#f87171" />
        <span style={{ color: "#fff", fontWeight: 800 }}>Zonas de Riesgo</span>
      </div>

      <div style={{ flex: 1 }}>
        <MapContainer
          center={[
            COLONIAS_GEOJSON.features[0].geometry.coordinates[0][0][1],
            COLONIAS_GEOJSON.features[0].geometry.coordinates[0][0][0]
          ]}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <GeoJSON data={COLONIAS_GEOJSON} style={geoJsonStyle} />

          {(hotspots ?? [])
            .filter(h => !isNaN(Number(h.lat)) && !isNaN(Number(h.lng)))
            .map((h, i) => {
              const intensity = Number(h.intensity) || 0;

              return (
                <Circle
                  key={i}
                  center={[Number(h.lat), Number(h.lng)]}
                  radius={Math.max(50, intensity * 120)}
                  pathOptions={{
                    color: "#ef4444",
                    fillColor: "#ef4444",
                    fillOpacity: Math.max(0.1, Math.min(0.35, intensity * 0.05)),
                    weight: 0
                  }}
                >
                  <MapTooltip>ZONA CRÍTICA: {intensity} alertas</MapTooltip>
                </Circle>
              );
            })}
        </MapContainer>
      </div>
    </div>
  );
}

// ── Stats ────────────────────────────────────────────────
export default function Stats() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRiskMap, setShowRiskMap] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    setIsDark(document.documentElement.classList.contains("dark"));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!token) return;
    {/* CORREGIDO: Backticks y sintaxis Bearer */}
    fetch(`${API_BASE}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading || error) return <PageShell title="Estadísticas" />;

  const barData = (data.byDay ?? []).map(d => ({
    day: new Date(d.day).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
    Alertas: Number(d.total),
  }));

  const statusMap = {};
  (data.byStatus ?? []).forEach(s => {
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

      <PageShell title="Dashboard Operativo">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2">
            <Card title="Tendencia">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Alertas">
                    {barData.map((_, i) => (
                      <Cell key={i} fill={i === barData.length - 1 ? "#3b82f6" : "#94a3b8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card title="Sistema">
            <div className="space-y-2">
              {Object.entries(statusMap).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-1">
                  <span className="text-xs font-bold text-slate-500">{k}</span>
                  <span className="text-sm font-black">{v}</span>
                </div>
              ))}
            </div>
          </Card>

        </div>

        <div className="mt-6">
          <Card title="Mapa de Incidencia">
            <div className="rounded-xl overflow-hidden" style={{ height: 400 }}>
              <MapContainer center={[20.64, -103.33]} zoom={11} style={{ height: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <GeoJSON data={COLONIAS_GEOJSON} style={geoJsonStyle} />

                {(data.hotspots ?? [])
                  .filter(h => !isNaN(Number(h.lat)) && !isNaN(Number(h.lng)))
                  .map((h, i) => (
                    <Circle
                      key={i}
                      center={[Number(h.lat), Number(h.lng)]}
                      radius={150}
                      pathOptions={{ color: '#ef4444', weight: 1 }}
                    />
                  ))}
              </MapContainer>
            </div>

            <button 
              onClick={() => setShowRiskMap(true)}
              className="mt-4 w-full py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
            >
              Ver mapa de riesgo detallado
            </button>
          </Card>
        </div>

      </PageShell>
    </>
  );
}