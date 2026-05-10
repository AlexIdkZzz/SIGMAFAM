import { useEffect, useState } from "react";
import {
  useAdminFetch, SectionCard, TableHead, ActionBtn,
  Modal, BtnPrimary, BtnSecondary, LoadingRows, ErrorRow, formatDate,
} from "./adminShared";

function BatteryBar({ level }) {
  if (level == null) return <span className="text-xs text-slate-400 dark:text-slate-500">—</span>;
  const color = level > 30 ? "bg-emerald-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-12 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${level}%` }} />
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400">{level}%</span>
    </div>
  );
}

function StatusDot({ lastSeen }) {
  const isOnline = lastSeen && (Date.now() - new Date(lastSeen).getTime()) < 5 * 60 * 1000;
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-600"}`} />
      <span className={`text-xs ${isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
        {isOnline ? "Online" : "Offline"}
      </span>
    </span>
  );
}

export default function AdminDevices() {
  const { apiFetch } = useAdminFetch();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [modal, setModal]     = useState(null);

  function load() {
    setLoading(true);
    apiFetch("/admin/devices")
      .then((d) => setDevices(d.devices))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleUnlink(id) {
    await apiFetch(`/admin/devices/${id}`, { method: "DELETE" });
    load(); setModal(null);
  }

  const online = devices.filter((d) => d.last_seen_at && (Date.now() - new Date(d.last_seen_at).getTime()) < 5 * 60 * 1000).length;

  return (
    <>
      <SectionCard title="Dispositivos IoT" count={`${devices.length} total · ${online} online`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-[13px]">
            <TableHead cols={["UID", "Propietario", "Grupo", "Estado", "Última conexión", "Vinculado", "Acciones"]} />
            <tbody>
              {loading ? <LoadingRows cols={7} /> :
               error   ? <ErrorRow cols={7} message={error} /> :
               devices.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400 dark:text-slate-500 text-sm">Sin dispositivos registrados</td></tr>
              ) : devices.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <td className="px-5 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-300">{d.device_uid}</td>
                  <td className="px-5 py-2.5">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{d.owner_name ?? "Sin propietario"}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">{d.owner_email}</div>
                  </td>
                  <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{d.group_name ?? "Sin grupo"}</td>
                  <td className="px-5 py-2.5"><StatusDot lastSeen={d.last_seen_at} /></td>
                  <td className="px-5 py-2.5 text-xs text-slate-400 dark:text-slate-500">{formatDate(d.last_seen_at)}</td>
                  <td className="px-5 py-2.5 text-xs text-slate-400 dark:text-slate-500">{formatDate(d.created_at)}</td>
                  <td className="px-5 py-2.5">
                    <ActionBtn variant="danger" onClick={() => setModal({ device: d })}>Desvincular</ActionBtn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {modal && (
        <Modal title="Desvincular dispositivo" onClose={() => setModal(null)}
          footer={<><BtnSecondary onClick={() => setModal(null)}>Cancelar</BtnSecondary><BtnPrimary onClick={() => handleUnlink(modal.device.id)}>Desvincular</BtnPrimary></>}>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">¿Seguro que quieres desvincular este dispositivo?</p>
          <p className="text-sm font-medium font-mono text-slate-900 dark:text-slate-100">{modal.device.device_uid}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Propietario: {modal.device.owner_name} · {modal.device.group_name ?? "Sin grupo"}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Esta acción no se puede deshacer.</p>
        </Modal>
      )}
    </>
  );
}