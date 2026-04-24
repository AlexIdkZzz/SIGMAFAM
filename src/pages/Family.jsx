import React, { useEffect, useState, useCallback } from "react";
import { 
  Users, UserPlus, Shield, Copy, RefreshCw, 
  UserMinus, Calendar, Loader2, CheckCircle2,
  AlertCircle
} from "lucide-react";
import { PageShell, Card, Button } from "./_ui";
import { useAuth } from "../app/auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

function RolePill({ role }) {
  const isJefe = role === "JEFE_FAMILIA";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
      isJefe 
        ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
    }`}>
      {isJefe && <Shield size={12} />} {isJefe ? "Jefe de familia" : "Miembro"}
    </span>
  );
}

function formatDate(dt) {
  return new Date(dt).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  }).toUpperCase();
}

function NoGroup({ token, onRefresh }) {
  const [mode, setMode] = useState(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputClasses = "w-full px-5 py-4 rounded-2xl border transition-all outline-none bg-slate-50 dark:bg-[#0a0f1e] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-black uppercase placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500";

  async function createGroup() {
    if (!name.trim()) { setError("ESCRIBE UN NOMBRE PARA TU GRUPO."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/family/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onRefresh();
    } catch (e) {
      setError(e.message === "ALREADY_IN_GROUP" ? "YA PERTENECES A UN GRUPO." : "ERROR AL CREAR GRUPO.");
    } finally { setLoading(false); }
  }

  async function joinGroup() {
    if (!code.trim()) { setError("INGRESA EL CÓDIGO."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/family/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ invite_code: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onRefresh();
    } catch (e) {
      const msgs = { INVALID_CODE: "CÓDIGO INVÁLIDO.", GROUP_FULL: "GRUPO LLENO.", ALREADY_IN_GROUP: "YA TIENES GRUPO." };
      setError(msgs[e.message] ?? "ERROR AL UNIRSE.");
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto mt-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <div className="w-24 h-24 rounded-[32px] bg-slate-900 dark:bg-blue-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20 border border-white/10">
          <Users className="text-white" size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Tu Círculo Familiar</h2>
        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-60">
          Protección colectiva en tiempo real
        </p>
      </div>

      <div className="family-card-container">
        <Card className="p-2 shadow-2xl">
          {!mode ? (
            <div className="space-y-2">
              <button onClick={() => setMode("create")} className="w-full flex items-center justify-between p-5 rounded-2xl border border-transparent hover:border-blue-500/30 bg-slate-50 dark:bg-white/[0.03] hover:dark:bg-white/[0.05] transition-all group">
                <div className="flex items-center gap-5 text-left">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest">Crear nuevo grupo</p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Serás el administrador</p>
                  </div>
                </div>
              </button>
              <button onClick={() => setMode("join")} className="w-full flex items-center justify-between p-5 rounded-2xl border border-transparent hover:border-blue-500/30 bg-slate-50 dark:bg-white/[0.03] hover:dark:bg-white/[0.05] transition-all group">
                <div className="flex items-center gap-5 text-left">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <Shield size={24} />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest">Unirme con código</p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Usa una invitación</p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <input 
                type="text" 
                className={inputClasses} 
                placeholder={mode === "create" ? "NOMBRE DEL GRUPO" : "CÓDIGO DE 8 DÍGITOS"}
                value={mode === "create" ? name : code}
                onChange={(e) => mode === "create" ? setName(e.target.value) : setCode(e.target.value.toUpperCase())}
                maxLength={mode === "join" ? 8 : 40}
              />
              {error && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest px-2">{error}</p>}
              <div className="flex gap-2">
                <Button 
                  onClick={mode === "create" ? createGroup : joinGroup} 
                  disabled={loading}
                  className="flex-1 font-black text-[10px] tracking-widest uppercase py-4 bg-blue-600"
                >
                  {loading ? "Procesando..." : "Confirmar"}
                </Button>
                <button className="px-6 py-4 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-[10px] tracking-widest uppercase text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all" onClick={() => { setMode(null); setError(""); }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function Family() {
  const { token, user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [regenLoading, setRegenLoading] = useState(false);

  const fetchGroup = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/family`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGroup(data.group);
    } catch (e) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenCode = async () => {
    setRegenLoading(true);
    try {
      const res = await fetch(`${API_BASE}/family/regenerate-code`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGroup(g => ({ ...g, invite_code: data.invite_code }));
    } catch (e) {
      setError("NO SE PUDO REGENERAR EL CÓDIGO.");
    } finally { setRegenLoading(false); }
  };

  const removeMember = async (memberId) => {
    if (!confirm("¿REMOVER MIEMBRO DEL GRUPO?")) return;
    setRemoving(memberId);
    try {
      const res = await fetch(`${API_BASE}/family/members/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      fetchGroup();
    } catch (e) {
      setError("ERROR AL REMOVER.");
    } finally { setRemoving(null); }
  };

  if (loading) return (
    <PageShell title="Familia" subtitle="Sincronizando seguridad">
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Accediendo a la red...</p>
      </div>
    </PageShell>
  );

  if (!group) return (
    <PageShell title="Familia" subtitle="Gestión de grupo">
      <NoGroup token={token} onRefresh={fetchGroup} />
    </PageShell>
  );

  const isJefe = user?.role === "JEFE_FAMILIA";

  return (
    <PageShell
      title={group.name}
      subtitle={`GRUPO DE ${group.members.length} / 6 MIEMBROS`}
      right={
        <button onClick={fetchGroup} className="p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl transition-all text-blue-600 dark:text-blue-500 active:scale-90 border border-slate-200 dark:border-white/10">
          <RefreshCw size={20} />
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500 family-card-container">
        {/* Lado Izquierdo: Código de Invitación */}
        <div className="lg:col-span-1">
          <Card className="p-8 shadow-2xl border-t-4 border-t-blue-600">
            <div className="text-center space-y-6">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Invite Code</p>
              <div className="py-8 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-700">
                <span className="font-mono text-4xl font-black tracking-[0.2em] text-slate-900 dark:text-white">
                  {group.invite_code || "--------"}
                </span>
              </div>
              
              {isJefe ? (
                <div className="space-y-3">
                  <Button 
                    onClick={copyCode} 
                    className={`w-full py-5 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-xl ${copied ? 'bg-emerald-600' : 'bg-blue-600 shadow-blue-500/20'}`}
                  >
                    {copied ? "¡Copiado!" : "Copiar Código"}
                  </Button>
                  <button 
                    onClick={regenCode} 
                    disabled={regenLoading}
                    className="w-full text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest transition-colors py-2"
                  >
                    {regenLoading ? "Generando..." : "Regenerar nuevo código"}
                  </button>
                </div>
              ) : (
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-relaxed px-4">
                  Solo el jefe de familia puede gestionar el código de invitación.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Lado Derecho: Tabla de Miembros */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                    <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Identidad</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:table-cell">Estatus</th>
                    <th className="p-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {group.members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-blue-600 font-black text-white flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10 shrink-0">
                            {m.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-tight">{m.fullName}</p>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 hidden sm:table-cell">
                        <div className="flex flex-col gap-2 items-start">
                          <RolePill role={m.role} />
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1">
                            <Calendar size={10} /> {formatDate(m.joinedAt)}
                          </p>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        {isJefe && m.role !== "JEFE_FAMILIA" && (
                          <button 
                            onClick={() => removeMember(m.id)}
                            disabled={removing === m.id}
                            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
                          >
                            {removing === m.id ? <Loader2 className="animate-spin" size={18} /> : <UserMinus size={18} />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <style>{`
        /* FUERZA BRUTA PARA DARK MODE EN FAMILY */
        .dark .family-card-container > div {
          background-color: #050a18 !important;
          border-color: #0f172a !important;
        }

        .dark .family-card-container table {
          background-color: transparent !important;
        }

        .dark .family-card-container h2,
        .dark .family-card-container h3,
        .dark .family-card-container p.text-white {
          color: white !important;
        }
      `}</style>
    </PageShell>
  );
}