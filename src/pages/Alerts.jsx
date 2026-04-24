import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Drawer from "./_drawer";
import ConfirmModal from "./_modal";
import { useAlerts } from "../app/alerts/AlertsContext";
import MiniMap from "../app/maps/MiniMap";
import {
  AlertTriangle, RefreshCw, Sparkles, Eye, MapPin, 
  XCircle, CheckCircle2, Cpu, Smartphone, Clock, Battery, Navigation
} from "lucide-react";

function fmtTime(iso) {
  try { return new Date(iso).toLocaleString("es-MX"); }
  catch { return iso; }
}

function StatusBadge({ status }) {
  const map = {
    ACTIVE:   { label: "ACTIVA",    styles: "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30", dot: "bg-red-500 animate-pulse" },
    RECEIVED: { label: "RECIBIDA",  styles: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30", dot: "bg-amber-500" },
    ATTENDED: { label: "ATENDIDA",  styles: "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/30", dot: "bg-sky-500" },
    CLOSED:   { label: "CERRADA",   styles: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30", dot: "bg-emerald-500" },
  };
  const s = map[status] ?? { label: status, styles: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600", dot: "bg-slate-500" };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${s.styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function SourceBadge({ source }) {
  const isIot = source === "IOT";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${isIot ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30" : "bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30"}`}>
      {isIot ? <Cpu size={10} /> : <Smartphone size={10} />}
      {source}
    </span>
  );
}

export default function Alerts() {
  const nav = useNavigate();
  const {
    alerts, selected, selectedId,
    loading, error,
    selectAlert, simulateIncomingAlert,
    markAttended, closeAlert, refreshActive,
  } = useAlerts();

  const [drawerOpen, setDrawerOpen] = useState(true);
  const [confirmClose, setConfirmClose] = useState(false);

  const activeCount = useMemo(
    () => alerts.filter((a) => a.status === "ACTIVE" || a.status === "RECEIVED").length,
    [alerts]
  );

  return (
    <div className="min-h-full w-full transition-colors duration-300 bg-slate-50 dark:bg-[#0a0f1e]">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6 animate-fadeInUp">
        
        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                <AlertTriangle size={12} className="text-red-500" />
                Centro de Control
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-100">
              Alertas Activas
            </h1>
            <p className="text-sm font-medium mt-1 text-slate-500 dark:text-slate-400">
              Gestiona y responde a emergencias del sistema. <span className="text-slate-900 dark:text-white font-bold">{activeCount} activas</span> en este momento.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={refreshActive}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-sky-500/50 hover:bg-slate-50 dark:hover:bg-[#151e34] disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
            <button
              onClick={() => setDrawerOpen((v) => !v)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-sky-500/50 hover:bg-slate-50 dark:hover:bg-[#151e34]"
            >
              <Eye size={15} />
              {drawerOpen ? "Ocultar detalle" : "Ver detalle"}
            </button>
            <button
              onClick={simulateIncomingAlert}
              className="relative group overflow-hidden inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-all duration-300 active:scale-[0.98] bg-gradient-to-b from-slate-800 to-slate-950 dark:from-slate-50 dark:to-slate-200 text-white dark:text-slate-900 hover:from-slate-700 hover:to-slate-900 dark:hover:from-white dark:hover:to-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_20px_-5px_rgba(15,23,42,0.25)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_20px_-5px_rgba(0,0,0,0.35)]"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none bg-gradient-to-r from-transparent via-white/15 dark:via-sky-400/20 to-transparent" />
              <Sparkles size={14} className="relative z-10" />
              <span className="relative z-10">Simular alerta</span>
            </button>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 text-sm font-semibold rounded-2xl px-5 py-4">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {/* ── Table Container ── */}
        <div className="rounded-2xl border overflow-hidden bg-white dark:bg-[#0f1628] border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Usuario</th>
                  <th className="px-5 py-4">Creada</th>
                  <th className="px-5 py-4">Origen</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                {loading && alerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                      <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-slate-400 dark:text-slate-500" />
                      Cargando registros de alertas...
                    </td>
                  </tr>
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                      <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-400 dark:text-emerald-500 opacity-50" />
                      No hay alertas activas en el sistema.
                    </td>
                  </tr>
                ) : (
                  alerts.map((a) => {
                    const isSel = a.id === selectedId;
                    return (
                      <tr
                        key={a.id}
                        className={`transition-colors duration-200 cursor-pointer ${
                          isSel 
                            ? "bg-sky-50/50 dark:bg-sky-900/10" 
                            : "hover:bg-slate-50 dark:hover:bg-[#111d33]"
                        }`}
                        onClick={() => { selectAlert(a.id); setDrawerOpen(true); }}
                      >
                        <td className="px-5 py-4 font-black text-slate-900 dark:text-white">#{a.id}</td>
                        <td className="px-5 py-4 font-semibold">{a.user}</td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                          <Clock size={14} /> {fmtTime(a.createdAt)}
                        </td>
                        <td className="px-5 py-4"><SourceBadge source={a.source} /></td>
                        <td className="px-5 py-4"><StatusBadge status={a.status} /></td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              className="px-3 py-1.5 rounded-lg border transition-colors bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-xs font-bold flex items-center gap-1.5"
                              onClick={(e) => { e.stopPropagation(); selectAlert(a.id); setDrawerOpen(true); }}
                            >
                              <Eye size={14} /> Ver
                            </button>
                            <button
                              className="px-3 py-1.5 rounded-lg border transition-colors bg-white dark:bg-[#111827] text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-xs font-bold flex items-center gap-1.5"
                              onClick={(e) => { e.stopPropagation(); selectAlert(a.id); nav("/app/map"); }}
                            >
                              <MapPin size={14} /> Mapa
                            </button>
                            <button
                              className="px-3 py-1.5 rounded-lg border transition-colors bg-white dark:bg-[#111827] text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-bold flex items-center gap-1.5"
                              onClick={(e) => { e.stopPropagation(); selectAlert(a.id); setConfirmClose(true); }}
                            >
                              <XCircle size={14} /> Cerrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Drawer Detalle ── */}
        <Drawer
          open={drawerOpen}
          title={selected ? `Detalle Alerta #${selected.id}` : "Detalle de Emergencia"}
          onClose={() => setDrawerOpen(false)}
        >
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-6 text-center">
               <AlertTriangle size={48} className="mb-4 opacity-20" />
               <p className="font-medium">Selecciona una alerta de la tabla para ver su información detallada y coordenadas de GPS.</p>
            </div>
          ) : (
            <div className="space-y-5 p-2">
              
              {/* Grid Info Básica */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1">Usuario Afectado</div>
                  <div className="font-black text-slate-900 dark:text-white truncate">{selected.user}</div>
                </div>
                <div className="p-4 rounded-xl border bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">Estado Actual</div>
                  <div><StatusBadge status={selected.status} /></div>
                </div>
                <div className="p-4 rounded-xl border bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">Origen</div>
                  <div><SourceBadge source={selected.source} /></div>
                </div>
                <div className="p-4 rounded-xl border bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                  <div className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1">Hora de Creación</div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-slate-200">{fmtTime(selected.createdAt)}</div>
                </div>
              </div>

              {/* Mapa y Ubicación */}
              <div className="rounded-xl border overflow-hidden bg-white dark:bg-[#0f1628] border-slate-200 dark:border-slate-800">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Navigation size={16} className="text-sky-500" />
                  <span className="font-black text-sm text-slate-900 dark:text-white">Última Ubicación (GPS)</span>
                </div>
                <div className="p-4">
                  {selected.lastLocation ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-4 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#111827] p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div><span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5">Latitud</span> {selected.lastLocation.lat}</div>
                        <div><span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5">Longitud</span> {selected.lastLocation.lng}</div>
                        <div className="col-span-2 flex items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                           <Clock size={12} /> {fmtTime(selected.lastLocation.at)}
                        </div>
                      </div>
                      <div className="h-48 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                        <MiniMap lat={selected.lastLocation.lat} lng={selected.lastLocation.lng} />
                      </div>
                    </>
                  ) : (
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center py-6">
                      Sin coordenadas de ubicación registradas.
                    </div>
                  )}
                </div>
              </div>

              {/* Telemetría del Dispositivo */}
              <div className="rounded-xl border overflow-hidden bg-white dark:bg-[#0f1628] border-slate-200 dark:border-slate-800">
                 <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Cpu size={16} className="text-indigo-500" />
                  <span className="font-black text-sm text-slate-900 dark:text-white">Telemetría del Dispositivo</span>
                </div>
                <div className="p-4 flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <Battery size={18} className={typeof selected.battery === "number" && selected.battery < 20 ? "text-red-500" : "text-emerald-500"} />
                    Nivel de Batería:
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {typeof selected.battery === "number" ? `${selected.battery}%` : "No Disponible"}
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => markAttended(selected.id)}
                  disabled={selected.status === "CLOSED"}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-colors border bg-white dark:bg-[#111827] text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/30 hover:bg-sky-50 dark:hover:bg-sky-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 size={16} />
                  Marcar como Atendida
                </button>
                <button
                  onClick={() => setConfirmClose(true)}
                  disabled={selected.status === "CLOSED"}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-colors bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
                >
                  <XCircle size={16} />
                  Cerrar Alerta
                </button>
              </div>
            </div>
          )}
        </Drawer>

        {/* ── Confirm Modal ── */}
        <ConfirmModal
          open={confirmClose}
          title="Confirmar Cierre"
          desc="¿Estás seguro de que deseas cerrar esta alerta de emergencia? El estado se actualizará a CERRADA y se detendrá el monitoreo activo en el mapa."
          confirmText="Sí, cerrar alerta"
          onClose={() => setConfirmClose(false)}
          onConfirm={() => { if (selected) closeAlert(selected.id); setConfirmClose(false); }}
        />
      </div>
    </div>
  );
}