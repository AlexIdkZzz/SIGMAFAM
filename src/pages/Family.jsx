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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-700 border border-sky-200">
        <Shield size={12} /> Jefe de familia
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
      Miembro
    </span>
  );
}

function formatDate(dt) {
  return new Date(dt).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ── Vista: sin grupo ─────────────────────────────────────────────
function NoGroup({ token, onRefresh }) {
  const [mode, setMode]       = useState(null); 
  const [name, setName]       = useState("");
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium transition-all focus:ring-2 focus:ring-slate-200 focus:border-slate-900 outline-none";

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
    <div className="max-w-md mx-auto mt-12">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-[24px] bg-slate-900 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200">
          <Users className="text-white" size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tu Círculo Familiar</h2>
        <p className="text-slate-500 text-sm font-medium mt-2">
          Para comenzar a proteger a los tuyos, crea un grupo o únete a uno existente.
        </p>
      </div>

      <Card>
        {!mode ? (
          <div className="space-y-3 p-2">
            <button onClick={() => setMode("create")} className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all group">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <UserPlus size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Crear nuevo grupo</p>
                  <p className="text-xs text-slate-500">Tú serás el administrador</p>
                </div>
              </div>
            </button>
            <button onClick={() => setMode("join")} className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all group">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Unirme con código</p>
                  <p className="text-xs text-slate-500">Usar invitación de un familiar</p>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4 p-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
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
              <Button className="flex-1" onClick={mode === "create" ? createGroup : joinGroup} disabled={loading}>
                {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Confirmar"}
              </Button>
              <Button variant="outline" onClick={() => { setMode(null); setError(""); }}>Cancelar</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
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
        <button onClick={fetchGroup} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
          <RefreshCw size={18} />
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Info y Código */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="p-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 shadow-lg shadow-slate-200">
                  <Shield className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 leading-tight">{group.name}</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Grupo Familiar</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Miembros</span>
                  <span className="font-bold text-slate-900">{group.members.length} / 6</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-900 transition-all duration-500" 
                    style={{ width: `${(group.members.length / 6) * 100}%` }}
                  />
                </div>
              </div>

              {isJefe && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Código de Invitación</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                    <span className="block font-mono text-3xl font-black tracking-[0.2em] text-slate-900 mb-4">
                      {group.invite_code}
                    </span>
                    
                    {/* BOTÓN REFINADO AZUL SIGMA */}
                    <button 
                      onClick={copyCode}
                      className={`w-full group flex items-center gap-2.5 pl-3.5 pr-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg active:scale-95 mb-3 ${
                        copied 
                        ? "bg-emerald-500 text-white shadow-emerald-100" 
                        : "bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        copied ? "bg-emerald-400" : "bg-blue-500 group-hover:bg-blue-400"
                      }`}>
                        {copied ? <CheckCircle2 size={14} className="text-white" /> : <UserPlus size={14} className="text-white" />}
                      </div>
                      <span>{copied ? "¡Código Copiado!" : "Invitar Miembro"}</span>
                    </button>

                    <button 
                      onClick={regenCode}
                      disabled={regenLoading}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all text-[10px] font-bold uppercase tracking-tight"
                    >
                      <RefreshCw size={12} className={regenLoading ? "animate-spin" : ""} />
                      Regenerar nuevo código
                    </button>
                  </div>

                  <div className="mt-4 flex gap-2 items-start p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <Info className="text-blue-500 shrink-0" size={14} />
                    <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                      Comparte el código con tu familia. Los nuevos miembros tendrán acceso a las alertas compartidas.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Columna Derecha: Tabla de Miembros */}
        <div className="lg:col-span-2">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="pb-4 font-bold text-xs text-slate-400 uppercase tracking-widest px-2">Miembro</th>
                    <th className="pb-4 font-bold text-xs text-slate-400 uppercase tracking-widest hidden sm:table-cell">Rol / Ingreso</th>
                    <th className="pb-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {group.members.map((m) => (
                    <tr key={m.id} className="group">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs border border-white shadow-sm shrink-0">
                            {m.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 leading-none mb-1 truncate">{m.fullName}</p>
                            <p className="text-xs text-slate-400 font-medium flex items-center gap-1 truncate">
                              <Mail size={10} /> {m.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 hidden sm:table-cell">
                        <div className="space-y-1.5">
                          <RolePill role={m.role} />
                          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 px-1">
                            <Calendar size={10} /> {formatDate(m.joinedAt)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        {isJefe && m.role !== "JEFE_FAMILIA" && (
                          <button
                            onClick={() => setRemoving(m.id)}
                            disabled={removing === m.id}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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