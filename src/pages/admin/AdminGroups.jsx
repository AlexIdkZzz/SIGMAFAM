import { useEffect, useState } from "react";
import {
  useAdminFetch, Avatar, Badge, SectionCard, TableHead,
  ActionBtn, Modal, BtnPrimary, BtnSecondary, LoadingRows, ErrorRow,
  roleBadgeClass, formatDate,
} from "./adminShared";

export default function AdminGroups() {
  const { apiFetch } = useAdminFetch();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [modal, setModal]   = useState(null);

  function load() {
    setLoading(true);
    apiFetch("/admin/groups")
      .then((d) => setGroups(d.groups))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDissolve(id) {
    await apiFetch(`/admin/groups/${id}`, { method: "DELETE" });
    load(); setModal(null);
  }

  return (
    <>
      <SectionCard title="Grupos familiares" count={groups.length}>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-[13px]">
          <TableHead cols={["Grupo", "Jefe de familia", "Miembros", "Dispositivos", "Alertas", "Creado", "Acciones"]} />
          <tbody>
            {loading ? <LoadingRows cols={7} /> :
             error   ? <ErrorRow cols={7} message={error} /> :
             groups.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">Sin grupos registrados</td></tr>
            ) : groups.map((g) => (
              <tr key={g.id} className="hover:bg-slate-50 border-b border-slate-50 last:border-0">
                <td className="px-5 py-3">
                  <div className="font-medium">{g.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{g.invite_code}</div>
                </td>
                <td className="px-5 py-3 text-slate-600">{g.owner_name}</td>
                <td className="px-5 py-3 font-medium">{g.member_count}</td>
                <td className="px-5 py-3">{g.device_count}</td>
                <td className="px-5 py-3">{g.alert_count}</td>
                <td className="px-5 py-3 text-xs text-slate-400">{formatDate(g.created_at)}</td>
                <td className="px-5 py-3">
                  <ActionBtn onClick={() => setModal({ type: "members", group: g })}>Ver miembros</ActionBtn>
                  <ActionBtn variant="danger" onClick={() => setModal({ type: "dissolve", group: g })}>Disolver</ActionBtn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </SectionCard>

      {modal?.type === "members" && (
        <GroupMembersModal group={modal.group} onClose={() => setModal(null)} />
      )}

      {modal?.type === "dissolve" && (
        <Modal title="Disolver grupo familiar" onClose={() => setModal(null)}
          footer={<><BtnSecondary onClick={() => setModal(null)}>Cancelar</BtnSecondary><BtnPrimary onClick={() => handleDissolve(modal.group.id)}>Disolver</BtnPrimary></>}>
          <p className="text-sm text-slate-600 mb-2">¿Seguro que quieres disolver este grupo?</p>
          <p className="text-sm font-medium">{modal.group.name}</p>
          <p className="text-xs text-slate-400 mt-2">Todos los miembros quedarán sin grupo. Esta acción no se puede deshacer.</p>
        </Modal>
      )}
    </>
  );
}

function GroupMembersModal({ group, onClose }) {
  return (
    <Modal title={group.name} onClose={onClose} footer={<BtnSecondary onClick={onClose}>Cerrar</BtnSecondary>}>
      <div className="space-y-1">
        {!group.members?.length ? (
          <p className="text-sm text-slate-400">Sin miembros registrados.</p>
        ) : group.members.map((m) => (
          <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <span className="flex items-center gap-2.5">
              <Avatar name={m.full_name} />
              <span>
                <div className="text-sm font-medium">{m.full_name}</div>
                <div className="text-[11px] text-slate-400">{m.email}</div>
              </span>
            </span>
            <Badge className={roleBadgeClass(m.role)}>{m.role}</Badge>
          </div>
        ))}
      </div>
    </Modal>
  );
}
