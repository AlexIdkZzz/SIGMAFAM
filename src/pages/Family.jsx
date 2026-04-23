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
        INVALID_CODE:    "Código incorrecto o expirado.",
        GROUP_FULL:      "Este grupo ya tiene 6 miembros.",
        ALREADY_IN_GROUP:"Ya perteneces a un grupo familiar.",
      };
      setError(msgs[e.message] ?? "No se pudo unir al grupo.");
    } finally { setLoading(false); }
  }

  return (
    <Card>
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
        </div>
        <p className="text-slate-700 font-semibold mb-1">No perteneces a ningún grupo familiar</p>
        <p className="text-sm text-slate-400 mb-6">Crea uno nuevo o únete con un código de invitación</p>

        {!mode && (
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setMode("create")}>Crear grupo</Button>
            <Button variant="outline" onClick={() => setMode("join")}>Unirme con código</Button>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2">
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
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <div className="flex gap-2">
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
              maxLength={8}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent uppercase"
            />
            <div className="flex gap-2">
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

// ── Componente principal ─────────────────────────────────────────
export default function Family() {
  const { token, user } = useAuth();
  const [group, setGroup]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [copied, setCopied]   = useState(false);
  const [removing, setRemoving] = useState(null);
  const [regenLoading, setRegenLoading] = useState(false);

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

  const isJefe = user?.role === "JEFE_FAMILIA";

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
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      ) : !group ? (
        <NoGroup token={token} onRefresh={fetchGroup} />
      ) : (
        <>
          {/* Info del grupo */}
          <Card title="Grupo familiar">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-lg font-extrabold text-slate-900">{group.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">Creado el {formatDate(group.created_at)}</div>
              </div>
              <div className="text-sm text-slate-500">
                {group.members.length} / 6 miembros
              </div>
            </div>

            {/* Código de invitación — solo JEFE */}
            {isJefe && group.invite_code && (
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-2 font-medium">Código de invitación</div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-2xl font-bold tracking-widest text-slate-900">
                    {group.invite_code}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={copyCode}>
                      {copied ? "✅ Copiado" : "📋 Copiar"}
                    </Button>
                    <Button variant="outline" onClick={regenCode} disabled={regenLoading}>
                      {regenLoading ? "..." : "↺ Regenerar"}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
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
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs text-slate-400 font-medium pb-2 pr-4">Nombre</th>
                    <th className="text-left text-xs text-slate-400 font-medium pb-2 pr-4">Correo</th>
                    <th className="text-left text-xs text-slate-400 font-medium pb-2 pr-4">Rol</th>
                    <th className="text-left text-xs text-slate-400 font-medium pb-2 pr-4">Se unió</th>
                    {isJefe && <th className="pb-2"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {group.members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 pr-4 font-medium text-slate-900">{m.fullName}</td>
                      <td className="py-2.5 pr-4 text-slate-500 text-xs">{m.email}</td>
                      <td className="py-2.5 pr-4"><RolePill role={m.role} /></td>
                      <td className="py-2.5 pr-4 text-xs text-slate-400">{formatDate(m.joinedAt)}</td>
                      {isJefe && (
                        <td className="py-2.5">
                          {m.role !== "JEFE_FAMILIA" && (
                            <button
                              onClick={() => removeMember(m.id)}
                              disabled={removing === m.id}
                              className="text-xs text-red-500 hover:text-red-700 font-medium transition disabled:opacity-50"
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
    </PageShell>
  );
}