import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAlerts } from "../app/alerts/AlertsContext";
import {
  Shield, AlertTriangle, Activity, Bell, Map as MapIcon,
  CheckCircle2, Clock, Cpu, Users, TrendingUp,
  Radio, Zap, Eye, ChevronRight, Sparkles, ArrowRight
} from "lucide-react";

function StatusBadge({ status }) {
  const map = {
    ACTIVE:   { label: "ACTIVA",    styles: "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30" },
    RECEIVED: { label: "RECIBIDA",  styles: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30" },
    ATTENDED: { label: "ATENDIDA",  styles: "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/30" },
    CLOSED:   { label: "CERRADA",   styles: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" },
  };
  const s = map[status] ?? { label: status, styles: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600" };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${s.styles}`}>
      {status === "ACTIVE" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
      {s.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, trend, accent = "sky" }) {
  const accents = {
    sky:     { iconStyles: "bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400", ring: "hover:border-sky-500/40" },
    emerald: { iconStyles: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", ring: "hover:border-emerald-500/40" },
    red:     { iconStyles: "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400", ring: "hover:border-red-500/40" },
    indigo:  { iconStyles: "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400", ring: "hover:border-indigo-500/40" },
  }[accent];

  return (
    <div className={`group relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-white dark:bg-[#0f1628] border-slate-200 dark:border-slate-800 ${accents.ring} hover:shadow-slate-200/60 dark:hover:shadow-black/30`}>
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${accents.iconStyles.split(' ')[0]} ${accents.iconStyles.split(' ')[1]}`} style={{ filter: "blur(20px)" }} />

      <div className="relative flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accents.iconStyles}`}>
          <Icon size={18} />
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${trend.startsWith("+") ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400"}`}>
            <TrendingUp size={10} />
            {trend}
          </span>
        )}
      </div>
      <div className="text-[10px] font-bold tracking-widest uppercase mb-1 text-slate-500 dark:text-slate-500">
        {label}
      </div>
      <div className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-100">
        {value}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick, primary = false }) {
  if (primary) {
    return (
      <button
        onClick={onClick}
        className="relative group overflow-hidden w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-bold text-sm tracking-tight transition-all duration-300 active:scale-[0.98] bg-gradient-to-b from-slate-800 to-slate-950 dark:from-slate-50 dark:to-slate-200 text-white dark:text-slate-900 hover:from-slate-700 hover:to-slate-900 dark:hover:from-white dark:hover:to-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_20px_-5px_rgba(15,23,42,0.25)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_20px_-5px_rgba(0,0,0,0.35)]"
      >
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none bg-gradient-to-r from-transparent via-white/15 dark:via-sky-400/20 to-transparent" />
        <span className="relative z-10 flex items-center gap-2.5">
          <Icon size={16} />
          {label}
        </span>
        <ArrowRight size={14} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 border bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-sky-500/40 hover:bg-slate-50 dark:hover:bg-[#151e34] hover:text-slate-900 dark:hover:text-white"
    >
      <span className="flex items-center gap-2.5">
        <Icon size={15} className="text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-sky-400" />
        {label}
      </span>
      <ChevronRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 opacity-60" />
    </button>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const { alerts, selected, simulateIncomingAlert } = useAlerts();

  const activeAlerts = useMemo(() => alerts.filter((a) => a.status === "ACTIVE" || a.status === "RECEIVED"), [alerts]);
  const latestActive = activeAlerts[0] ?? null;
  const alertsToday = activeAlerts.length;
  const alertsMonth = alerts.length;
  const uptimePct = "99.8%";

  return (
    <div className="min-h-full w-full transition-colors duration-300 bg-slate-50 dark:bg-[#0a0f1e]">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                Sistema operativo
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-100">
              Dashboard
            </h1>
            <p className="text-sm font-medium mt-1 text-slate-500 dark:text-slate-400">
              Resumen rápido del estado del sistema.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => nav("/app/alerts")}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-sky-500/50 hover:bg-slate-50 dark:hover:bg-[#151e34]"
            >
              <Eye size={15} />
              Ver alertas
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

        {/* ── Banner ── */}
        {latestActive ? (
          <div className="relative overflow-hidden rounded-2xl border p-4 sm:p-5 bg-gradient-to-br from-red-50 to-white dark:from-red-950/60 dark:to-[#0f1628] border-red-200 dark:border-red-500/30">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)", filter: "blur(30px)" }} />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-500/20">
                  <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                  <span className="absolute inset-0 rounded-xl animate-ping bg-red-500/20" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-black tracking-tight text-base sm:text-lg text-red-800 dark:text-red-300">
                      Alerta activa
                    </span>
                    <StatusBadge status={latestActive.status} />
                  </div>
                  <div className="text-xs sm:text-sm font-medium truncate text-red-700 dark:text-red-300/80">
                    <span className="font-bold">{latestActive.user}</span> · {latestActive.source} · Lat {latestActive.lastLocation.lat.toFixed(4)} / Lng {latestActive.lastLocation.lng.toFixed(4)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => nav("/app/map")} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">
                  <MapIcon size={14} /> Ver en mapa
                </button>
                <button onClick={() => nav("/app/alerts")} className="inline-flex items-center px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all bg-white dark:bg-[#0f1628] text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-950/40">
                  Detalle
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border p-4 sm:p-5 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-[#0f1628] border-emerald-200 dark:border-emerald-500/25">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)", filter: "blur(30px)" }} />
            <div className="relative flex items-center gap-3">
              <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20">
                <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={20} />
              </div>
              <div className="flex-1">
                <div className="font-black tracking-tight text-base sm:text-lg text-emerald-800 dark:text-emerald-300">
                  Sin alertas activas
                </div>
                <div className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400/80">
                  Todo tranquilo por ahora.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={Cpu}      label="Dispositivo"    value="Online" trend="+2m"  accent="emerald" />
          <StatCard icon={Bell}     label="Activas hoy"    value={alertsToday}          accent="red"     />
          <StatCard icon={Activity} label="Alertas totales" value={alertsMonth}         accent="sky"     />
          <StatCard icon={Shield}   label="Uptime"          value={uptimePct}            accent="indigo"  />
        </div>

        {/* ── Grid principal ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <div className="lg:col-span-2 rounded-2xl border overflow-hidden bg-white dark:bg-[#0f1628] border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-50 dark:bg-sky-500/15">
                  <Activity className="text-sky-600 dark:text-sky-400" size={15} />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900 dark:text-slate-100">Actividad reciente</div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-500">Últimas {Math.min(alerts.length, 5)} alertas</div>
                </div>
              </div>
              <button onClick={() => nav("/app/history")} className="text-xs font-bold transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-sky-400">
                Ver historial →
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {alerts.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm font-medium text-slate-500">No hay actividad registrada.</div>
              ) : (
                alerts.slice(0, 5).map((a) => (
                  <div key={a.id} className="px-5 py-3.5 flex items-center justify-between gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-[#111d33]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        #{a.id}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate text-slate-900 dark:text-slate-100">{a.user}</div>
                        <div className="text-xs flex items-center gap-2 font-medium text-slate-500">
                          <Radio size={10} /> {a.source}
                          <Clock size={10} className="ml-1" /> ahora
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div className="rounded-2xl border p-5 bg-white dark:bg-[#0f1628] border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/15">
                  <Zap className="text-indigo-600 dark:text-indigo-400" size={15} />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900 dark:text-slate-100">Acciones rápidas</div>
                  <div className="text-[11px] font-medium text-slate-500">Atajos del sistema</div>
                </div>
              </div>
              <div className="space-y-2">
                <QuickAction icon={MapIcon}  label="Ir al mapa" onClick={() => nav("/app/map")} primary />
                <QuickAction icon={Clock}    label="Historial"  onClick={() => nav("/app/history")} />
                <QuickAction icon={Users}    label="Familia"    onClick={() => nav("/app/family")} />
                <QuickAction icon={Cpu}      label="Dispositivos" onClick={() => nav("/app/device")} />
              </div>
            </div>

            <div className="rounded-2xl border p-5 bg-white dark:bg-[#0f1628] border-slate-200 dark:border-slate-800">
              <div className="text-[10px] font-bold tracking-widest uppercase mb-2 text-slate-500">Alerta seleccionada</div>
              {selected ? (
                <div>
                  <div className="text-2xl font-black tracking-tighter text-slate-900 dark:text-slate-100">#{selected.id}</div>
                  <div className="text-xs font-medium mt-1 text-slate-600 dark:text-slate-400">{selected.user} · {selected.source}</div>
                  <div className="mt-3"><StatusBadge status={selected.status} /></div>
                </div>
              ) : (
                <div className="text-sm font-medium text-slate-500">Ninguna seleccionada.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}