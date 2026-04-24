import React, { useEffect, useState, useCallback } from "react";
import { PageShell, Card, Button } from "./_ui";
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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-colors ${
      isWpp 
        ? "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" 
        : "bg-sky-50 border-sky-100 text-sky-600 dark:bg-sky-500/10 dark:border-sky-500/20 dark:text-sky-400"
    }`}>
      {isWpp ? <MessageSquare size={12} /> : <Smartphone size={12} />}
      {channel}
    </span>
  );
}

function ContactForm({ initial, onSave, onCancel, loading }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [channel, setChannel] = useState(initial?.channel ?? "WHATSAPP");

  const inputClasses = "w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#0a0f1e] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none transition-all focus:bg-white dark:focus:bg-[#0d1426] focus:border-slate-900 dark:focus:border-slate-600 focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-white/5 placeholder:text-slate-400 dark:placeholder:text-slate-600";

  return (
    <form 
      onSubmit={(e) => { e.preventDefault(); onSave({ name, phone, channel }); }} 
      className="space-y-5 bg-white dark:bg-[#0d1426] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm animate-in fade-in zoom-in duration-200"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Nombre del contacto</label>
          <div className="relative group">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-slate-900 dark:group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Mamá"
              required
              className={inputClasses}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Teléfono móvil</label>
          <div className="relative group">
            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-slate-900 dark:group-focus-within:text-blue-400 transition-colors" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 1..."
              required
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Canal prioritario</label>
        <div className="grid grid-cols-2 gap-3">
          {["WHATSAPP", "SMS"].map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setChannel(ch)}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-black text-xs transition-all ${
                channel === ch 
                  ? "border-slate-900 bg-slate-900 text-white dark:border-blue-600 dark:bg-blue-600/10 dark:text-blue-400 shadow-md" 
                  : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 dark:border-slate-800 dark:bg-[#0a0f1e] dark:text-slate-500 dark:hover:border-slate-700"
              }`}
            >
              {ch === "WHATSAPP" ? <MessageSquare size={14} /> : <Smartphone size={14} />}
              {ch}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-slate-900 dark:bg-blue-600 text-white py-3 rounded-xl font-black text-sm hover:bg-slate-800 dark:hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Guardar Contacto"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function Contacts() {
  const { token } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchContacts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (e) {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  return (
    <PageShell
      title="Contactos de Emergencia"
      subtitle="Gestiona quién recibirá alertas críticas en tiempo real."
      right={
        contacts.length < MAX_CONTACTS && !showForm && !editing && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-slate-900 dark:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-black text-xs hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-lg active:scale-95"
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">NUEVO CONTACTO</span>
          </button>
        )
      }
    >
      <div className="max-w-4xl space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertTriangle className="text-red-500" size={18} />
            <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {(showForm || editing) && (
          <ContactForm 
            initial={editing} 
            onSave={() => { /* Tu lógica de guardado */ }} 
            onCancel={() => { setShowForm(false); setEditing(null); }} 
            loading={saving} 
          />
        )}

        <Card className="dark:bg-[#0d1426] dark:border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Tus Contactos 
              <span className="ml-3 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-400 dark:text-slate-500 font-bold text-xs">
                {contacts.length} / {MAX_CONTACTS}
              </span>
            </h3>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-4">
              <Loader2 className="animate-spin text-slate-900 dark:text-blue-500" size={32} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando red...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-20 bg-slate-50/50 dark:bg-[#0a0f1e]/50 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-5">
                <UserPlus className="text-slate-300 dark:text-slate-600" size={28} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-6">No hay contactos registrados</p>
              {!showForm && (
                <button 
                  onClick={() => setShowForm(true)}
                  className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-xs text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  CONFIGURAR AHORA
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {contacts.map((c) => (
                <div key={c.id} className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 bg-white dark:bg-[#0a0f1e] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white font-black border border-white/5 shadow-inner">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 dark:text-slate-100">{c.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">{c.phone}</span>
                        <ChannelPill channel={c.channel} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditing(c)}
                      className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => {}}
                      disabled={deleting === c.id}
                      className="p-2.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-30"
                    >
                      {deleting === c.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Nota informativa */}
        <div className="bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl p-5 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
            <Smartphone className="text-amber-600 dark:text-amber-500" size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-800 dark:text-amber-500 uppercase tracking-wider">Estado del servicio de mensajería</h4>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/70 leading-relaxed font-bold mt-1">
              WhatsApp puede presentar retrasos. Recomendamos configurar al menos un contacto con <span className="text-amber-900 dark:text-amber-300">SMS</span> como canal prioritario para garantizar la recepción.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}