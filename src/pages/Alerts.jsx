import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell, Card, Pill, Button } from "./_ui";
import Drawer from "./_drawer";
import ConfirmModal from "./_modal";
import { useAlerts } from "../app/alerts/AlertsContext";
import MiniMap from "../app/maps/MiniMap";
import { LayoutPanelLeft, RefreshCw, AlertTriangle, ChevronDown, Check } from "lucide-react";

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

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">{label}</span>
      <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 break-all">{value}</span>
    </div>
  );
}

function SectionBlock({ title, children }) {
  return (
    <div className="space-y-3">
      <h4 className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-600 border-b border-slate-100 dark:border-slate-800 pb-2">{title}</h4>
      {children}
    </div>
  );
}

function AlertDetailPanel({ detail, loading, onChangeStatus }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-r-transparent" />
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertTriangle size={32} className="text-slate-200 dark:text-slate-800" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-700 italic">
          Selecciona una alerta
        </p>
      </div>
    );
  }

  const elapsedMin = Math.floor((Date.now() - new Date(detail.createdAt)) / 60000);
  const elapsed = elapsedMin < 60
    ? `${elapsedMin} min`
    : elapsedMin < 1440
    ? `${Math.floor(elapsedMin / 60)} h ${elapsedMin % 60} min`
    : `${Math.floor(elapsedMin / 1440)} días`;

  const canAttend = detail.status !== "ATTENDED" && detail.status !== "CLOSED";
  const canClose  = detail.status !== "CLOSED";

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-600 mb-1">Alerta</p>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">#{detail.id}</h2>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-1 italic">
            Activa hace {elapsed}
          </p>
        </div>
        <StatusPill status={detail.status} />
      </div>

      {/* Acciones rápidas */}
      {(canAttend || canClose) && (
        <div className="flex gap-2">
          {canAttend && (
            <button
              onClick={() => onChangeStatus(detail.id, "ATTENDED")}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              Marcar Atendida
            </button>
          )}
          {canClose && (
            <button
              onClick={() => onChangeStatus(detail.id, "CLOSED")}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
              Cerrar Alerta
            </button>
          )}
        </div>
      )}

      {/* Info general */}
      <SectionBlock title="Información General">
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Origen" value={<SourcePill source={detail.source} />} />
          <InfoRow label="Estado" value={<StatusPill status={detail.status} />} />
          <InfoRow label="Creada" value={fmtTime(detail.createdAt)} />
          {detail.closedAt && <InfoRow label="Cerrada" value={fmtTime(detail.closedAt)} />}
        </div>
      </SectionBlock>

      {/* Miembro */}
      <SectionBlock title="Miembro">
        <div className="space-y-3">
          <InfoRow label="Nombre" value={detail.user.name} />
          <InfoRow label="Email" value={detail.user.email} />
          {detail.group && <InfoRow label="Familia" value={detail.group} />}
        </div>
      </SectionBlock>

      {/* Dispositivo (solo IOT) */}
      {detail.source === "IOT" && (
        <SectionBlock title="Dispositivo IoT">
          <InfoRow
            label="Identificador (UID)"
            value={detail.device ?? "No disponible"}
          />
        </SectionBlock>
      )}

      {/* Ubicación */}
      <SectionBlock title="Última Ubicación">
        {detail.lastLocation ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Latitud" value={detail.lastLocation.lat.toFixed(6)} />
              <InfoRow label="Longitud" value={detail.lastLocation.lng.toFixed(6)} />
              <InfoRow label="Registrada" value={fmtTime(detail.lastLocation.at)} />
            </div>
            <MiniMap lat={detail.lastLocation.lat} lng={detail.lastLocation.lng} />
          </div>
        ) : (
          <p className="text-[10px] text-slate-400 dark:text-slate-600 italic font-bold">
            Sin datos de ubicación disponibles
          </p>
        )}
      </SectionBlock>
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: "ATTENDED", label: "Atendida", color: "text-blue-600 dark:text-blue-400" },
  { value: "CLOSED",   label: "Cerrada",  color: "text-green-600 dark:text-green-400" },
];

function StatusDropdown({ alertId, currentStatus, onChangeStatus }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const options = STATUS_OPTIONS.filter((o) => o.value !== currentStatus);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
      >
        Estado
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[130px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChangeStatus(alertId, opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${opt.color}`}
            >
              <Check size={10} className="opacity-0 group-first:opacity-100" />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Alerts() {
  const nav = useNavigate();
  const {
    alerts, selected, selectedId,
    loading, error,
    alertDetail, detailLoading,
    selectAlert,
    refreshActive, markAttended, closeAlert,
  } = useAlerts();

  function handleChangeStatus(id, status) {
    if (status === "ATTENDED") markAttended(id);
    else if (status === "CLOSED") closeAlert(id);
  }

  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeCount = useMemo(
    () => alerts.filter((a) => a.status === "ACTIVE" || a.status === "RECEIVED").length,
    [alerts]
  );

  return (
    <PageShell
      title="Gestión de Alertas"
      subtitle={
        <span className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] italic">
          Monitoreo en tiempo real · Activas: {activeCount}
        </span>
      }
      right={
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={refreshActive} 
            disabled={loading} 
            // FIX: Colores dinámicos para botones de borde
            className="bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-800 font-black uppercase text-[10px] tracking-widest hover:dark:bg-slate-800"
          >
            <RefreshCw size={14} className={loading ? "animate-spin mr-2" : "mr-2"} />
            {loading ? "Sincronizando" : "Actualizar"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setDrawerOpen((v) => !v)} 
            className="bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-800 font-black uppercase text-[10px] tracking-widest hover:dark:bg-slate-800"
          >
            <LayoutPanelLeft size={14} className="mr-2" />
            {drawerOpen ? "Cerrar Panel" : "Ver Detalle"}
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

      <div className="alerts-table-container">
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800/50 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
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
                    <td colSpan={6} className="py-32 text-center">
                      <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent" />
                    </td>
                  </tr>
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-32 text-center">
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
                            : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"
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
                              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                              onClick={(e) => { e.stopPropagation(); selectAlert(a.id); setDrawerOpen(true); }}
                            >
                              Detalle
                            </button>
                            <button
                              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all"
                              onClick={(e) => { e.stopPropagation(); selectAlert(a.id); nav("/app/map"); }}
                            >
                              Mapa
                            </button>
                            <StatusDropdown
                              alertId={a.id}
                              currentStatus={a.status}
                              onChangeStatus={handleChangeStatus}
                            />
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
      </div>

      <Drawer
        open={drawerOpen}
        title="Detalle de Alerta"
        onClose={() => setDrawerOpen(false)}
      >
        <AlertDetailPanel
          detail={alertDetail}
          loading={detailLoading}
          onChangeStatus={handleChangeStatus}
        />
      </Drawer>

      <style>{`
        /* INYECCIÓN DE ESTILOS PARA FORZAR DARK MODE SI EL COMPONENTE UI FALLA */
        .dark .alerts-table-container .bg-white,
        .dark .alerts-table-container .bg-transparent {
          background-color: #050a18 !important;
        }
        
        .dark .alerts-table-container > div {
          background-color: #050a18 !important;
          border-color: #0f172a !important;
        }

        .dark table {
          background-color: #050a18 !important;
        }

        .dark .alerts-table-container tr:not(.bg-blue-500\/10) {
          background-color: transparent !important;
        }

        .dark .alerts-table-container thead tr {
          background-color: #090f1e !important;
        }
      `}</style>
    </PageShell>
  );
}