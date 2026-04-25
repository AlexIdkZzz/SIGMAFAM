import React, { useEffect, useState, useCallback } from "react";
import { PageShell, Card, Button, Pill } from "./_ui";
import { useAuth } from "../app/auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

function RolePill({ role }) {
  if (role === "JEFE_FAMILIA") return <Pill variant="blue">Jefe de familia</Pill>;
  return <Pill variant="slate">Miembro</Pill>;
}

function formatDate(dt) {
  return new Date(dt).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ── Vista: sin grupo ─────────────────────────────────────────────
function NoGroup({ token, onRefresh }) {
  const [mode, setMode]       = useState(null); // "create" | "join"
  const [name, setName]       = useState("");
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function createGroup() {
    if (!name.trim()) { setError("Escribe un nombre para tu grupo."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API_BASE}/family/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onRefresh();
    } catch (e) {
      const msgs = { ALREADY_IN_GROUP: "Ya perteneces a un grupo familiar." };
      setError(msgs[e.message] ?? "No se pudo crear el grupo.");
    } finally { setLoading(false); }
  }

  async function joinGroup() {
    if (!code.trim()) { setError("Ingresa el código de invitación."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API_BASE}/family/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ invite_code: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onRefresh();
    } catch (e) {
      const msgs = {
        INVALID_CODE:     "Código incorrecto o expirado.",
        GROUP_FULL:       "Este grupo ya tiene 6 miembros.",
        ALREADY_IN_GROUP: "Ya perteneces a un grupo familiar.",
      };
      setError(msgs[e.message] ?? "No se pudo unir al grupo.");
    } finally { setLoading(false); }
  }

  return (
    <Card>
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
        </div>
        <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">No perteneces a ningún grupo familiar</p>
        <p className="text-sm text-slate-400 mb-6">Crea uno nuevo o únete con un código de invitación</p>

        {!mode && (
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setMode("create")}>Crear grupo</Button>
            <Button variant="outline" onClick={() => setMode("join")}>Unirme con código</Button>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        {mode === "create" && (
          <div className="mt-4 space-y-3 max-w-xs mx-auto">
            <input
              type="text"
              placeholder="Nombre del grupo (ej: Familia De Alba)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createGroup()}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 focus:border-transparent"
            />
            <div className="flex gap-2 justify-center">
              <Button onClick={createGroup} disabled={loading}>
                {loading ? "Creando..." : "Crear"}
              </Button>
              <Button variant="outline" onClick={() => { setMode(null); setError(""); }}>Cancelar</Button>
            </div>
          </div>
        )}

        {mode === "join" && (
          <div className="mt-4 space-y-3 max-w-xs mx-auto">
            <input
              type="text"
              placeholder="Código de invitación (ej: A3F9B2C1)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinGroup()}
              maxLength={8}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 focus:border-transparent uppercase"
            />
            <div className="flex gap-2 justify-center">
              <Button onClick={joinGroup} disabled={loading}>
                {loading ? "Uniéndome..." : "Unirme"}
              </Button>
              <Button variant="outline" onClick={() => { setMode(null); setError(""); }}>Cancelar</Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Modal de confirmación para disolver ──────────────────────────
function DissolveModal({ groupName, loading, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm shadow-xl p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 text-center mb-1">
          Disolver grupo familiar
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-1">
          ¿Seguro que quieres disolver <span className="font-semibold text-slate-700 dark:text-slate-200">{groupName}</span>?
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-6">
          Todos los miembros quedarán sin grupo. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Disolviendo..." : "Sí, disolver"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────
export default function Family() {
  const { token, user } = useAuth();
  const [group, setGroup]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [copied, setCopied]           = useState(false);
  const [removing, setRemoving]       = useState(null);
  const [regenLoading, setRegenLoading]     = useState(false);
  const [showDissolve, setShowDissolve]     = useState(false);
  const [dissolveLoading, setDissolveLoading] = useState(false);

  const fetchGroup = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API_BASE}/family`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGroup(data.group);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  async function copyCode() {
    await navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function regenCode() {
    setRegenLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/family/regenerate-code`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGroup((g) => ({ ...g, invite_code: data.invite_code }));
    } catch (e) {
      setError("No se pudo regenerar el código.");
    } finally { setRegenLoading(false); }
  }

  async function removeMember(memberId) {
    setRemoving(memberId);
    try {
      const res = await fetch(`${API_BASE}/family/members/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchGroup();
    } catch (e) {
      setError("No se pudo remover al miembro.");
    } finally { setRemoving(null); }
  }

  async function dissolveGroup() {
    setDissolveLoading(true);
    try {
      const res = await fetch(`${API_BASE}/family`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowDissolve(false);
      fetchGroup();
    } catch (e) {
      setError("No se pudo disolver el grupo.");
      setShowDissolve(false);
    } finally { setDissolveLoading(false); }
  }

  // El servidor solo devuelve invite_code si el usuario es JEFE_FAMILIA en la BD
  // (no depende del JWT que puede estar desactualizado tras crear el grupo)
  const isJefe = group !== null && group.invite_code !== null;

  return (
    <PageShell
      title="Familia"
      subtitle="Gestión del grupo familiar."
      right={<Button variant="outline" onClick={fetchGroup}>↺ Actualizar</Button>}
    >
      {loading ? (
        <Card>
          <div className="flex items-center justify-center h-32 text-slate-400 gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
            Cargando...
          </div>
        </Card>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>
      ) : !group ? (
        <NoGroup token={token} onRefresh={fetchGroup} />
      ) : (
        <>
          {/* Info del grupo */}
          <Card title="Grupo familiar">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{group.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">Creado el {formatDate(group.created_at)}</div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {group.members.length} / 6 miembros
                </span>
                {isJefe && (
                  <button
                    onClick={() => setShowDissolve(true)}
                    className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    Disolver grupo
                  </button>
                )}
              </div>
            </div>

            {/* Código de invitación — solo JEFE */}
            {isJefe && (
              <div className="mt-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">Código de invitación</div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-2xl font-bold tracking-widest text-slate-900 dark:text-slate-100">
                    {group.invite_code}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={copyCode}>
                      {copied ? "✅ Copiado" : "📋 Copiar"}
                    </Button>
                    <Button variant="outline" onClick={regenCode} disabled={regenLoading}>
                      {regenLoading ? "..." : "↺ Nuevo código"}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  Comparte este código con los miembros que quieras invitar. Máximo 6 personas en total.
                </p>
              </div>
            )}
          </Card>

          {/* Tabla de miembros */}
          <Card title={`Miembros (${group.members.length}/6)`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left text-xs text-slate-400 font-medium pb-2 pr-4">Nombre</th>
                    <th className="text-left text-xs text-slate-400 font-medium pb-2 pr-4">Correo</th>
                    <th className="text-left text-xs text-slate-400 font-medium pb-2 pr-4">Rol</th>
                    <th className="text-left text-xs text-slate-400 font-medium pb-2 pr-4">Se unió</th>
                    {isJefe && <th className="pb-2"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {group.members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-slate-100">{m.fullName}</td>
                      <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400 text-xs">{m.email}</td>
                      <td className="py-2.5 pr-4"><RolePill role={m.role} /></td>
                      <td className="py-2.5 pr-4 text-xs text-slate-400 dark:text-slate-500">{formatDate(m.joinedAt)}</td>
                      {isJefe && (
                        <td className="py-2.5">
                          {m.role !== "JEFE_FAMILIA" && (
                            <button
                              onClick={() => removeMember(m.id)}
                              disabled={removing === m.id}
                              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium transition disabled:opacity-50"
                            >
                              {removing === m.id ? "..." : "Remover"}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {showDissolve && (
        <DissolveModal
          groupName={group?.name}
          loading={dissolveLoading}
          onConfirm={dissolveGroup}
          onCancel={() => setShowDissolve(false)}
        />
      )}
    </PageShell>
  );
}
