import React, { useEffect, useState, useCallback } from "react";
import { PageShell, Card, Button, Pill } from "./_ui";
import { useAuth } from "../app/auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
const MAX_CONTACTS = 5;

function ChannelPill({ channel }) {
  return channel === "WHATSAPP"
    ? <Pill variant="green">💬 WhatsApp</Pill>
    : <Pill variant="blue">📱 SMS</Pill>;
}

function ContactForm({ initial, onSave, onCancel, loading }) {
  const [name,    setName]    = useState(initial?.name    ?? "");
  const [phone,   setPhone]   = useState(initial?.phone   ?? "");
  const [channel, setChannel] = useState(initial?.channel ?? "WHATSAPP");

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ name, phone, channel });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mamá, Papá, etc."
            required
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono (con código de país)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+5213312345678"
            required
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Canal de notificación</label>
        <div className="flex gap-3">
          {["WHATSAPP", "SMS"].map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setChannel(ch)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition"
              style={{
                background: channel === ch ? "#0f172a" : "#f1f5f9",
                color:      channel === ch ? "#ffffff" : "#475569",
              }}
            >
              {ch === "WHATSAPP" ? "💬 WhatsApp" : "📱 SMS"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

export default function Contacts() {
  const { token } = useAuth();

  const [contacts, setContacts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null); // contacto en edición
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);

  const fetchContacts = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API_BASE}/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setContacts(data.contacts);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  async function handleCreate(formData) {
    setSaving(true); setError("");
    try {
      const res  = await fetch(`${API_BASE}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "MAX_CONTACTS_REACHED")
          throw new Error("Ya tienes el máximo de 5 contactos.");
        throw new Error(data.error);
      }
      setShowForm(false);
      fetchContacts();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(formData) {
    setSaving(true); setError("");
    try {
      const res  = await fetch(`${API_BASE}/contacts/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditing(null);
      fetchContacts();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeleting(id); setError("");
    try {
      await fetch(`${API_BASE}/contacts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchContacts();
    } catch (e) {
      setError("No se pudo eliminar el contacto.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <PageShell
      title="Contactos de emergencia"
      subtitle="Se notificarán automáticamente cuando se active una alerta."
      right={
        contacts.length < MAX_CONTACTS && !showForm && !editing ? (
          <Button onClick={() => setShowForm(true)}>+ Agregar contacto</Button>
        ) : null
      }
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Formulario nuevo contacto */}
      {showForm && (
        <ContactForm
          onSave={handleCreate}
          onCancel={() => { setShowForm(false); setError(""); }}
          loading={saving}
        />
      )}

      <Card title={`${contacts.length} / ${MAX_CONTACTS} contactos`}>
        {loading ? (
          <div className="flex items-center justify-center h-24 text-slate-400 gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
            Cargando...
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm mb-3">Sin contactos de emergencia aún.</p>
            <Button onClick={() => setShowForm(true)}>+ Agregar primer contacto</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => (
              <div key={c.id}>
                {editing?.id === c.id ? (
                  <ContactForm
                    initial={c}
                    onSave={handleEdit}
                    onCancel={() => { setEditing(null); setError(""); }}
                    loading={saving}
                  />
                ) : (
                  <div className="flex items-center justify-between gap-3 py-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{c.name}</div>
                        <div className="text-xs text-slate-400">{c.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ChannelPill channel={c.channel} />
                      <button
                        onClick={() => { setEditing(c); setShowForm(false); }}
                        className="text-xs text-slate-500 hover:text-slate-900 font-medium transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deleting === c.id}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition disabled:opacity-50"
                      >
                        {deleting === c.id ? "..." : "Eliminar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
        <strong>Nota:</strong> Para WhatsApp, el contacto debe haber aceptado el sandbox de Twilio enviando el mensaje de activación al número de WhatsApp de SIGMAFAM. Para SMS no se requiere nada adicional.
      </div>
    </PageShell>
  );
}