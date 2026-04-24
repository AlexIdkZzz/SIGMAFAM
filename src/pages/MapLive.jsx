import React from "react";
import { MapContainer, TileLayer, Marker, ZoomControl } from "react-leaflet";
import {
  Map as MapIcon,
  RefreshCw,
  Navigation,
  Battery,
  User,
  Radio,
  MapPin,
  AlertTriangle,
  Info
} from "lucide-react";
import { PageShell, Card, Button } from "./_ui";
import { useAlerts } from "../app/alerts/AlertsContext";

function StatusPill({ status }) {
  const configs = {
    ACTIVE:   { color: "bg-red-500", text: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/20", label: "ACTIVA" },
    RECEIVED: { color: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20", label: "RECIBIDA" },
    ATTENDED: { color: "bg-sky-500", text: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/10", border: "border-sky-200 dark:border-sky-500/20", label: "ATENDIDA" },
    CLOSED:   { color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", label: "CERRADA" },
  };
  const c = configs[status] || { color: "bg-slate-400", text: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700", label: "—" };
  const isPulsing = status === "ACTIVE" || status === "RECEIVED";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1 h-1 rounded-full ${c.color} ${isPulsing ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  );
}

const FALLBACK_CENTER = [20.6736, -103.4053];

export default function MapLive() {
  const { alerts, selected, selectAlert, loading, refreshActive } = useAlerts();

  const center = selected?.lastLocation
    ? [selected.lastLocation.lat, selected.lastLocation.lng]
    : FALLBACK_CENTER;

  return (
    <PageShell
      title="Rastreo en Tiempo Real"
      subtitle="Monitoreo geográfico de alertas y dispositivos."
      right={
        <Button
          variant="outline"
          onClick={refreshActive}
          disabled={loading}
          className="h-9 px-3 text-xs font-black dark:border-slate-800 dark:bg-[#0a0f1e] dark:text-slate-400"
        >
          <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? "SINC..." : "ACTUALIZAR"}
        </Button>
      }
    >
      {/* Contenedor principal ajustado para evitar scroll vertical */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-180px)] min-h-[500px]">
        
        {/* PANEL IZQUIERDO */}
        <div className="lg:col-span-1 flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between px-1 shrink-0">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Alertas Activas</h3>
            <span className="px-2 py-0.5 bg-slate-900 dark:bg-blue-600 text-white text-[10px] font-black rounded-md">{alerts.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {alerts.length === 0 ? (
              <div className="bg-slate-50/50 dark:bg-[#0a0f1e]/50 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-6 text-center">
                <Radio size={20} className="mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Sin actividad</p>
              </div>
            ) : (
              alerts.map((a) => {
                const isSelected = selected?.id === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => selectAlert(a.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 group relative overflow-hidden ${
                      isSelected
                        ? "bg-slate-900 dark:bg-blue-600 border-slate-900 dark:border-blue-500 shadow-lg shadow-blue-900/20"
                        : "bg-white dark:bg-[#0d1426] border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2 relative z-10">
                      <div className={`p-1.5 rounded-lg ${isSelected ? "bg-white/10 text-white" : "bg-slate-100 dark:bg-[#161f35] text-slate-500 dark:text-slate-400"}`}>
                        <AlertTriangle size={14} />
                      </div>
                      <StatusPill status={a.status} />
                    </div>
                    
                    <div className="relative z-10">
                      <p className={`text-xs font-black tracking-tight mb-0.5 ${isSelected ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
                        {a.user}
                      </p>
                      <p className={`text-[10px] font-bold flex items-center gap-1 uppercase tracking-tighter ${isSelected ? "text-blue-100" : "text-slate-500 dark:text-slate-500"}`}>
                        <Navigation size={10} /> {a.source}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* MAPA */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <div className="flex-1 bg-slate-100 dark:bg-[#0a0f1e] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-inner relative group">
            <MapContainer
              center={center}
              zoom={15}
              className="h-full w-full z-10 dark-map-container"
              zoomControl={false}
            >
              {/* Filtro CSS aplicado al TileLayer mediante una clase en el MapContainer */}
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ZoomControl position="bottomright" />
              {selected?.lastLocation && (
                <Marker position={[selected.lastLocation.lat, selected.lastLocation.lng]} />
              )}
            </MapContainer>

            {/* OVERLAY INFO: Ajustado para no tapar mucho espacio */}
            {selected && (
              <div className="absolute top-4 left-4 z-[20] w-64 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
                <div className="bg-white/90 dark:bg-[#0d1426]/90 backdrop-blur-xl border border-white dark:border-white/5 p-4 rounded-[1.5rem] shadow-2xl pointer-events-auto">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-white/5">
                    <div className="w-9 h-9 bg-slate-900 dark:bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                      <User className="text-white" size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">ID #{selected.id}</p>
                      <p className="font-black text-xs text-slate-900 dark:text-white truncate">{selected.user}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-slate-50 dark:bg-[#161f35] rounded-xl p-2 text-center border border-slate-100 dark:border-white/5">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">Batería</p>
                      <p className="text-xs font-black text-slate-900 dark:text-blue-400">{selected.battery ?? '—'}%</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#161f35] rounded-xl p-2 text-center border border-slate-100 dark:border-white/5">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">Señal</p>
                      <p className="text-xs font-black text-slate-900 dark:text-emerald-500 text-[10px]">LIVE</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-slate-400">LATITUD</span>
                      <span className="text-slate-900 dark:text-slate-300 font-mono">{selected.lastLocation?.lat.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-slate-400">LONGITUD</span>
                      <span className="text-slate-900 dark:text-slate-300 font-mono">{selected.lastLocation?.lng.toFixed(5)}</span>
                    </div>
                  </div>

                  <Button className="w-full h-8 text-[10px] font-black rounded-lg bg-slate-900 dark:bg-white dark:text-slate-900 uppercase tracking-wider">
                    Contactar
                  </Button>
                </div>
              </div>
            )}

            {!selected && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[20] pointer-events-none">
                <div className="bg-slate-900/80 dark:bg-blue-600/20 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 flex items-center gap-3">
                  <Info className="text-blue-400" size={16} />
                  <p className="text-[10px] font-black text-white uppercase tracking-[0.1em]">Selecciona una alerta activa</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS INYECTADO PARA EL MAPA OSCURO */}
      <style>{`
        .dark-map-container .leaflet-tile-pane {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .dark-map-container .leaflet-container {
          background: #0a0f1e;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
      `}</style>
    </PageShell>
  );
}