import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { MapContainer, TileLayer } from "react-leaflet";
import { 
  TrendingUp, Activity, CheckCircle2, Clock, 
  BarChart3, Map as MapIcon
} from "lucide-react";
import { PageShell, Card } from "./_ui";
import { useAuth } from "../app/auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

const STATUS_THEME = {
  RECEIVED: { color: "#f59e0b", text: "text-amber-600 dark:text-amber-400" },
  ACTIVE:   { color: "#ef4444", text: "text-red-600 dark:text-red-400" },
  ATTENDED: { color: "#0ea5e9", text: "text-sky-600 dark:text-sky-400" },
  CLOSED:   { color: "#10b981", text: "text-emerald-600 dark:text-emerald-400" },
};

const STATUS_LABEL = {
  RECEIVED: "Recibida",
  ACTIVE:   "Activa",
  ATTENDED: "Atendida",
  CLOSED:   "Cerrada",
};

function MetricCard({ label, value, sub, color }) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#050a18] border border-slate-100 dark:border-slate-900 rounded-[2rem] p-6 shadow-xl dark:shadow-none transition-all duration-300 hover:-translate-y-1">
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
        <div className={`p-3 rounded-2xl ${colorClass}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function Stats() {
  const { token } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    if (!token) return;
    fetch(`${API_BASE}/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));

    return () => observer.disconnect();
  }, [token]);

  if (loading || !data) return <PageShell title="Estadísticas">...</PageShell>;

  const barData = (data.byDay ?? []).map((d) => ({
    day: new Date(d.day).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
    Alertas: Number(d.total),
  }));

  const statusMap = {};
  (data.byStatus ?? []).forEach((s) => { statusMap[s.status] = Number(s.total); });

  const mapCenter = data.hotspots?.length
    ? [Number(data.hotspots[0].lat), Number(data.hotspots[0].lng)]
    : [20.6736, -103.4053];

  function handleExportXML() {
    const generatedXml = generateStatsXML(data);
    setXml(generatedXml);
    setShowXML(true);
  }

  return (
    <PageShell title="Dashboard Operativo" subtitle="Análisis predictivo e histórico.">
      
      {/* 1. Métricas Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard label="Total Histórico" value={data.total} sub="+12%" icon={BarChart3} colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" borderSide="bg-indigo-500" />
        <MetricCard label="Activos" value={(statusMap.ACTIVE ?? 0) + (statusMap.RECEIVED ?? 0)} sub="Prioridad" icon={Activity} colorClass="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" borderSide="bg-red-500" />
        <MetricCard label="Resueltos" value={statusMap.CLOSED ?? 0} sub="98% éxito" icon={CheckCircle2} colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" borderSide="bg-emerald-500" />
        <MetricCard label="Latencia" value={`${data.avgResponseMinutes ?? 0}m`} sub="Promedio" icon={Clock} colorClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" borderSide="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 2. Tendencia (Gráfico) */}
        <div className="lg:col-span-2 chart-card-container">
          <Card title="Tendencia de Incidentes" icon={TrendingUp}>
            <div className="h-[350px] mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke={isDark ? "#1e293b" : "#cbd5e1"} strokeOpacity={0.3} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: isDark ? '#475569' : '#94a3b8' }} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: '#0f172a', color: '#fff' }}
                  />
                  <Bar dataKey="Alertas" radius={[10, 10, 10, 10]} barSize={32}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === barData.length - 1 ? '#3b82f6' : (isDark ? '#1e293b' : '#94a3b8')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* 3. Estado del Sistema */}
        <div className="status-card-container">
          <Card title="Estado del Sistema" icon={Activity}>
            <div className="space-y-6 mt-6">
              {(data.byStatus ?? []).map((s) => {
                const theme = STATUS_THEME[s.status] || { color: "#64748b", text: "text-slate-500" };
                const pct = data.total > 0 ? Math.round((s.total / data.total) * 100) : 0;
                return (
                  <div key={s.status}>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{s.status}</p>
                      <p className={`text-xs font-black ${theme.text}`}>{pct}%</p>
                    </div>
                    <div className="h-2 bg-slate-50 dark:bg-slate-900/50 rounded-full overflow-hidden border dark:border-slate-800/50">
                      <div className="h-full" style={{ width: `${pct}%`, backgroundColor: theme.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* 4. Zonificación y Análisis */}
      <div className="map-card-container">
        <Card title="Zonificación de Riesgo" icon={MapIcon}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
            <div className="lg:col-span-3">
              <div className="h-[450px] rounded-[2.5rem] overflow-hidden border-8 border-slate-50 dark:border-slate-900 bg-slate-100 dark:bg-[#050a18] relative">
                <div className="h-full w-full dark-map-filter">
                  <MapContainer center={[20.6736, -103.4053]} zoom={13} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  </MapContainer>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-[#0d1426] border border-slate-100 dark:border-slate-800 rounded-[2rem] transition-colors duration-300 h-fit">
               <h4 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-4 tracking-[0.2em]">Análisis</h4>
               <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Hotspots</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-red-400">{data.hotspots?.length || 0}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                      "Se observa un incremento de actividad en el sector noroccidente durante las últimas 24 horas."
                    </p>
                  </div>
               </div>
            </div>
          </Card>
        </div>

        <Card title="Mapa de calor — zonas con mayor incidencia">
          {data.hotspots?.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-8">Sin ubicaciones registradas aún.</div>
          ) : (
            <div className="h-[75vh] md:h-[420px] rounded-xl overflow-hidden border border-slate-100">
              <MapContainer center={mapCenter} zoom={13} className="h-full w-full">
                <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {(data.hotspots ?? []).map((h, i) => (
                  <Circle
                    key={i}
                    center={[Number(h.lat), Number(h.lng)]}
                    radius={Math.max(50, Number(h.intensity) * 80)}
                    pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: Math.min(0.7, 0.15 + Number(h.intensity) * 0.1), weight: 1 }}
                  >
                    <MapTooltip>{Number(h.intensity)} alerta{Number(h.intensity) !== 1 ? "s" : ""} en esta zona</MapTooltip>
                  </Circle>
                ))}
              </MapContainer>
            </div>
          )}
          <p className="text-xs text-slate-400 mt-2">
            Cada círculo representa una zona con alertas registradas. A mayor tamaño e intensidad, mayor reincidencia.
          </p>
        </Card>
      </div>

      <style>{`
        /* SOLUCIÓN RADICAL: Si el componente Card tiene bg-white hardcoded, esto lo anula */
        
        .dark .chart-card-container > div,
        .dark .status-card-container > div,
        .dark .map-card-container > div {
          background-color: #050a18 !important;
          border-color: #0f172a !important;
          color: white !important;
        }

        /* Forzar que los títulos de Card también sean blancos */
        .dark .chart-card-container h2, 
        .dark .status-card-container h2,
        .dark .map-card-container h2,
        .dark .chart-card-container h3,
        .dark .status-card-container h3 {
          color: white !important;
        }

        .dark .dark-map-filter .leaflet-tile-pane {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        
        .dark .leaflet-container {
          background: #050a18 !important;
        }
      `}</style>
    </PageShell>
  );
}