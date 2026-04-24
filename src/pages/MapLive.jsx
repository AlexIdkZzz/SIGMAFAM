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
import { PageShell, Card, Pill, Button } from "./_ui";
import { useAlerts } from "../app/alerts/AlertsContext";

// StatusPill mejorado con el estilo del sistema
function StatusPill({ status }) {
  const configs = {
    ACTIVE:   { color: "bg-red-500", text: "text-red-500", bg: "bg-red-50", label: "ACTIVA" },
    RECEIVED: { color: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50", label: "RECIBIDA" },
    ATTENDED: { color: "bg-sky-500", text: "text-sky-600", bg: "bg-sky-50", label: "ATENDIDA" },
    CLOSED:   { color: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50", label: "CERRADA" },
  };
  const c = configs[status] || { color: "bg-slate-400", text: "text-slate-500", bg: "bg-slate-50", label: "—" };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${c.bg} ${c.text} border-current/10`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.color} animate-pulse`} />
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshActive} 
            disabled={loading}
            className="group active:scale-95 transition-all"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            {loading ? "Sincronizando..." : "Actualizar"}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-220px)] min-h-[600px]">
        
        {/* PANEL IZQUIERDO: LISTADO (1 columna) */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Alertas Activas</h3>
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg">{alerts.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {alerts.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-300">
                  <Radio size={24} />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Sin actividad</p>
              </div>
            ) : (
              alerts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => selectAlert(a.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 group relative overflow-hidden ${
                    selected?.id === a.id
                      ? "bg-slate-900 border-slate-900 shadow-xl shadow-slate-200 -translate-y-1"
                      : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className={`p-2 rounded-lg transition-colors ${selected?.id === a.id ? "bg-white/10 text-white" : "bg-slate-50 text-slate-900"}`}>
                      <AlertTriangle size={16} />
                    </div>
                    <StatusPill status={a.status} />
                  </div>
                  
                  <div className="relative z-10">
                    <p className={`text-sm font-black tracking-tight mb-1 ${selected?.id === a.id ? "text-white" : "text-slate-900"}`}>
                      {a.user}
                    </p>
                    <p className={`text-[11px] font-medium flex items-center gap-1 ${selected?.id === a.id ? "text-slate-400" : "text-slate-500"}`}>
                      <Navigation size={10} /> {a.source}
                    </p>
                  </div>

                  {/* Decoración de fondo para el seleccionado */}
                  {selected?.id === a.id && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 blur-2xl" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* MAPA Y DETALLES (3 columnas) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex-1 bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm relative">
            <MapContainer 
              center={center} 
              zoom={15} 
              className="h-full w-full z-10"
              zoomControl={false}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ZoomControl position="bottomright" />
              {selected?.lastLocation && (
                <Marker position={[selected.lastLocation.lat, selected.lastLocation.lng]} />
              )}
            </MapContainer>

            {/* OVERLAY: Información flotante de la alerta seleccionada */}
            {selected && (
              <div className="absolute top-4 left-4 z-[20] w-72">
                <div className="bg-white/90 backdrop-blur-md border border-white p-5 rounded-[1.5rem] shadow-2xl shadow-slate-900/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                      <User className="text-white" size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ID Alerta #{selected.id}</p>
                      <p className="font-black text-slate-900 truncate">{selected.user}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <Battery size={12} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Batería</span>
                      </div>
                      <p className="text-sm font-black text-slate-900">{selected.battery ?? 'N/A'}%</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <MapPin size={12} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Señal</span>
                      </div>
                      <p className="text-sm font-black text-slate-900">Excelente</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold py-1 border-b border-slate-50">
                      <span className="text-slate-400">Latitud</span>
                      <span className="text-slate-900 font-mono">{selected.lastLocation?.lat.toFixed(6)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold py-1 border-b border-slate-50">
                      <span className="text-slate-400">Longitud</span>
                      <span className="text-slate-900 font-mono">{selected.lastLocation?.lng.toFixed(6)}</span>
                    </div>
                  </div>

                  <Button className="w-full mt-4 text-[11px] py-2.5 rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200">
                    Contactar Miembro
                  </Button>
                </div>
              </div>
            )}

            {!selected && (
              <div className="absolute inset-0 z-[20] pointer-events-none flex items-center justify-center">
                <div className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white shadow-xl flex items-center gap-3">
                  <Info className="text-blue-500" size={20} />
                  <p className="text-sm font-bold text-slate-900 tracking-tight">Selecciona una alerta en el panel izquierdo para rastrear</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}