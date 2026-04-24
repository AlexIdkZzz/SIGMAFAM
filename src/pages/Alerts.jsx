import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell, Card, Pill, Button } from "./_ui";
import Drawer from "./_drawer";
import ConfirmModal from "./_modal";
import { useAlerts } from "../app/alerts/AlertsContext";
import MiniMap from "../app/maps/MiniMap";
import { LayoutPanelLeft, RefreshCw, Zap, AlertTriangle } from "lucide-react";

function fmtTime(iso) {
  try { return new Date(iso).toLocaleString("es-MX"); }
  catch { return iso; }
}

function StatusPill({ status }) {
  if (status === "ACTIVE")   return <Pill variant="red">ACTIVA</Pill>;
  if (status === "RECEIVED") return <Pill variant="yellow">RECIBIDA</Pill>;
  if (status === "ATTENDED") return <Pill variant="blue">ATENDIDA</Pill>;
  if (status === "CLOSED")   return <Pill variant="green">CERRADA</Pill>;
  return <Pill>—</Pill>;
}

function SourcePill({ source }) {
  return <Pill variant={source === "IOT" ? "slate" : "blue"}>{source}</Pill>;
}

export default function Alerts() {
  const nav = useNavigate();
  const {
    alerts, selected, selectedId,
    loading, error,
    selectAlert, simulateIncomingAlert,
    markAttended, closeAlert, refreshActive,
  } = useAlerts();

  const [drawerOpen, setDrawerOpen]   = useState(false);

  const activeCount = useMemo(
    () => alerts.filter((a) => a.status === "ACTIVE" || a.status === "RECEIVED").length,
    [alerts]
  );

  return (
    <PageShell
      title="Gestión de Alertas"
      // FIX: Subtítulo con colores explícitos para dark mode
      subtitle={<span className="text-slate-500 dark:text-slate-500/70 font-black uppercase tracking-[0.2em] text-[10px] italic">SISTEMA DE MONITOREO CRÍTICO · ACTIVAS: {activeCount}</span>}
      right={
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={refreshActive} 
            disabled={loading} 
            // FIX: Eliminado bg-white, forzado dark:bg-[#0d1426]
            className="bg-transparent dark:bg-[#0d1426] text-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-800 font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-sm hover:dark:text-white"
          >
            <RefreshCw size={14} className={loading ? "animate-spin mr-2" : "mr-2"} />
            {loading ? "Sincronizando" : "Actualizar"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setDrawerOpen((v) => !v)} 
            // FIX: Eliminado bg-white, forzado dark:bg-[#0d1426]
            className="bg-transparent dark:bg-[#0d1426] text-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-800 font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-sm hover:dark:text-white"
          >
            <LayoutPanelLeft size={14} className="mr-2" />
            {drawerOpen ? "Cerrar Panel" : "Ver Detalle"}
          </Button>
          <Button 
            onClick={simulateIncomingAlert} 
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Zap size={14} className="mr-2 fill-current" /> Simular Alerta
          </Button>
        </div>
      }
    >
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-2xl px-6 py-4 font-black flex items-center gap-3">
          <AlertTriangle size={18} />
          <span>SISTEMA: {error}</span>
        </div>
      )}

      {/* FIX: bg-transparent para que mande el fondo del body y dark:bg-[#0d1426] para el contenedor */}
      <Card className="bg-transparent dark:bg-[#0d1426] border-slate-200 dark:border-slate-800/50 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-transparent">
            <thead>
              {/* FIX: bg-slate-900/50 para el header en modo oscuro */}
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 text-left">
                <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">ID</th>
                <th className="py-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Usuario / Cliente</th>
                <th className="py-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Timestamp</th>
                <th className="py-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Origen</th>
                <th className="py-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Estado</th>
                <th className="py-5 px-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
              {loading && alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-32 text-center bg-transparent">
                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent" />
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-32 text-center bg-transparent">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw size={40} className="text-slate-200 dark:text-slate-800 animate-pulse" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700 italic">Sin registros activos</p>
                    </div>
                  </td>
                </tr>
              ) : (
                alerts.map((a) => {
                  const isSel = a.id === selectedId;
                  return (
                    <tr
                      key={a.id}
                      className={`group transition-all duration-200 cursor-pointer ${
                        isSel 
                          ? "bg-blue-500/5 dark:bg-blue-500/10" 
                          // FIX: Cambiado bg-white por bg-transparent en las filas
                          : "bg-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                      }`}
                      onClick={() => { selectAlert(a.id); setDrawerOpen(true); }}
                    >
                      <td className="py-6 px-6 font-black text-slate-900 dark:text-white text-sm">#{a.id}</td>
                      <td className="py-6 px-4">
                        <div className="flex flex-col">
                           <span className="font-black text-slate-700 dark:text-slate-200 uppercase text-[11px] tracking-tight">{a.user}</span>
                           <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-tighter italic">Nodo Verificado</span>
                        </div>
                      </td>
                      <td className="py-6 px-4 text-slate-500 dark:text-slate-500 text-[11px] font-black uppercase italic">{fmtTime(a.createdAt)}</td>
                      <td className="py-6 px-4"><SourcePill source={a.source} /></td>
                      <td className="py-6 px-4"><StatusPill status={a.status} /></td>
                      <td className="py-6 px-6">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                            onClick={(e) => { e.stopPropagation(); selectAlert(a.id); setDrawerOpen(true); }}
                          >
                            Detalle
                          </button>
                          <button
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-95"
                            onClick={(e) => { e.stopPropagation(); selectAlert(a.id); nav("/app/map"); }}
                          >
                            Mapa
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
      </Card>
    </PageShell>
  );
}