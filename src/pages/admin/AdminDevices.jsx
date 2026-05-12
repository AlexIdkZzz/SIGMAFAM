import { useEffect, useState, useCallback, useRef } from "react";
import {
  useAdminFetch, SectionCard, TableHead, ActionBtn,
  Modal, BtnPrimary, BtnSecondary, LoadingRows, ErrorRow, formatDate,
} from "./adminShared";

/* ─── Constantes ─────────────────────────────────────────────── */
const REFRESH_INTERVAL = 30_000; // 30 s de refresco automático
const ONLINE_THRESHOLD = 5 * 60 * 1000; // 5 min → "online"

/* ─── Helpers visuales ───────────────────────────────────────── */

function BatteryBar({ level }) {
  if (level == null)
    return <span className="text-xs text-slate-400 dark:text-slate-500">—</span>;

  const pct   = Math.max(0, Math.min(100, level));
  const color =
    pct > 50 ? "bg-emerald-500" :
    pct > 20 ? "bg-amber-400"   :
               "bg-red-500";
  const icon  =
    pct > 50 ? "🔋" :
    pct > 20 ? "🪫" :
               "⚠️";

  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="relative h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-medium tabular-nums ${
        pct <= 20
          ? "text-red-500 dark:text-red-400"
          : pct <= 50
          ? "text-amber-600 dark:text-amber-400"
          : "text-emerald-600 dark:text-emerald-400"
      }`}>
        {icon} {pct}%
      </span>
    </div>
  );
}

function StatusDot({ lastSeen }) {
  const isOnline =
    lastSeen && Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD;
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          isOnline
            ? "bg-emerald-500 shadow-[0_0_5px_1px_rgba(16,185,129,0.5)]"
            : "bg-slate-400 dark:bg-slate-600"
        }`}
      />
      <span
        className={`text-xs font-medium ${
          isOnline
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {isOnline ? "Online" : "Offline"}
      </span>
    </span>
  );
}

function AlertCountBadge({ total, active }) {
  if (total == null)
    return <span className="text-xs text-slate-400 dark:text-slate-500">—</span>;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
        {total} total
      </span>
      {active > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {active} activa{active !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

function CoordCell({ lat, lng }) {
  if (lat == null || lng == null)
    return <span className="text-xs text-slate-400 dark:text-slate-500">—</span>;

  const url = `https://maps.google.com/?q=${lat},${lng}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Abrir en Google Maps"
      className="group flex items-center gap-1 font-mono text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
    >
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        <path d="M8 1a5 5 0 0 0-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
      </svg>
      {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
    </a>
  );
}

/* ─── Drawer de detalle ──────────────────────────────────────── */

function DeviceDrawer({ device, onClose, onUnlink }) {
  if (!device) return null;

  const isOnline =
    device.last_seen_at &&
    Date.now() - new Date(device.last_seen_at).getTime() < ONLINE_THRESHOLD;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
              Dispositivo IoT
            </p>
            <h3 className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
              {device.device_uid}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot lastSeen={device.last_seen_at} />
            <button
              onClick={onClose}
              className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
          {[
            {
              label: "Alertas totales",
              value: device.alert_total ?? "—",
              sub:
                device.alert_active > 0
                  ? `${device.alert_active} activa${device.alert_active !== 1 ? "s" : ""}`
                  : "Sin activas",
              danger: device.alert_active > 0,
            },
            {
              label: "Batería",
              value:
                device.battery_level != null
                  ? `${device.battery_level}%`
                  : "—",
              sub:
                device.battery_level != null
                  ? device.battery_level > 50
                    ? "Nivel bueno"
                    : device.battery_level > 20
                    ? "Nivel medio"
                    : "Batería baja"
                  : "Sin datos",
              danger: device.battery_level != null && device.battery_level <= 20,
            },
            {
              label: "Estado",
              value: isOnline ? "Online" : "Offline",
              sub: device.last_seen_at
                ? formatDate(device.last_seen_at)
                : "Sin conexión",
              danger: !isOnline,
            },
          ].map(({ label, value, sub, danger }) => (
            <div key={label} className="px-4 py-3.5 text-center">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mb-1">{label}</p>
              <p
                className={`text-xl font-bold ${
                  danger
                    ? "text-red-500 dark:text-red-400"
                    : "text-slate-900 dark:text-slate-100"
                }`}
              >
                {value}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Detalles */}
        <div className="p-5 space-y-3">
          <Row label="Propietario"   value={device.owner_name ?? "—"} />
          <Row label="Email"         value={device.owner_email ?? "—"} />
          <Row label="Grupo"         value={device.group_name ?? "Sin grupo"} />
          <Row label="Vinculado"     value={formatDate(device.created_at)} />
          <Row label="Última vez visto" value={formatDate(device.last_seen_at)} />
          {device.last_lat != null && (
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                Última ubicación
              </span>
              <CoordCell lat={device.last_lat} lng={device.last_lng} />
            </div>
          )}
        </div>

        {/* Mapa miniatura (solo si hay coords) */}
        {device.last_lat != null && (
          <div className="px-5 pb-4">
            <a
              href={`https://maps.google.com/?q=${device.last_lat},${device.last_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-90 transition-opacity"
            >
              <img
                src={`https://staticmap.openstreetmap.de/staticmap.php?center=${device.last_lat},${device.last_lng}&zoom=14&size=440x120&maptype=mapnik&markers=${device.last_lat},${device.last_lng},red-pushpin`}
                alt="Mapa"
                className="w-full h-24 object-cover"
                loading="lazy"
              />
            </a>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={() => onUnlink(device)}
            className="flex-1 py-2 rounded-xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Desvincular
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-slate-400 dark:text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-slate-800 dark:text-slate-200 font-medium text-right truncate max-w-[200px]">
        {value}
      </span>
    </div>
  );
}

/* ─── Componente principal ───────────────────────────────────── */

export default function AdminDevices() {
  const { apiFetch }  = useAdminFetch();
  const [devices, setDevices]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [modal, setModal]         = useState(null);   // { device } → confirm unlink
  const [drawer, setDrawer]       = useState(null);   // device → detail drawer
  const [lastRefresh, setRefresh] = useState(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const timerRef                  = useRef(null);

  /* ── Carga de datos ── */
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const d = await apiFetch("/admin/devices/metrics");
      setDevices(d.devices);
      setRefresh(new Date());
      setCountdown(REFRESH_INTERVAL / 1000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Auto-refresco ── */
  useEffect(() => {
    load();
    timerRef.current = setInterval(() => load(true), REFRESH_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [load]);

  /* ── Countdown visual ── */
  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [lastRefresh]);

  /* ── Desvinculación ── */
  async function handleUnlink(id) {
    await apiFetch(`/admin/devices/${id}`, { method: "DELETE" });
    setModal(null);
    setDrawer(null);
    load(true);
  }

  /* ── Métricas de resumen ── */
  const online  = devices.filter(
    (d) => d.last_seen_at && Date.now() - new Date(d.last_seen_at).getTime() < ONLINE_THRESHOLD
  ).length;
  const lowBatt = devices.filter(
    (d) => d.battery_level != null && d.battery_level <= 20
  ).length;
  const withAlerts = devices.filter((d) => (d.alert_active ?? 0) > 0).length;

  /* ── Render ── */
  return (
    <>
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          {
            label: "Total dispositivos",
            value: devices.length,
            sub: "Vinculados al sistema",
            color: "text-slate-900 dark:text-slate-100",
          },
          {
            label: "En línea ahora",
            value: online,
            sub: "Últimos 5 min",
            color: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Batería baja",
            value: lowBatt,
            sub: "≤ 20 %",
            color: lowBatt > 0 ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-slate-500",
          },
          {
            label: "Con alertas activas",
            value: withAlerts,
            sub: "Requieren atención",
            color: withAlerts > 0 ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-slate-500",
          },
        ].map(({ label, value, sub, color }) => (
          <div
            key={label}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5"
          >
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <SectionCard
        title="Dispositivos IoT"
        count={`${devices.length} total · ${online} online`}
        action={
          <div className="flex items-center gap-2">
            {lastRefresh && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Actualiza en {countdown}s
              </span>
            )}
            <button
              onClick={() => load(false)}
              disabled={loading}
              title="Actualizar ahora"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors disabled:opacity-50"
            >
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              >
                <path d="M13.6 2.4A7 7 0 1 0 15 8h-1.5A5.5 5.5 0 1 1 12.5 3.6L10 6h5V1l-1.4 1.4z"/>
              </svg>
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-[13px]">
            <TableHead
              cols={[
                "UID",
                "Propietario",
                "Grupo",
                "Estado",
                "Batería",
                "Alertas",
                "Última ubicación",
                "Última conexión",
                "Acciones",
              ]}
            />
            <tbody>
              {loading ? (
                <LoadingRows cols={9} />
              ) : error ? (
                <ErrorRow cols={9} message={error} />
              ) : devices.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-10 text-center text-slate-400 dark:text-slate-500 text-sm"
                  >
                    Sin dispositivos registrados
                  </td>
                </tr>
              ) : (
                devices.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 last:border-0 cursor-pointer"
                    onClick={() => setDrawer(d)}
                  >
                    {/* UID */}
                    <td className="px-5 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {d.device_uid}
                    </td>

                    {/* Propietario */}
                    <td className="px-5 py-2.5">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {d.owner_name ?? "Sin propietario"}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        {d.owner_email}
                      </div>
                    </td>

                    {/* Grupo */}
                    <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400 text-xs">
                      {d.group_name ?? "Sin grupo"}
                    </td>

                    {/* Estado online/offline */}
                    <td className="px-5 py-2.5">
                      <StatusDot lastSeen={d.last_seen_at} />
                    </td>

                    {/* Batería */}
                    <td className="px-5 py-2.5">
                      <BatteryBar level={d.battery_level} />
                    </td>

                    {/* Alertas */}
                    <td className="px-5 py-2.5">
                      <AlertCountBadge
                        total={d.alert_total}
                        active={d.alert_active ?? 0}
                      />
                    </td>

                    {/* Última ubicación */}
                    <td className="px-5 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <CoordCell lat={d.last_lat} lng={d.last_lng} />
                    </td>

                    {/* Última conexión */}
                    <td className="px-5 py-2.5 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {formatDate(d.last_seen_at)}
                    </td>

                    {/* Acciones */}
                    <td
                      className="px-5 py-2.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ActionBtn onClick={() => setDrawer(d)}>Detalle</ActionBtn>
                      <ActionBtn
                        variant="danger"
                        onClick={() => setModal({ device: d })}
                      >
                        Desvincular
                      </ActionBtn>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pie: info de actualización */}
        {lastRefresh && !loading && (
          <div className="px-5 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Última actualización: {formatDate(lastRefresh)}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Refresco automático cada {REFRESH_INTERVAL / 1000}s
            </span>
          </div>
        )}
      </SectionCard>

      {/* Drawer de detalle */}
      <DeviceDrawer
        device={drawer}
        onClose={() => setDrawer(null)}
        onUnlink={(dev) => {
          setDrawer(null);
          setModal({ device: dev });
        }}
      />

      {/* Modal de confirmación de desvinculación */}
      {modal && (
        <Modal
          title="Desvincular dispositivo"
          onClose={() => setModal(null)}
          footer={
            <>
              <BtnSecondary onClick={() => setModal(null)}>Cancelar</BtnSecondary>
              <BtnPrimary onClick={() => handleUnlink(modal.device.id)}>
                Desvincular
              </BtnPrimary>
            </>
          }
        >
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
            ¿Seguro que quieres desvincular este dispositivo?
          </p>
          <p className="text-sm font-medium font-mono text-slate-900 dark:text-slate-100">
            {modal.device.device_uid}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Propietario: {modal.device.owner_name} · {modal.device.group_name ?? "Sin grupo"}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Esta acción no se puede deshacer.
          </p>
        </Modal>
      )}
    </>
  );
}