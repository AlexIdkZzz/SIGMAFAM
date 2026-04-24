import React, { useEffect, useState, useCallback } from "react";
import { 
  Users, UserPlus, Shield, Copy, RefreshCw, 
  UserMinus, Calendar, Mail, Loader2, CheckCircle2
} from "lucide-react";
import { PageShell, Card, Button, Pill } from "./_ui";
import { useAuth } from "../app/auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

function RolePill({ role }) {
  if (role === "JEFE_FAMILIA") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border border-blue-500/20">
        <Shield size={12} /> Jefe de familia
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
      Miembro
    </span>
  );
}

function formatDate(dt) {
  return new Date(dt).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  }).toUpperCase();
}

// ── Vista: sin grupo (Corregida) ──────────────────
function NoGroup({ token, onRefresh }) {
  const [mode, setMode]       = useState(null); 
  const [name, setName]       = useState("");
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const inputClasses = "w-full px-5 py-4 rounded-2xl border transition-all outline-none bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500/20 dark:bg-[#0a0f1e] dark:border-slate-800 dark:text-white text-sm font-bold";

  // ... (Funciones createGroup y joinGroup se mantienen igual)

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <div className="text-center mb-10">
        <div className="w-24 h-24 rounded-[32px] bg-slate-900 dark:bg-blue-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20 border border-white/10">
          <Users className="text-white" size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Tu Círculo Familiar</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mt-3 opacity-60">
          Protección colectiva en tiempo real
        </p>
      </div>

      <Card className="dark:bg-[#0d1426] dark:border-slate-800 p-2 shadow-2xl">
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
             {/* ... Inputs de create/join con la misma lógica de font-black */}
             <input type="text" className={inputClasses} placeholder="NOMBRE DEL GRUPO" />
             <div className="flex gap-2">
                <Button className="flex-1 font-black text-[10px] tracking-widest uppercase py-4 bg-blue-600">Confirmar</Button>
                <Button variant="outline" className="font-black text-[10px] tracking-widest uppercase py-4" onClick={() => setMode(null)}>Cancelar</Button>
             </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function Family() {
  // ... (fetchGroup y estados se mantienen igual)

  if (!group) return <PageShell title="Familia" subtitle="Gestión de grupo"><NoGroup token={token} onRefresh={fetchGroup} /></PageShell>;

  return (
    <PageShell
      title="Mi Familia"
      subtitle="Panel de administración de miembros"
      right={
        <button onClick={fetchGroup} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 active:scale-90">
          <RefreshCw size={20} />
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Izquierdo: Card de Código */}
        <div className="lg:col-span-1">
          <Card className="dark:bg-[#0d1426] dark:border-slate-800 p-8 shadow-2xl border-t-4 border-t-blue-600">
            <div className="text-center space-y-6">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Invite Code</p>
              <div className="py-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                <span className="font-mono text-4xl font-black tracking-[0.2em] text-slate-900 dark:text-white">
                  {group.invite_code}
                </span>
              </div>
              <Button 
                onClick={copyCode} 
                className={`w-full py-6 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl transition-all shadow-xl ${copied ? 'bg-emerald-500' : 'bg-blue-600 shadow-blue-500/20'}`}
              >
                {copied ? "Copiado" : "Copiar Código"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Lado Derecho: Tabla de Miembros */}
        <div className="lg:col-span-2">
          <Card className="dark:bg-[#0d1426] dark:border-slate-800 overflow-hidden shadow-2xl">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
                  <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Miembro</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:table-cell">Estatus / Fecha</th>
                  <th className="p-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                {group.members.map((m) => (
                  <tr key={m.id} className="group bg-white dark:bg-[#0d1426] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 font-black text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                          {m.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-tight">{m.fullName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 hidden sm:table-cell">
                      <div className="space-y-2">
                        <RolePill role={m.role} />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Calendar size={10} /> {formatDate(m.joinedAt)}
                        </p>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                       {/* Botón de eliminar con el mismo estilo dark */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}