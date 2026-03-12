import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { MapContainer, TileLayer, Circle, Tooltip as MapTooltip } from "react-leaflet";
import { PageShell, Card } from "./_ui";
import { useAuth } from "../app/auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

const STATUS_COLOR = {
  RECEIVED: "#f59e0b",
  ACTIVE:   "#ef4444",
  ATTENDED: "#3b82f6",
  CLOSED:   "#10b981",
};

const STATUS_LABEL = {
  RECEIVED: "Recibida",
  ACTIVE:   "Activa",
  ATTENDED: "Atendida",
  CLOSED:   "Cerrada",
};

function MetricCard({ label, value, sub, color }) {
  return (
    <div
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-3xl font-extrabold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function Stats() {
  const { token } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!token) return;
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

  if (loading)
    return (
      <PageShell title="Estadísticas" subtitle="Cargando datos...">
        <div className="flex items-center justify-center h-48 text-slate-400 gap-2">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
          Cargando estadísticas...
        </div>
      </PageShell>
    );

  if (error)
    return (
      <PageShell title="Estadísticas">
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      </PageShell>
    );

  // Preparar datos para la gráfica de barras
  const barData = (data.byDay ?? []).map((d) => ({
    day: new Date(d.day).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
    Alertas: Number(d.total),
  }));

  // Totales por estado como objeto
  const statusMap = {};
  (data.byStatus ?? []).forEach((s) => { statusMap[s.status] = Number(s.total); });

  // Centro del mapa de calor
  const mapCenter = data.hotspots?.length
    ? [Number(data.hotspots[0].lat), Number(data.hotspots[0].lng)]
    : [20.6736, -103.4053];

  return (
    <PageShell
      title="Estadísticas"
      subtitle="Panel de monitoreo operativo del sistema."
    >
      {/* ── Métricas principales ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Total de alertas"
          value={data.total}
          sub="Desde el inicio"
          color="#6366f1"
        />
        <MetricCard
          label="Alertas activas"
          value={(statusMap.ACTIVE ?? 0) + (statusMap.RECEIVED ?? 0)}
          sub="En este momento"
          color="#ef4444"
        />
        <MetricCard
          label="Alertas cerradas"
          value={statusMap.CLOSED ?? 0}
          sub="Resueltas"
          color="#10b981"
        />
        <MetricCard
          label="Tiempo promedio"
          value={`${data.avgResponseMinutes ?? 0} min`}
          sub="De respuesta"
          color="#f59e0b"
        />
      </div>

      {/* ── Gráfica de incidencias por día ── */}
      <Card title="Incidencias por día — últimos 30 días">
        {barData.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-8">
            Sin datos en los últimos 30 días.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="Alertas" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ── Distribución por estado + Origen ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card title="Distribución por estado">
          <div className="space-y-2 mt-1">
            {(data.byStatus ?? []).map((s) => {
              const pct = data.total > 0 ? Math.round((s.total / data.total) * 100) : 0;
              return (
                <div key={s.status}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{STATUS_LABEL[s.status] ?? s.status}</span>
                    <span className="font-semibold">{s.total} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: STATUS_COLOR[s.status] ?? "#6366f1",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Origen de alertas">
          <div className="space-y-2 mt-1">
            {(data.bySource ?? []).map((s) => {
              const pct = data.total > 0 ? Math.round((s.total / data.total) * 100) : 0;
              return (
                <div key={s.source}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{s.source === "IOT" ? "📡 Dispositivo" : "🌐 Web"}</span>
                    <span className="font-semibold">{s.total} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: s.source === "IOT" ? "#6366f1" : "#3b82f6",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Mapa de calor ── */}
      <Card title="Mapa de calor — zonas con mayor incidencia">
        {data.hotspots?.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-8">
            Sin ubicaciones registradas aún.
          </div>
        ) : (
          <div className="h-[420px] rounded-xl overflow-hidden border border-slate-100">
            <MapContainer center={mapCenter} zoom={13} className="h-full w-full">
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {(data.hotspots ?? []).map((h, i) => (
                <Circle
                  key={i}
                  center={[Number(h.lat), Number(h.lng)]}
                  radius={Math.max(50, Number(h.intensity) * 80)}
                  pathOptions={{
                    color: "#ef4444",
                    fillColor: "#ef4444",
                    fillOpacity: Math.min(0.7, 0.15 + Number(h.intensity) * 0.1),
                    weight: 1,
                  }}
                >
                  <MapTooltip>
                    {Number(h.intensity)} alerta{Number(h.intensity) !== 1 ? "s" : ""} en esta zona
                  </MapTooltip>
                </Circle>
              ))}
            </MapContainer>
          </div>
        )}
        <p className="text-xs text-slate-400 mt-2">
          Cada círculo representa una zona con alertas registradas. A mayor tamaño e intensidad, mayor reincidencia.
        </p>
      </Card>
    </PageShell>
  );
}