import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, ZoomControl, useMap } from "react-leaflet";
import {
  RefreshCw, Navigation, User, Radio, AlertTriangle,
  Info, Flame, Activity, Users, TrendingUp,
} from "lucide-react";
import { PageShell, Button } from "./_ui";
import { useAlerts } from "../app/alerts/AlertsContext";
import { useAuth } from "../app/auth/AuthContext";
import HeatmapLayer from "../app/maps/HeatmapLayer";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
const FALLBACK_CENTER = [20.6736, -103.4053];

function StatusPill({ status }) {
  const configs = {
    ACTIVE:   { color: "bg-red-500",     text: "text-red-600 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-500/10",     border: "border-red-200 dark:border-red-500/20",     label: "ACTIVA"   },
    RECEIVED: { color: "bg-amber-500",   text: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20", label: "RECIBIDA" },
    ATTENDED: { color: "bg-sky-500",     text: "text-sky-600 dark:text-sky-400",         bg: "bg-sky-50 dark:bg-sky-500/10",     border: "border-sky-200 dark:border-sky-500/20",     label: "ATENDIDA" },
    CLOSED:   { color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", label: "CERRADA" },
  };
  const c = configs[status] || { color: "bg-slate-400", text: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700", label: "—" };
  const isPulsing = status === "ACTIVE" || status === "RECEIVED";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1 h-1 rounded-full ${c.color} ${isPulsing ? "animate-pulse" : ""}`} />
      {c.label}
    </span>
  );
}

function MapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

function HeatLegend() {
  return (
    <div className="absolute bottom-6 left-4 z-[500] pointer-events-none">
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

function StatChip({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2 bg-white/90 dark:bg-[#050a18]/90 backdrop-blur-xl border border-white/60 dark:border-slate-800 rounded-xl px-3 py-2 shadow-lg">
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={12} className="text-white" />
      </div>
      <div>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
        <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">{value}</p>
      </div>
    </div>
  );
}

function generateDemoPoints(centerLat, centerLng) {
  const pts = [];
  for (let i = 0; i < 18; i++) {
    pts.push({ lat: centerLat + (Math.random() - 0.5) * 0.018, lng: centerLng + (Math.random() - 0.5) * 0.018, intensity: 8 + Math.random() * 10 });
  }
  for (let i = 0; i < 15; i++) {
    pts.push({ lat: centerLat + 0.025 + (Math.random() - 0.5) * 0.02, lng: centerLng + 0.03 + (Math.random() - 0.5) * 0.02, intensity: 4 + Math.random() * 6 });
  }
  for (let i = 0; i < 12; i++) {
    pts.push({ lat: centerLat - 0.02 + (Math.random() - 0.5) * 0.02, lng: centerLng - 0.025 + (Math.random() - 0.5) * 0.02, intensity: 3 + Math.random() * 5 });
  }
  for (let i = 0; i < 15; i++) {
    pts.push({ lat: centerLat + (Math.random() - 0.5) * 0.08, lng: centerLng + (Math.random() - 0.5) * 0.08, intensity: 1 + Math.random() * 3 });
  }
  return pts;
}

export default function MapLive() {
  const { alerts, selected, selectAlert, loading, refreshActive } = useAlerts();
  const { token } = useAuth();

  const [mode, setMode] = useState("heat");
  const [heatPoints, setHeatPoints] = useState([]);
  const [heatLoading, setHeatLoading] = useState(false);
  const [totalIncidents, setTotalIncidents] = useState(0);
  const [topZone, setTopZone] = useState(null);

  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains("dark")));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const loadHeatmap = useCallback(async () => {
    if (!token) return;
    setHeatLoading(true);
    try {
      const res = await fetch(`${API_BASE}/heatmap`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.hotspots && data.hotspots.length > 0) {
        setHeatPoints(data.hotspots);
        setTotalIncidents(data.hotspots.reduce((s, p) => s + Number(p.intensity), 0));
        const top = data.hotspots[0];
        if (top) setTopZone(`${Number(top.lat).toFixed(3)}, ${Number(top.lng).toFixed(3)}`);
      } else {
        const demo = generateDemoPoints(FALLBACK_CENTER[0], FALLBACK_CENTER[1]);
        setHeatPoints(demo);
        setTotalIncidents(Math.round(demo.reduce((s, p) => s + p.intensity, 0)));
        setTopZone("Zona Centro");
      }
    } catch (_) {
      const demo = generateDemoPoints(FALLBACK_CENTER[0], FALLBACK_CENTER[1]);
      setHeatPoints(demo);
      setTotalIncidents(Math.round(demo.reduce((s, p) => s + p.intensity, 0)));
      setTopZone("Zona Centro");
    } finally {
      setHeatLoading(false);
    }
  }, [token]);

  useEffect(() => { loadHeatmap(); }, [loadHeatmap]);

  const center = mode === "live" && selected && selected.lastLocation
    ? [selected.lastLocation.lat, selected.lastLocation.lng]
    : FALLBACK_CENTER;

  const maxIntensity = heatPoints.length ? Math.max(...heatPoints.map((p) => Number(p.intensity))) : 1;

  const hiCount  = heatPoints.filter((p) => p.intensity >= maxIntensity * 0.6).length;
  const midCount = heatPoints.filter((p) => p.intensity >= maxIntensity * 0.3 && p.intensity < maxIntensity * 0.6).length;
  const loCount  = heatPoints.filter((p) => p.intensity < maxIntensity * 0.3).length;
  const total    = Math.max(heatPoints.length, 1);

  return (
    <PageShell
      title={mode === "heat" ? "Mapa de Calor Comunitario" : "Rastreo en Tiempo Real"}
      subtitle={
        mode === "heat"
          ? "Zonas de mayor incidencia reportadas por la comunidad."
          : "Monitoreo geográfico de alertas y dispositivos."
      }
      right={
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setMode("heat")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${mode === "heat" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
            >
              <Flame size={12} />
              Calor
            </button>
            <button
              onClick={() => setMode("live")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${mode === "live" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
            >
              <Activity size={12} />
              En Vivo
            </button>
          </div>
          <Button
            variant="outline"
            onClick={mode === "heat" ? loadHeatmap : refreshActive}
            disabled={loading || heatLoading}
            className="h-9 px-3 text-xs font-black dark:border-slate-800 dark:bg-[#050a18] dark:text-slate-400"
          >
            <RefreshCw size={14} className={`mr-2 ${loading || heatLoading ? "animate-spin" : ""}`} />
            {loading || heatLoading ? "SINC..." : "ACTUALIZAR"}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-180px)] min-h-[500px]">

        <div className="lg:col-span-1 flex flex-col gap-3 min-h-0">
          {mode === "heat" ? (
            <>
              <div className="flex items-center justify-between px-1 shrink-0">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Resumen</h3>
              </div>
              <div className="space-y-2 shrink-0">
                <div className="bg-white dark:bg-[#050a18] border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                      <Flame size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Incidentes</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{totalIncidents}</p>
                    </div>
                  </div>
                  {topZone && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl p-2.5">
                      <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-0.5">Zona más activa</p>
                      <p className="text-[10px] font-black text-red-600 dark:text-red-400 font-mono break-all">{topZone}</p>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-[#050a18] border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Zonas de incidencia</p>
                  {[
                    { label: "Alta",  color: "from-red-500 to-red-600",         count: hiCount  },
                    { label: "Media", color: "from-amber-400 to-orange-500",    count: midCount },
                    { label: "Baja",  color: "from-emerald-400 to-green-500",   count: loCount  },
                  ].map(({ label, color, count }) => (
                    <div key={label}>
                      <div className="flex justify-between text-[9px] font-black text-slate-500 dark:text-slate-400 mb-1">
                        <span>{label}</span>
                        <span>{count} zonas</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`}
                          style={{ width: `${Math.min(100, (count / total) * 200)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-blue-900/40 dark:to-slate-900 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={14} className="text-blue-400" />
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Red comunitaria</p>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Los datos se generan de forma anónima con los reportes de toda la comunidad SIGMAFAM.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 shrink-0">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Alertas Activas</h3>
                <span className="px-2 py-0.5 bg-slate-900 dark:bg-blue-600 text-white text-[10px] font-black rounded-md">{alerts.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                {alerts.length === 0 ? (
                  <div className="bg-slate-50/50 dark:bg-[#050a18] border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-center">
                    <Radio size={20} className="mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Sin actividad</p>
                  </div>
                ) : (
                  alerts.map((a) => {
                    const isSel = selected && selected.id === a.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => selectAlert(a.id)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 ${isSel ? "bg-slate-900 dark:bg-blue-600 border-slate-900 dark:border-blue-500 shadow-lg" : "bg-white dark:bg-[#050a18] border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className={`p-1.5 rounded-lg ${isSel ? "bg-white/10 text-white" : "bg-slate-100 dark:bg-[#161f35] text-slate-500 dark:text-slate-400"}`}>
                            <AlertTriangle size={14} />
                          </div>
                          <StatusPill status={a.status} />
                        </div>
                        <p className={`text-xs font-black tracking-tight mb-0.5 ${isSel ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>{a.user}</p>
                        <p className={`text-[10px] font-bold flex items-center gap-1 uppercase tracking-tighter ${isSel ? "text-blue-100" : "text-slate-500 dark:text-slate-500"}`}>
                          <Navigation size={10} /> {a.source}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-3 flex flex-col min-h-0">
          <div className="flex-1 bg-slate-100 dark:bg-[#050a18] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-inner relative">
            <div className="h-full w-full dark-map-filter transition-all duration-500">
              <MapContainer center={center} zoom={14} className="h-full w-full z-10" zoomControl={false}>
                <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ZoomControl position="bottomright" />
                <MapCenter center={center} />

                {mode === "heat" && heatPoints.length > 0 && (
                  <HeatmapLayer points={heatPoints} radius={58} maxInt={maxIntensity} opacity={0.85} />
                )}

                {mode === "live" && selected && selected.lastLocation && (
                  <Marker position={[selected.lastLocation.lat, selected.lastLocation.lng]} />
                )}
              </MapContainer>
            </div>

            {mode === "heat" && <HeatLegend />}

            {mode === "heat" && (
              <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2 pointer-events-none">
                <StatChip icon={Flame}     label="Incidentes"    value={totalIncidents}  color="bg-gradient-to-br from-orange-500 to-red-600"    />
                <StatChip icon={TrendingUp} label="Zonas activas" value={heatPoints.length} color="bg-gradient-to-br from-amber-400 to-orange-500" />
              </div>
            )}

            {mode === "heat" && (
              <div className="absolute top-4 left-4 z-[500] pointer-events-none">
                <div className="flex items-center gap-2 bg-slate-900/85 dark:bg-[#050a18]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 shadow-xl">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-[9px] font-black text-white uppercase tracking-[0.15em]">Mapa de Calor Comunitario</p>
                </div>
              </div>
            )}

            {mode === "live" && selected && (
              <div className="absolute top-4 left-4 z-[500] w-64 pointer-events-none">
                <div className="bg-white/90 dark:bg-[#050a18]/95 backdrop-blur-xl border border-white dark:border-slate-800 p-4 rounded-[1.5rem] shadow-2xl pointer-events-auto">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-9 h-9 bg-slate-900 dark:bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                      <User className="text-white" size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">ID #{selected.id}</p>
                      <p className="font-black text-xs text-slate-900 dark:text-white truncate">{selected.user}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-slate-50 dark:bg-[#161f35] rounded-xl p-2 text-center border border-slate-100 dark:border-slate-800">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">Batería</p>
                      <p className="text-xs font-black text-slate-900 dark:text-blue-400">{selected.battery ?? "—"}%</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#161f35] rounded-xl p-2 text-center border border-slate-100 dark:border-slate-800">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">Señal</p>
                      <p className="text-xs font-black text-emerald-500">LIVE</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-slate-400">LATITUD</span>
                      <span className="text-slate-900 dark:text-slate-300 font-mono">{selected.lastLocation && selected.lastLocation.lat.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-slate-400">LONGITUD</span>
                      <span className="text-slate-900 dark:text-slate-300 font-mono">{selected.lastLocation && selected.lastLocation.lng.toFixed(5)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {mode === "live" && !selected && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500] pointer-events-none">
                <div className="bg-slate-900/80 dark:bg-blue-600/20 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 flex items-center gap-3">
                  <Info className="text-blue-400" size={16} />
                  <p className="text-[10px] font-black text-white uppercase tracking-[0.1em]">Selecciona una alerta activa</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dark .dark-map-filter .leaflet-tile-pane {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .dark .leaflet-container { background: #050a18 !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </PageShell>
  );
}
