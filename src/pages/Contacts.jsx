import React, { useEffect, useState } from "react";
import { PageShell, Card } from "./_ui";
import { useAuth } from "../app/auth/AuthContext";
import { 
  UserPlus, Phone, MessageSquare, Smartphone, 
  Trash2, Edit3, Loader2, AlertTriangle, User 
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
const MAX_CONTACTS = 5;

function ChannelPill({ channel }) {
  const isWpp = channel === "WHATSAPP";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border transition-all ${
      isWpp 
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
        : "bg-blue-500/10 border-blue-500/20 text-blue-500"
    }`}>
      {isWpp ? <MessageSquare size={10} /> : <Smartphone size={10} />}
      {channel}
    </span>
  );
}

function ContactForm({ initial, onSave, onCancel, loading }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [channel, setChannel] = useState(initial?.channel ?? "WHATSAPP");

  const inputClasses = "w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#0a0f1e] border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white outline-none transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-700";

  return (
    <form 
      onSubmit={(e) => { e.preventDefault(); onSave({ name, phone, channel }); }} 
      className="space-y-6 bg-white dark:bg-[#0d1426] border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-300"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Identificador</label>
          <div className="relative group">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors" />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="NOMBRE DEL CONTACTO" required className={inputClasses} />
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Línea de contacto</label>
          <div className="relative group">
            <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+52 1..." required className={inputClasses} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Protocolo de Notificación</label>
        <div className="grid grid-cols-2 gap-4">
          {["WHATSAPP", "SMS"].map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setChannel(ch)}
              className={`flex items-center justify-center gap-3 py-4 rounded-2xl border-2 font-black text-xs tracking-widest transition-all ${
                channel === ch 
                  ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]" 
                  : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0a0f1e] text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
              }`}
            >
              {ch === "WHATSAPP" ? <MessageSquare size={16} /> : <Smartphone size={16} />}
              {ch}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button type="submit" disabled={loading} className="flex-1 bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-2xl font-black text-[11px] tracking-[0.2em] uppercase hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "REGISTRAR CONTACTO"}
        </button>
        <button type="button" onClick={onCancel} className="px-8 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-[11px] tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
          CANCELAR
        </button>
      </div>
    </form>
  );
}

export default function Contacts() {
  const { token } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/contacts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setContacts(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  return (
    <PageShell
      title="Contactos de Emergencia"
      subtitle="GESTIÓN DE RED CRÍTICA"
      right={
        contacts.length < MAX_CONTACTS && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-3 bg-slate-900 dark:bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-[0.15em] hover:shadow-2xl hover:shadow-blue-500/20 transition-all active:scale-95"
          >
            <UserPlus size={18} />
            NUEVO CONTACTO
          </button>
        )
      }
    >
      <div className="max-w-5xl space-y-8 pb-12">
        {showForm && <ContactForm onSave={() => {}} onCancel={() => setShowForm(false)} loading={false} />}

        <div className="contacts-table-container">
          <Card className="p-8 shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-10 border-b border-slate-100 dark:border-slate-800/50 pb-6">
              <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
                Protocolos Activos 
                <span className="ml-4 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg font-black text-xs">
                  {contacts.length} / {MAX_CONTACTS}
                </span>
              </h3>
            </div>

            {loading ? (
               <div className="py-20 flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-blue-500" size={40} />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizando seguridad...</p>
               </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-24 bg-slate-50/50 dark:bg-[#0a0f1e]/40 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800/60">
                <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[28px] shadow-xl flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-slate-800">
                  <UserPlus className="text-slate-300 dark:text-slate-700" size={32} />
                </div>
                <p className="text-slate-400 dark:text-slate-500 font-black text-xs uppercase tracking-widest mb-8">Base de contactos vacía</p>
                {!showForm && (
                  <button onClick={() => setShowForm(true)} className="px-10 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase hover:scale-105 transition-all shadow-xl">
                    INICIAR CONFIGURACIÓN
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {contacts.map((c) => (
                  <div key={c.id} className="group flex items-center justify-between p-6 rounded-[24px] border border-slate-100 dark:border-slate-800/50 bg-white dark:bg-[#0b1222] hover:dark:bg-[#0d1426] hover:dark:border-blue-500/30 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/10 shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-tight mb-1">{c.name}</div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-black text-slate-400 dark:text-slate-500">{c.phone}</span>
                          <ChannelPill channel={c.channel} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-all transform md:translate-x-2 md:group-hover:translate-x-0">
                      <button className="p-3 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all">
                        <Edit3 size={18} />
                      </button>
                      <button className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 flex gap-5 items-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
            <AlertTriangle className="text-amber-500" size={24} />
          </div>
          <p className="text-[11px] text-amber-500/80 leading-relaxed font-black uppercase tracking-tight">
            WhatsApp puede presentar latencia. <span className="text-amber-500 underline decoration-2">Recomendamos</span> configurar al menos un contacto con SMS para asegurar la entrega en zonas de baja cobertura.
          </p>
        </div>
      </div>

      <style>{`
        /* FORZAR FONDO OSCURO EN CARD DE CONTACTOS */
        .dark .contacts-table-container > div {
          background-color: #050a18 !important;
          border-color: #0f172a !important;
        }

        /* Asegurar que el título y otros textos se mantengan blancos */
        .dark .contacts-table-container h3 {
          color: #ffffff !important;
        }
        
        .dark .contacts-table-container .group {
          background-color: #0b1222 !important;
        }

        .dark .contacts-table-container .group:hover {
          background-color: #0d1426 !important;
          border-color: rgba(59, 130, 246, 0.3) !important;
        }
      `}</style>
    </PageShell>
  );
}