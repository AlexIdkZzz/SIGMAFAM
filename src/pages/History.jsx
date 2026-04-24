import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Drawer from "./_drawer";
import { useAlerts } from "../alerts/AlertsContext";
import MiniMap from "../maps/MiniMap";
import {
  Clock, Search, Filter, Eye, ChevronLeft, ChevronRight, 
  Download, Calendar, Cpu, Smartphone, AlertTriangle, Navigation, Battery
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

export default function History() {
  const { alerts, selected, selectAlert } = useAlerts();
  
  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const itemsPerPage = 10;

  // Lógica de filtrado
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchSearch = alert.user?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          alert.id?.toString().includes(searchTerm);
      const matchStatus = statusFilter === "ALL" || alert.status === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [alerts, searchTerm, statusFilter]);

  // Lógica de paginación
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const currentAlerts = filteredAlerts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportToCSV = () => {
    // Lógica futura para exportar auditoría
    console.log("Exportando...");
  };

  return (
    <div className="min-h-full w-full transition-colors duration-300 bg-slate-50 dark:bg-[#0a0f1e]">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6 animate-fadeInUp">
        
        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                <Clock size={12} className="text-sky-500" />
                Auditoría y Registro
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-100">
              Historial de Alertas
            </h1>
            <p className="text-sm font-medium mt-1 text-slate-500 dark:text-slate-400">
              Consulta el registro histórico de emergencias, resoluciones y telemetría pasada.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-sky-500/50 hover:bg-slate-50 dark:hover:bg-[#151e34]"
            >
              <Download size={15} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* ── Controles de Búsqueda y Filtros ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre de usuario o ID de alerta..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-3 rounded-xl border bg-white dark:bg-[#0f1628] text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 focus:border-slate-400 dark:focus:border-sky-500/50 focus:ring-0 outline-none text-sm font-medium transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <div className="relative shrink-0 sm:w-48">
            <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-8 py-3 rounded-xl border bg-white dark:bg-[#0f1628] text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 focus:border-slate-400 dark:focus:border-sky-500/50 outline-none text-sm font-bold transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="ACTIVE">Activas</option>
              <option value="RECEIVED">Recibidas</option>
              <option value="ATTENDED">Atendidas</option>
              <option value="CLOSED">Cerradas</option>
            </select>
          </div>
        </div>

        {/* ── Table Container ── */}
        <div className="rounded-2xl border overflow-hidden bg-white dark:bg-[#0f1628] border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Usuario</th>
                  <th className="px-5 py-4">Fecha de Evento</th>
                  <th className="px-5 py-4">Origen</th>
                  <th className="px-5 py-4">Estado Final</th>
                  <th className="px-5 py-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                {currentAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        <Search size={32} className="mb-3 opacity-50" />
                        <span className="font-medium">No se encontraron registros que coincidan con la búsqueda.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentAlerts.map((a) => (
                    <tr
                      key={a.id}
                      className="transition-colors duration-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#111d33]"
                      onClick={() => { selectAlert(a.id); setDrawerOpen(true); }}
                    >
                      <td className="px-5 py-4 font-black text-slate-900 dark:text-white">#{a.id}</td>
                      <td className="px-5 py-4 font-semibold">{a.user}</td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                        <Calendar size={14} /> {fmtTime(a.createdAt)}
                      </td>
                      <td className="px-5 py-4"><SourceBadge source={a.source} /></td>
                      <td className="px-5 py-4"><StatusBadge status={a.status} /></td>
                      <td className="px-5 py-4 text-right">
                        <button
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-xs font-bold"
                          onClick={(e) => { e.stopPropagation(); selectAlert(a.id); setDrawerOpen(true); }}
                        >
                          <Eye size={14} /> Inspeccionar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Mostrando página <strong className="text-slate-900 dark:text-white">{currentPage}</strong> de <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-1.5 rounded-lg border bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-1.5 rounded-lg border bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Drawer Detalle Histórico ── */}
        <Drawer
          open={drawerOpen}
          title={selected ? `Registro Histórico #${selected.id}` : "Detalle del Evento"}
          onClose={() => setDrawerOpen(false)}
        >
          {!selected ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
               <Search size={48} className="mb-4 opacity-20" />
               <p className="font-medium">Selecciona un registro del historial para ver su información.</p>
             </div>
          ) : (
            <div className="space-y-5 p-2">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1">Usuario Afectado</div>
                  <div className="font-black text-slate-900 dark:text-white truncate">{selected.user}</div>
                </div>
                <div className="p-4 rounded-xl border bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">Estado Final</div>
                  <div><StatusBadge status={selected.status} /></div>
                </div>
                <div className="col-span-2 p-4 rounded-xl border bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1">Hora Exacta del Evento</div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-200">{fmtTime(selected.createdAt)}</div>
                  </div>
                  <SourceBadge source={selected.source} />
                </div>
              </div>

              {/* Mapa Histórico */}
              <div className="rounded-xl border overflow-hidden bg-white dark:bg-[#0f1628] border-slate-200 dark:border-slate-800 opacity-90">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Navigation size={16} className="text-slate-500" />
                  <span className="font-black text-sm text-slate-900 dark:text-white">Ubicación Registrada</span>
                </div>
                <div className="p-4">
                  {selected.lastLocation ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-4 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#111827] p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div><span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5">Latitud (Congelada)</span> {selected.lastLocation.lat}</div>
                        <div><span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5">Longitud (Congelada)</span> {selected.lastLocation.lng}</div>
                      </div>
                      <div className="h-48 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner grayscale-[30%]">
                        <MiniMap lat={selected.lastLocation.lat} lng={selected.lastLocation.lng} />
                      </div>
                    </>
                  ) : (
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center py-6">
                      Sin coordenadas registradas en el historial.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </Drawer>

      </div>
    </div>
  );
}