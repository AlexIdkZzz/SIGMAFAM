import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { MapContainer, TileLayer, Circle, Tooltip as MapTooltip } from "react-leaflet";
import { 
  TrendingUp, Activity, CheckCircle2, Clock, 
  AlertCircle, BarChart3, Map as MapIcon
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

function MetricCard({ label, value, sub, icon: Icon, colorClass, borderSide }) {
  return (
    <div className={`relative overflow-hidden bg-white dark:bg-[#0d1426] border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none group transition-all duration-300 hover:-translate-y-1`}>
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

export default function Stats() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Forzamos el check del tema
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    if (!token) return;
    fetch(`${API_BASE}/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setData(d); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    return () => observer.disconnect();
  }, [token]);

  if (loading || error) return <PageShell title="Estadísticas">...</PageShell>;

  const barData = (data.byDay ?? []).map((d) => ({
    day: new Date(d.day).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
    Alertas: Number(d.total),
  }));

  const statusMap = {};
  (data.byStatus ?? []).forEach((s) => { statusMap[s.status] = Number(s.total); });

  return (
    <PageShell title="Dashboard Operativo" subtitle="Análisis predictivo e histórico.">
      
      {/* 1. Métricas con BG corregido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard label="Total Histórico" value={data.total} sub="+12%" icon={BarChart3} colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" borderSide="bg-indigo-500" />
        <MetricCard label="Activos" value={(statusMap.ACTIVE ?? 0) + (statusMap.RECEIVED ?? 0)} sub="Prioridad" icon={Activity} colorClass="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" borderSide="bg-red-500" />
        <MetricCard label="Resueltos" value={statusMap.CLOSED ?? 0} sub="98% éxito" icon={CheckCircle2} colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" borderSide="bg-emerald-500" />
        <MetricCard label="Latencia" value={`${data.avgResponseMinutes ?? 0}m`} sub="Promedio" icon={Clock} colorClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" borderSide="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 2. Gráfico de Barras con colores dinámicos */}
        <div className="lg:col-span-2">
          <Card title="Tendencia de Incidentes" icon={TrendingUp} className="dark:bg-[#0d1426] dark:border-slate-800">
            <div className="h-[350px] mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke={isDark ? "#1e293b" : "#cbd5e1"} strokeOpacity={0.5} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: isDark ? '#475569' : '#94a3b8' }} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: isDark ? '#1e293b' : '#0f172a', color: '#fff' }}
                  />
                  <Bar dataKey="Alertas" radius={[10, 10, 10, 10]} barSize={32}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === barData.length - 1 ? '#3b82f6' : (isDark ? '#334155' : '#94a3b8')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* 3. Estado del Sistema */}
        <Card title="Estado del Sistema" icon={Activity} className="dark:bg-[#0d1426] dark:border-slate-800">
          <div className="space-y-6 mt-6">
            {(data.byStatus ?? []).map((s) => {
              const theme = STATUS_THEME[s.status] || { color: "#64748b", text: "text-slate-500" };
              const pct = data.total > 0 ? Math.round((s.total / data.total) * 100) : 0;
              return (
                <div key={s.status}>
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{s.status}</p>
                    <p className={`text-xs font-black ${theme.text}`}>{pct}%</p>
                  </div>
                  <div className="h-2 bg-slate-50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: theme.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 4. Mapa Oscuro Real */}
      <Card title="Zonificación de Riesgo" icon={MapIcon} className="dark:bg-[#0d1426] dark:border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
          <div className="lg:col-span-3">
            <div className="h-[450px] rounded-[2.5rem] overflow-hidden border-8 border-slate-50 dark:border-slate-800 relative bg-slate-100 dark:bg-[#050a18]">
              <div className="h-full w-full dark-map-filter transition-all duration-500">
                <MapContainer center={[20.6736, -103.4053]} zoom={13} className="h-full w-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {/* ... círculos ... */}
                </MapContainer>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-900 dark:bg-[#161f35] rounded-[2rem] text-white">
             <h4 className="text-xs font-black uppercase text-slate-500 mb-4">Análisis</h4>
             <p className="text-sm opacity-80">Hotspots detectados: <span className="text-red-400 font-black">{data.hotspots?.length}</span></p>
          </div>
        </div>
      </Card>

      <style>{`
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