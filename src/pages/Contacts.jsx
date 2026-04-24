import React, { useEffect, useState, useCallback } from "react";
import { PageShell, Card, Button, Pill } from "./_ui";
import { useAuth } from "../app/auth/AuthContext";
import { 
  UserPlus, Phone, MessageSquare, Smartphone, 
  Trash2, Edit3, Loader2, AlertTriangle, User 
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
const MAX_CONTACTS = 5;

// Componente de Pill Refinado
function ChannelPill({ channel }) {
  const isWpp = channel === "WHATSAPP";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
      isWpp 
        ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
        : "bg-sky-50 border-sky-100 text-sky-600"
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

  return (
    <form 
      onSubmit={(e) => { e.preventDefault(); onSave({ name, phone, channel }); }} 
      className="space-y-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in zoom-in duration-200"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 ml-1">Nombre del contacto</label>
          <div className="relative group">
            <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Mamá"
              required
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none transition-all focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 ml-1">Teléfono móvil</label>
          <div className="relative group">
            <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 1..."
              required
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none transition-all focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 ml-1">Canal de notificación prioritario</label>
        <div className="grid grid-cols-2 gap-3">
          {["WHATSAPP", "SMS"].map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setChannel(ch)}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-xs transition-all ${
                channel === ch 
                  ? "border-slate-900 bg-slate-900 text-white shadow-md" 
                  : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
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
          className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Guardar Contacto"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all"
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

  // Handlers (Create, Edit, Delete) se mantienen igual en lógica...
  // [Omitidos por brevedad, usa tu lógica original]

  return (
    <PageShell
      title="Contactos de Emergencia"
      subtitle="Gestiona quién recibirá alertas críticas en tiempo real."
      right={
        contacts.length < MAX_CONTACTS && !showForm && !editing && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Nuevo Contacto</span>
          </button>
        )
      }
    >
      <div className="max-w-4xl space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertTriangle className="text-red-500" size={18} />
            <p className="text-sm font-bold text-red-700">{error}</p>
          </div>
        )}

        {showForm && (
          <ContactForm onSave={handleCreate} onCancel={() => setShowForm(false)} loading={saving} />
        )}

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black tracking-tight text-slate-900">
              Tus Contactos 
              <span className="ml-2 text-slate-400 font-medium text-sm">{contacts.length}/{MAX_CONTACTS}</span>
            </h3>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <Loader2 className="animate-spin text-slate-900" size={32} />
              <p className="text-xs font-bold uppercase tracking-widest">Sincronizando...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                <UserPlus className="text-slate-300" size={28} />
              </div>
              <p className="text-slate-500 font-bold text-sm mb-4">No hay contactos registrados</p>
              {!showForm && (
                <Button onClick={() => setShowForm(true)} variant="outline">Configurar ahora</Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {contacts.map((c) => (
                <div key={c.id} className="group transition-all">
                  {editing?.id === c.id ? (
                    <ContactForm initial={c} onSave={handleEdit} onCancel={() => setEditing(null)} loading={saving} />
                  ) : (
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-300 hover:shadow-md hover:shadow-slate-100 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black shadow-inner">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-slate-400">{c.phone}</span>
                            <ChannelPill channel={c.channel} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditing(c)}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deleting === c.id}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                        >
                          {deleting === c.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Nota informativa con estilo Alert del Login */}
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Smartphone className="text-amber-600" size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-amber-800">Estado del servicio</h4>
            <p className="text-xs text-amber-700/80 leading-relaxed font-medium mt-1">
              WhatsApp presenta intermitencias globales. Recomendamos configurar <strong>SMS</strong> como canal de respaldo para asegurar la entrega de alertas.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}