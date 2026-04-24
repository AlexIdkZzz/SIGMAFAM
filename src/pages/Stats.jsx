import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { MapContainer, TileLayer, Circle, Tooltip as MapTooltip } from "react-leaflet";
import { 
  TrendingUp, Activity, CheckCircle2, Clock, 
  Download, FileCode, AlertCircle, BarChart3, Map as MapIcon
} from "lucide-react";
import { PageShell, Card, Button } from "./_ui";
import { useAuth } from "../app/auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

// Paleta adaptada para que resalte en ambos temas
const STATUS_THEME = {
  RECEIVED: { color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  ACTIVE:   { color: "#ef4444", bg: "bg-red-50 dark:bg-red-500/10",   text: "text-red-600 dark:text-red-400" },
  ATTENDED: { color: "#0ea5e9", bg: "bg-sky-50 dark:bg-sky-500/10",   text: "text-sky-600 dark:text-sky-400" },
  CLOSED:   { color: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
};

function MetricCard({ label, value, sub, icon: Icon, colorClass, borderSide }) {
  return (
    <div className={`relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none group transition-all duration-300 hover:-translate-y-1`}>
      <div className={`absolute top-0 left-0 w-1.5 h-full ${borderSide}`} />
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1 transition-colors">{label}</p>
          <p className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white transition-colors">{value}</p>
          {sub && (
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 transition-colors">
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
  function download() {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sigmafam-stats-${new Date().toISOString().slice(0, 10)}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 dark:bg-black/60 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] dark:shadow-black w-full max-w-3xl overflow-hidden flex flex-col border border-white dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 dark:bg-slate-100 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20 dark:shadow-white/10 transition-colors">
              <FileCode className="text-white dark:text-slate-900" size={24} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white tracking-tight transition-colors">Exportación de Datos</h3>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Protocolo XML v1.0</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={download} className="flex items-center gap-2 bg-slate-900 dark:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs hover:bg-slate-800 dark:hover:bg-blue-500 transition-all active:scale-95">
              <Download size={14} /> DESCARGAR
            </button>
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-black text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              CERRAR
            </button>
          </div>
        </div>
        <div className="flex-1 p-8 bg-[#0f172a] dark:bg-[#020617] overflow-hidden flex flex-col transition-colors">
          <div className="flex-1 overflow-auto rounded-2xl bg-black/20 p-6 custom-scrollbar border border-white/5">
            <pre className="text-[13px] font-mono text-cyan-400/90 whitespace-pre">
              {xml}
            </pre>
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
  const [showXML, setShowXML] = useState(false);
  const [xml, setXml] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/stats`, { headers: { Authorization: `Bearer ${token}` } })
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
                      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-3xl border border-red-100 dark:border-red-900/30 font-bold max-w-md text-center transition-colors">
                          <AlertCircle size={40} className="mx-auto mb-4 opacity-50" />
                          {error}
                      </div>
                  ) : (
                      <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 border-t-slate-900 dark:border-t-blue-500 rounded-full animate-spin transition-colors" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 transition-colors">Analizando registros</p>
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

  // Colores dinámicos para Recharts (depende de CSS variables en proyectos reales, aquí usamos unos neutros elegantes)
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <>
      {showXML && <XMLModal xml={xml} onClose={() => setShowXML(false)} />}

      <PageShell
        title="Dashboard Operativo"
        subtitle="Análisis predictivo e histórico de seguridad familiar."
        right={
          <Button 
            onClick={() => { setXml(generateStatsXML(data)); setShowXML(true); }} 
            className="bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 shadow-lg shadow-slate-200 dark:shadow-none transition-colors"
          >
            <FileCode size={16} className="mr-2" /> Exportar Reporte
          </Button>
        }
      >
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard 
            label="Total Histórico" value={data.total} sub="+12% vs mes anterior" icon={BarChart3} 
            colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" 
            borderSide="bg-indigo-500" 
          />
          <MetricCard 
            label="Atención Requerida" value={(statusMap.ACTIVE ?? 0) + (statusMap.RECEIVED ?? 0)} sub="Prioridad inmediata" icon={Activity} 
            colorClass="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" 
            borderSide="bg-red-500" 
          />
          <MetricCard 
            label="Casos Resueltos" value={statusMap.CLOSED ?? 0} sub="Tasa de éxito 98%" icon={CheckCircle2} 
            colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
            borderSide="bg-emerald-500" 
          />
          <MetricCard 
            label="Latencia Media" value={`${data.avgResponseMinutes ?? 0}m`} sub="Tiempo de respuesta" icon={Clock} 
            colorClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" 
            borderSide="bg-amber-500" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Gráfico de Barras Sigma */}
          <div className="lg:col-span-2">
            <Card title="Tendencia de Incidentes" icon={TrendingUp}>
              <div className="h-[350px] mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#cbd5e1" strokeOpacity={0.4} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} dy={10} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                      contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2)', fontWeight: 800 }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="Alertas" radius={[10, 10, 10, 10]} barSize={32}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === barData.length - 1 ? '#3b82f6' : '#94a3b8'} fillOpacity={index === barData.length - 1 ? 1 : 0.4} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Distribución de Estados */}
          <Card title="Estado del Sistema" icon={Activity}>
            <div className="space-y-6 mt-6">
              {(data.byStatus ?? []).map((s) => {
                const theme = STATUS_THEME[s.status] || { color: "#64748b", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" };
                const pct = data.total > 0 ? Math.round((s.total / data.total) * 100) : 0;
                return (
                  <div key={s.status} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1 transition-colors">{s.status}</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white transition-colors">{s.total} unidades</p>
                      </div>
                      <p className={`text-xs font-black ${theme.text} transition-colors`}>{pct}%</p>
                    </div>
                    <div className="h-3 bg-slate-50 dark:bg-slate-800/50 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800 p-0.5 transition-colors">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.05)]" 
                           style={{ width: `${pct}%`, backgroundColor: theme.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Mapa de Calor Sigma */}
        <Card title="Zonificación de Riesgo" icon={MapIcon}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
            <div className="lg:col-span-3">
              <div className="h-[450px] rounded-[2.5rem] overflow-hidden border-8 border-slate-50 dark:border-slate-800 shadow-inner relative transition-colors">
                
                {/* MAGIA NEGRA PARA EL MAPA: filtros CSS en la capa del contenedor */}
                <div className="h-full w-full grayscale-[0.2] dark:invert dark:hue-rotate-180 dark:brightness-95 dark:contrast-90 transition-all duration-500">
                  <MapContainer center={[20.6736, -103.4053]} zoom={13} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {(data.hotspots ?? []).map((h, i) => (
                      <Circle
                        key={i}
                        center={[Number(h.lat), Number(h.lng)]}
                        radius={Math.max(50, Number(h.intensity) * 120)}
                        pathOptions={{ 
                          color: "#ef4444", 
                          fillColor: "#ef4444", 
                          fillOpacity: 0.4, 
                          weight: 0 
                        }}
                      >
                        <MapTooltip className="sigma-tooltip">ZONA CRÍTICA: {h.intensity} alertas</MapTooltip>
                      </Circle>
                    ))}
                  </MapContainer>
                </div>
                
                {/* Overlay decorativo para el mapa */}
                <div className="absolute inset-0 pointer-events-none border-[1px] border-slate-900/5 dark:border-white/5 rounded-[2rem] z-[1000] transition-colors" />
              </div>
            </div>
            <div className="flex flex-col justify-center">
                <div className="p-6 bg-slate-900 dark:bg-slate-800 rounded-[2rem] text-white shadow-xl dark:shadow-none transition-colors">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4 transition-colors">Análisis de Hotspots</h4>
                    <p className="text-sm font-medium leading-relaxed opacity-80">
                        Se han detectado <span className="text-red-400 font-black">{data.hotspots?.length} áreas</span> de reincidencia alta.
                    </p>
                    <div className="mt-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Monitoreo Activo</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </Card>
      </PageShell>
    </>
  );
}

// ... Recuerda pegar aquí abajo tu función generateStatsXML() que tenías en el origina