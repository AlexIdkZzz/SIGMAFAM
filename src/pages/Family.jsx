import React, { useEffect, useState, useCallback } from "react";
import { 
  Users, UserPlus, Shield, Copy, RefreshCw, 
  UserMinus, Calendar, Mail, Loader2, Info, CheckCircle2
} from "lucide-react";
import { PageShell, Card, Button, Pill } from "./_ui";
import { useAuth } from "../app/auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

function RolePill({ role }) {
  if (role === "JEFE_FAMILIA") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20">
        <Shield size={12} /> Jefe de familia
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
      Miembro
    </span>
  );
}

function formatDate(dt) {
  return new Date(dt).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ── Vista: sin grupo (Ajustada para Dark Mode) ──────────────────
function NoGroup({ token, onRefresh }) {
  const [mode, setMode]       = useState(null); 
  const [name, setName]       = useState("");
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const inputClasses = "w-full px-4 py-3 rounded-xl border transition-all focus:ring-2 outline-none bg-white border-slate-200 text-slate-900 focus:ring-slate-200 focus:border-slate-900 dark:bg-[#0a0f1e] dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-800 dark:focus:border-slate-600 text-sm font-medium";

  async function createGroup() {
    if (!name.trim()) { setError("Escribe un nombre para tu grupo."); return; }
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
      setError("No se pudo crear el grupo familiar.");
    } finally { setLoading(false); }
  }

  async function joinGroup() {
    if (!code.trim()) { setError("Ingresa el código de invitación."); return; }
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
      const msgs = { INVALID_CODE: "Código incorrecto.", GROUP_FULL: "Grupo lleno." };
      setError(msgs[e.message] ?? "Error al unirse.");
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-[24px] bg-slate-900 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200 dark:shadow-none border border-white/10">
          <Users className="text-white" size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Tu Círculo Familiar</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2">
          Crea un grupo para proteger a los tuyos o únete a uno existente.
        </p>
      </div>

      <Card className="dark:bg-[#0d1426] dark:border-slate-800">
        {!mode ? (
          <div className="space-y-3 p-2">
            <button onClick={() => setMode("create")} className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all group">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <UserPlus size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Crear nuevo grupo</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tú serás el administrador</p>
                </div>
              </div>
            </button>
            <button onClick={() => setMode("join")} className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all group">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Unirme con código</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Usar invitación de un familiar</p>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {mode === "create" ? "Configura tu familia" : "Ingresa el código"}
            </h3>
            <input
              type="text"
              placeholder={mode === "create" ? "Nombre de la familia..." : "CÓDIGO-123"}
              value={mode === "create" ? name : code}
              onChange={(e) => mode === "create" ? setName(e.target.value) : setCode(e.target.value.toUpperCase())}
              className={`${inputClasses} ${mode === "join" ? "font-mono tracking-widest text-center text-lg" : ""}`}
            />
            {error && <p className="text-xs font-bold text-red-500 px-1">{error}</p>}
            <div className="flex gap-2">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-none" onClick={mode === "create" ? createGroup : joinGroup} disabled={loading}>
                {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Confirmar"}
              </Button>
              <Button variant="outline" className="dark:border-slate-700 dark:text-slate-400" onClick={() => { setMode(null); setError(""); }}>Cancelar</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Componente Principal ─────────────────────────────────────────
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
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/family`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGroup(data.group);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  async function copyCode() {
    if (!group?.invite_code) return;
    await navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function regenCode() {
    if(!window.confirm("¿Seguro? El código anterior dejará de funcionar.")) return;
    setRegenLoading(true);
    try {
      const res = await fetch(`${API_BASE}/family/regenerate-code`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setGroup((g) => ({ ...g, invite_code: data.invite_code }));
    } catch (e) {
      setError("Error al regenerar código.");
    } finally { setRegenLoading(false); }
  }

  const isJefe = user?.role === "JEFE_FAMILIA";

  if (loading) return (
    <PageShell title="Familia" subtitle="Gestión de grupo">
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="text-sm font-bold tracking-tighter uppercase">Sincronizando datos...</p>
      </div>
    </PageShell>
  );

  if (!group) return <PageShell title="Familia" subtitle="Gestión de grupo"><NoGroup token={token} onRefresh={fetchGroup} /></PageShell>;

  return (
    <PageShell
      title="Mi Familia"
      subtitle="Administra los miembros y el acceso."
      right={
        <button onClick={fetchGroup} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
          <RefreshCw size={18} />
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Info y Código */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="dark:bg-[#0d1426] dark:border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-white/10 shadow-lg">
                <Shield className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white leading-tight">{group.name}</h3>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Grupo Familiar</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Capacidad</span>
                <span className="font-bold text-slate-900 dark:text-white">{group.members.length} / 6</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500" 
                  style={{ width: `${(group.members.length / 6) * 100}%` }}
                />
              </div>
            </div>

            {isJefe && (
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-300 mb-3 uppercase tracking-wider">Código de Invitación</p>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center">
                  <span className="block font-mono text-3xl font-black tracking-[0.2em] text-slate-900 dark:text-white mb-4">
                    {group.invite_code}
                  </span>
                  
                  <button 
                    onClick={copyCode}
                    className={`w-full group flex items-center gap-2.5 pl-3.5 pr-5 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 mb-3 ${
                      copied 
                      ? "bg-emerald-500 text-white" 
                      : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                      {copied ? <CheckCircle2 size={14} /> : <UserPlus size={14} />}
                    </div>
                    <span>{copied ? "¡Código Copiado!" : "Copiar Invitación"}</span>
                  </button>

                  <button 
                    onClick={regenCode}
                    disabled={regenLoading}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all text-[10px] font-bold uppercase tracking-tight"
                  >
                    <RefreshCw size={12} className={regenLoading ? "animate-spin" : ""} />
                    Regenerar código
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Tabla de Miembros (Dark Mode Fix) */}
        <div className="lg:col-span-2">
          <Card className="dark:bg-[#0d1426] dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                    <th className="p-5 font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest px-6">Miembro</th>
                    <th className="p-5 font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:table-cell">Rol / Ingreso</th>
                    <th className="p-5 text-right px-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {group.members.map((m) => (
                    <tr key={m.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 text-xs border border-white dark:border-slate-700 shrink-0">
                            {m.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-0.5 truncate">{m.fullName}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 truncate font-medium">
                              <Mail size={10} /> {m.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 hidden sm:table-cell">
                        <div className="flex flex-col items-start gap-1.5">
                          <RolePill role={m.role} />
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                            <Calendar size={10} /> {formatDate(m.joinedAt)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right px-6">
                        {isJefe && m.role !== "JEFE_FAMILIA" && (
                          <button
                            onClick={() => setRemoving(m.id)}
                            disabled={removing === m.id}
                            className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Eliminar miembro"
                          >
                            {removing === m.id ? <Loader2 className="animate-spin" size={16} /> : <UserMinus size={16} />}
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
    </PageShell>
  );
}