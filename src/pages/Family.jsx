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
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
      isJefe 
        ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
        : "bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
    }`}>
      {isJefe && <Shield size={10} />} {isJefe ? "Jefe de familia" : "Miembro"}
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
      setError("ERROR AL CREAR GRUPO.");
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
      setError("CÓDIGO INVÁLIDO O GRUPO LLENO.");
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto mt-12 px-4 animate-in fade-in zoom-in duration-500">
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-[28px] bg-slate-900 dark:bg-blue-600 flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/10">
          <Users className="text-white" size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Tu Círculo Familiar</h2>
        <p className="text-slate-500 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.25em] mt-2">
          PROTECCIÓN COLECTIVA EN TIEMPO REAL
        </p>
      </div>

      <Card className="p-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1426] shadow-2xl">
        {!mode ? (
          <div className="space-y-2">
            {[
              { id: 'create', icon: UserPlus, label: 'Serás el administrador', title: 'Crear nuevo grupo' },
              { id: 'join', icon: Shield, label: 'Usa una invitación', title: 'Unirme con código' }
            ].map((btn) => (
              <button key={btn.id} onClick={() => setMode(btn.id)} className="w-full flex items-center gap-5 p-5 rounded-2xl border border-transparent hover:border-blue-500/30 bg-slate-50 dark:bg-white/[0.03] hover:dark:bg-white/[0.05] transition-all group">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#050a18] flex items-center justify-center border border-slate-200 dark:border-slate-800 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <btn.icon size={22} />
                </div>
                <div className="text-left">
                  <p className="font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-widest">{btn.title}</p>
                  <p className="text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase mt-0.5">{btn.label}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <input 
              type="text" 
              className={inputClasses} 
              placeholder={mode === "create" ? "NOMBRE DEL GRUPO" : "CÓDIGO DE 8 DÍGITOS"}
              value={mode === "create" ? name : code}
              onChange={(e) => mode === "create" ? setName(e.target.value) : setCode(e.target.value.toUpperCase())}
            />
            {error && <div className="flex items-center gap-2 text-red-500 px-2 italic"><AlertCircle size={12}/><p className="text-[10px] font-black uppercase">{error}</p></div>}
            <div className="flex gap-2">
              <Button onClick={mode === "create" ? createGroup : joinGroup} disabled={loading} className="flex-1 font-black text-[10px] tracking-widest uppercase py-4 bg-slate-900 dark:bg-blue-600">
                {loading ? <Loader2 className="animate-spin mx-auto" size={16}/> : "Confirmar Acceso"}
              </Button>
              <button className="px-6 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-[10px] tracking-widest uppercase text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all" onClick={() => { setMode(null); setError(""); }}>
                Regresar
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function Family() {
  const { token, user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState(null);

  const fetchGroup = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/family`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setGroup(data.group);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  if (loading) return (
    <PageShell title="Familia" subtitle="RED DE SEGURIDAD">
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Sincronizando Nodos...</p>
      </div>
    </PageShell>
  );

  if (!group) return <PageShell title="Familia" subtitle="GESTIÓN DE GRUPO"><NoGroup token={token} onRefresh={fetchGroup} /></PageShell>;

  const isJefe = user?.role === "JEFE_FAMILIA";

  return (
    <PageShell
      title={group.name}
      subtitle={`MIEMBROS ACTIVOS: ${group.members.length} / 6`}
      right={
        <button onClick={fetchGroup} className="p-3 bg-white dark:bg-[#0d1426] hover:bg-slate-50 dark:hover:bg-blue-600/10 rounded-2xl transition-all text-blue-600 border border-slate-200 dark:border-slate-800 active:scale-95 shadow-sm">
          <RefreshCw size={18} />
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Lado Izquierdo: Código */}
        <div className="lg:col-span-1">
          <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1426] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Shield size={80}/></div>
            <div className="text-center space-y-6 relative z-10">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Protocolo de Invitación</p>
              <div className="py-8 bg-slate-50 dark:bg-[#050a18] rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800 group transition-all hover:border-blue-500/50">
                <span className="font-mono text-4xl font-black tracking-[0.2em] text-slate-900 dark:text-white">
                  {group.invite_code || "--------"}
                </span>
              </div>
              <Button 
                onClick={async () => {
                  await navigator.clipboard.writeText(group.invite_code);
                  setCopied(true); setTimeout(() => setCopied(false), 2000);
                }} 
                className={`w-full py-5 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-xl ${copied ? 'bg-emerald-600' : 'bg-slate-900 dark:bg-blue-600 shadow-blue-500/20'}`}
              >
                {copied ? "Enlace Copiado" : "Copiar Acceso"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Lado Derecho: Tabla */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1426] shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#050a18] border-b border-slate-100 dark:border-slate-800">
                    <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">Identidad Digital</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:table-cell">Rango / Alta</th>
                    <th className="p-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {group.members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-blue-600 font-black text-white flex items-center justify-center shadow-lg border border-white/10 shrink-0 italic text-lg">
                            {m.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-white uppercase text-[12px] tracking-tight">{m.fullName}</p>
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 hidden sm:table-cell">
                        <div className="flex flex-col gap-1.5">
                          <RolePill role={m.role} />
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5 ml-1">
                            <Calendar size={10} className="text-blue-500" /> {formatDate(m.joinedAt)}
                          </p>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        {isJefe && m.role !== "JEFE_FAMILIA" && (
                          <button 
                            onClick={() => { if(confirm("¿ELIMINAR MIEMBRO?")) console.log("delete"); }}
                            className="p-3 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <UserMinus size={18} />
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