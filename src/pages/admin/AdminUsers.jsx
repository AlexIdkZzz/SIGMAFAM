import { useEffect, useState } from "react";
import {
  useAdminFetch, Avatar, Badge, SectionCard, SearchBar, TableHead,
  ActionBtn, Modal, ModalField, InputField, SelectField,
  BtnPrimary, BtnSecondary, LoadingRows, ErrorRow, roleBadgeClass, formatDate,
} from "./adminShared";

export default function AdminUsers() {
  const { apiFetch } = useAdminFetch();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal]   = useState(null);

  function load() {
    setLoading(true);
    apiFetch("/admin/users")
      .then((d) => setUsers(d.users))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = users.filter(
    (u) => !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleEdit(id, data) {
    await apiFetch(`/admin/users/${id}`, { method: "PATCH", body: data });
    load(); setModal(null);
  }

  async function handleDelete(id) {
    await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
    load(); setModal(null);
  }

  async function handlePassword(id, password) {
    await apiFetch(`/admin/users/${id}/password`, { method: "PATCH", body: { password } });
    setModal(null);
  }

  return (
    <>
      <SectionCard title="Usuarios" count={filtered.length}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre, email o rol..." />
        <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-[13px]">
          <TableHead cols={["Usuario", "Rol", "Grupo", "Verificado", "Registrado", "Acciones"]} />
          <tbody>
            {loading ? <LoadingRows cols={6} /> :
             error   ? <ErrorRow cols={6} message={error} /> :
             filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">Sin resultados</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 border-b border-slate-50 last:border-0">
                <td className="px-5 py-2.5">
                  <span className="flex items-center gap-2">
                    <Avatar name={u.full_name} />
                    <span>
                      <div className="font-medium">{u.full_name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </span>
                  </span>
                </td>
                <td className="px-5 py-2.5">
                  <Badge className={roleBadgeClass(u.role)}>{u.role}</Badge>
                </td>
                <td className="px-5 py-2.5 text-slate-500 text-xs">{u.group_name ?? "Sin grupo"}</td>
                <td className="px-5 py-2.5">
                  <Badge className={u.verified ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                    {u.verified ? "Sí" : "No"}
                  </Badge>
                </td>
                <td className="px-5 py-2.5 text-xs text-slate-400">{formatDate(u.created_at)}</td>
                <td className="px-5 py-2.5">
                  <ActionBtn onClick={() => setModal({ type: "edit", user: { ...u } })}>Editar</ActionBtn>
                  <ActionBtn onClick={() => setModal({ type: "pwd", user: u })}>Reset pwd</ActionBtn>
                  {u.role !== "ADMIN" && (
                    <ActionBtn variant="danger" onClick={() => setModal({ type: "delete", user: u })}>Eliminar</ActionBtn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </SectionCard>

      {modal?.type === "edit" && (
        <EditUserModal user={modal.user} onSave={(data) => handleEdit(modal.user.id, data)} onClose={() => setModal(null)} />
      )}
      {modal?.type === "pwd" && (
        <ResetPwdModal user={modal.user} onSave={(pwd) => handlePassword(modal.user.id, pwd)} onClose={() => setModal(null)} />
      )}
      {modal?.type === "delete" && (
        <Modal title="Confirmar eliminación" onClose={() => setModal(null)}
          footer={<><BtnSecondary onClick={() => setModal(null)}>Cancelar</BtnSecondary><BtnPrimary onClick={() => handleDelete(modal.user.id)}>Eliminar</BtnPrimary></>}>
          <p className="text-sm text-slate-600 mb-2">¿Seguro que quieres eliminar este usuario?</p>
          <p className="text-sm font-medium">{modal.user.full_name}</p>
          <p className="text-xs text-slate-400 mt-2">Esta acción no se puede deshacer.</p>
        </Modal>
      )}
    </>
  );
}

function EditUserModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({ full_name: user.full_name, role: user.role });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  async function handleSubmit() {
    setSaving(true); setError("");
    try { await onSave(form); }
    catch (e) { setError(e.message); setSaving(false); }
  }

  return (
    <Modal title="Editar usuario" onClose={onClose}
      footer={<><BtnSecondary onClick={onClose}>Cancelar</BtnSecondary><BtnPrimary variant="default" onClick={handleSubmit} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</BtnPrimary></>}>
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      <ModalField label="Nombre"><InputField value={form.full_name} onChange={set("full_name")} /></ModalField>
      <ModalField label="Rol">
        <SelectField value={form.role} onChange={set("role")}>
          <option value="MIEMBRO">MIEMBRO</option>
          <option value="JEFE_FAMILIA">JEFE_FAMILIA</option>
          <option value="ADMIN">ADMIN</option>
        </SelectField>
      </ModalField>
    </Modal>
  );
}

function ResetPwdModal({ user, onSave, onClose }) {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const mismatch = pwd && confirm && pwd !== confirm;

  async function handleSubmit() {
    if (!pwd || mismatch || pwd.length < 6) { setError("Mínimo 6 caracteres y deben coincidir."); return; }
    setSaving(true); setError("");
    try { await onSave(pwd); setDone(true); }
    catch (e) { setError(e.message); setSaving(false); }
  }

  return (
    <Modal title="Resetear contraseña" onClose={onClose}
      footer={done ? <BtnPrimary variant="default" onClick={onClose}>Listo</BtnPrimary> :
        <><BtnSecondary onClick={onClose}>Cancelar</BtnSecondary><BtnPrimary variant="default" onClick={handleSubmit} disabled={saving}>{saving ? "Guardando..." : "Confirmar"}</BtnPrimary></>}>
      {done ? <p className="text-sm text-emerald-600 font-medium">Contraseña actualizada correctamente.</p> : (
        <>
          <p className="text-sm text-slate-500 mb-4">Nueva contraseña para <span className="font-medium text-slate-700">{user.full_name}</span></p>
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          <ModalField label="Nueva contraseña"><InputField type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Mín. 6 caracteres" /></ModalField>
          <ModalField label="Confirmar contraseña"><InputField type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></ModalField>
          {mismatch && <p className="text-xs text-red-500 -mt-2">Las contraseñas no coinciden.</p>}
        </>
      )}
    </Modal>
  );
}