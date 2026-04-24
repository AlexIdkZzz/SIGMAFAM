import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell, Card, Pill, Button } from "./_ui";
import Drawer from "./_drawer";
import ConfirmModal from "./_modal";
import { useAlerts } from "../app/alerts/AlertsContext";
import MiniMap from "../app/maps/MiniMap";
import { LayoutPanelLeft, RefreshCw, Zap } from "lucide-react";

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

  // FIX: Inicializado en false para que no estorbe al entrar
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const activeCount = useMemo(
    () => alerts.filter((a) => a.status === "ACTIVE" || a.status === "RECEIVED").length,
    [alerts]
  );

  return (
    <PageShell
      title="Gestión de Alertas"
      subtitle={`Alertas activas y recientes · Activas: ${activeCount}`}
      right={
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshActive} disabled={loading} className="dark:bg-slate-800 dark:text-white dark:border-slate-700">
            <RefreshCw size={16} className={loading ? "animate-spin mr-2" : "mr-2"} />
            {loading ? "Cargando" : "Actualizar"}
          </Button>
          <Button variant="outline" onClick={() => setDrawerOpen((v) => !v)} className="dark:bg-slate-800 dark:text-white dark:border-slate-700">
            <LayoutPanelLeft size={16} className="mr-2" />
            {drawerOpen ? "Cerrar Panel" : "Ver Detalle"}
          </Button>
          <Button onClick={simulateIncomingAlert} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white">
            <Zap size={16} className="mr-2 fill-current" /> Simular Alerta
          </Button>
        </div>
      }
    >
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-2xl px-6 py-4 font-bold transition-all">
          ⚠️ {error}
        </div>
      )}

      {/* Card principal con soporte dark */}
      <Card className="dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-left">
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">ID</th>
                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Usuario</th>
                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Fecha / Hora</th>
                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Origen</th>
                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Estado</th>
                <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Gestión</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {loading && alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 dark:border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-500 dark:text-slate-400 font-bold">
                    No se encontraron registros activos en el sistema.
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
                          ? "bg-blue-50/50 dark:bg-blue-600/10 shadow-inner" 
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                      onClick={() => { selectAlert(a.id); setDrawerOpen(true); }}
                    >
                      <td className="py-5 px-6 font-black text-slate-900 dark:text-white transition-colors">#{a.id}</td>
                      <td className="py-5 px-4 font-bold text-slate-700 dark:text-slate-300 transition-colors">{a.user}</td>
                      <td className="py-5 px-4 text-slate-500 dark:text-slate-400 text-xs font-medium transition-colors">{fmtTime(a.createdAt)}</td>
                      <td className="py-5 px-4"><SourcePill source={a.source} /></td>
                      <td className="py-5 px-4"><StatusPill status={a.status} /></td>
                      <td className="py-5 px-6">
                        <div className="flex justify-end gap-3">
                          <button
                            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black transition-all active:scale-95 shadow-sm"
                            onClick={(e) => { e.stopPropagation(); selectAlert(a.id); setDrawerOpen(true); }}
                          >
                            DETALLES
                          </button>
                          <button
                            className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white text-xs font-black transition-all active:scale-95 shadow-lg shadow-slate-200 dark:shadow-none"
                            onClick={(e) => { e.stopPropagation(); selectAlert(a.id); nav("/app/map"); }}
                          >
                            MAPA
                          </button>
                          <button
                            className="px-4 py-2.5 rounded-xl bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-500 text-white text-xs font-black transition-all active:scale-95"
                            onClick={(e) => { e.stopPropagation(); selectAlert(a.id); setConfirmClose(true); }}
                          >
                            CERRAR
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

      {/* Drawer detalle con fixes de color */}
      <Drawer
        open={drawerOpen}
        title={selected ? `ALERTA #${selected.id}` : "DETALLE"}
        onClose={() => setDrawerOpen(false)}
      >
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-600 italic">
            <LayoutPanelLeft size={48} className="mb-4 opacity-20" />
            Selecciona una alerta para inspeccionar.
          </div>
        ) : (
          <div className="space-y-6 pb-20">
            <div className="grid grid-cols-2 gap-4">
              <Card title="USUARIO" className="dark:bg-slate-800/50 dark:border-slate-700">
                <span className="text-slate-900 dark:text-white font-bold">{selected.user}</span>
              </Card>
              <Card title="ESTADO" className="dark:bg-slate-800/50 dark:border-slate-700">
                <StatusPill status={selected.status} />
              </Card>
            </div>

            <Card title="ÚLTIMA UBICACIÓN CONOCIDA" className="dark:bg-slate-800/50 dark:border-slate-700">
              {selected.lastLocation ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                       <p className="text-slate-400 uppercase font-black mb-1">Latitud</p>
                       <p className="text-slate-900 dark:text-white font-mono">{selected.lastLocation.lat}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                       <p className="text-slate-400 uppercase font-black mb-1">Longitud</p>
                       <p className="text-slate-900 dark:text-white font-mono">{selected.lastLocation.lng}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
                    <MiniMap lat={selected.lastLocation.lat} lng={selected.lastLocation.lng} />
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-slate-400 dark:text-slate-600 font-bold uppercase text-[10px] tracking-widest">
                  Sin señal GPS registrada
                </div>
              )}
            </Card>

            <Card title="TELEMETRÍA" className="dark:bg-slate-800/50 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Nivel de Batería:</span>
                <span className={`text-sm font-black ${selected.battery < 20 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                  {typeof selected.battery === "number" ? `${selected.battery}%` : "N/A"}
                </span>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-3 pt-4">
              <Button
                variant="outline"
                className="w-full py-4 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-black uppercase text-xs tracking-widest"
                onClick={() => markAttended(selected.id)}
                disabled={selected.status === "CLOSED"}
              >
                Actualizar a Atendida
              </Button>
              <Button
                variant="danger"
                className="w-full py-4 font-black uppercase text-xs tracking-widest shadow-lg shadow-red-200 dark:shadow-none"
                onClick={() => setConfirmClose(true)}
                disabled={selected.status === "CLOSED"}
              >
                Cerrar Alerta Crítica
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmModal
        open={confirmClose}
        title="Finalizar Procedimiento"
        desc="¿Confirmas el cierre de la alerta? Esta acción quedará registrada en el historial operativo."
        confirmText="Confirmar Cierre"
        onClose={() => setConfirmClose(false)}
        onConfirm={() => { if (selected) closeAlert(selected.id); setConfirmClose(false); }}
      />
    </PageShell>
  );
}