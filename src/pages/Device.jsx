import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../app/auth/AuthContext";
import { 
  Cpu, QrCode as QrIcon, Trash2, RefreshCw, 
  CheckCircle2, Info, AlertCircle, Wifi, 
  ArrowRight, Loader2, Calendar, HardDrive
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

// Componente de UI interno para mantener consistencia con el Login
const StatusPill = ({ children, active }) => (
  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
    ${active 
      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
      : "bg-slate-500/10 border-slate-500/20 text-slate-500"}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
    {children}
  </div>
);

function formatDate(dt) {
  if (!dt) return "Nunca";
  return new Date(dt).toLocaleString("es-MX", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function QRCodeDisplay({ value, dark }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(value)}&bgcolor=${dark ? '0d1426' : 'ffffff'}&color=${dark ? 'f1f5f9' : '0f172a'}`;
  return (
    <div className={`p-4 rounded-2xl border transition-colors duration-300 inline-block
      ${dark ? "bg-[#111827] border-slate-700" : "bg-slate-50 border-slate-200"}`}>
      <img src={url} alt="QR" className="rounded-lg mix-blend-normal" />
    </div>
  );
}

export default function Device() {
  const { token } = useAuth();
  // Asumimos que el estado 'dark' viene de algún lado o es global, 
  // aquí lo simulamos para que el render sea consistente con tu login
  const [dark] = useState(document.documentElement.classList.contains('dark'));

  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [newDevice, setNewDevice] = useState(null);

  const fetchDevice = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/devices/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDevice(data.device);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchDevice(); }, [fetchDevice]);

  async function generateDevice() {
    setGenerating(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/devices/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error === "ALREADY_HAS_DEVICE" ? "Ya tienes un dispositivo." : data.error);
      setNewDevice(data);
      setShowQR(true);
      fetchDevice();
    } catch (e) { setError(e.message); }
    finally { setGenerating(false); }
  }

  async function unlinkDevice() {
    if (!confirm("¿Desvincular dispositivo?")) return;
    setUnlinking(true);
    try {
      const res = await fetch(`${API_BASE}/devices/mine`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al desvincular");
      setDevice(null); setNewDevice(null); setShowQR(false);
    } catch (e) { setError(e.message); }
    finally { setUnlinking(false); }
  }

  const qrPayload = newDevice ? `SIGMAFAM|${newDevice.device_uid}|${newDevice.device_token}` : "";
  const d = dark;

  return (
    <div className={`min-h-screen p-6 lg:p-10 transition-colors duration-300 ${d ? "bg-[#0a0f1e] text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      
      {/* Header Estilo Sigmafam */}
      <header className="max-w-5xl mx-auto mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d ? "bg-slate-100" : "bg-slate-900"}`}>
            <Cpu className={d ? "text-slate-900" : "text-white"} size={20} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter">GESTIÓN DE DISPOSITIVO</h1>
        </div>
        <p className={`text-sm font-medium ${d ? "text-slate-400" : "text-slate-500"}`}>
          Control centralizado de tu hardware IoT SIGMAFAM.
        </p>
      </header>

      <main className="max-w-5xl mx-auto">
        {error && (
          <div className={`mb-6 p-4 border-l-4 border-red-500 rounded-r-2xl flex items-center gap-3 ${d ? "bg-red-950/30" : "bg-red-50"}`}>
            <AlertCircle className="text-red-500 shrink-0" size={18} />
            <p className="text-sm font-bold text-red-500">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="font-bold tracking-widest text-xs uppercase">Sincronizando...</p>
          </div>
        ) : device ? (
          /* VISTA: DISPOSITIVO VINCULADO */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`lg:col-span-2 rounded-3xl p-8 border transition-all ${d ? "bg-[#0d1426] border-slate-800 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200"}`}>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <StatusPill active={true}>En línea</StatusPill>
                  <h2 className="text-3xl font-black tracking-tighter mt-3 uppercase">{device.device_uid}</h2>
                </div>
                <div className={`p-3 rounded-2xl ${d ? "bg-slate-800" : "bg-slate-100"}`}>
                  <Wifi size={24} className="text-sky-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[
                  { label: "Última actividad", val: formatDate(device.last_seen_at), icon: RefreshCw },
                  { label: "Fecha de registro", val: formatDate(device.created_at), icon: Calendar },
                  { label: "Hardware ID", val: device.device_uid, icon: HardDrive },
                  { label: "Firmware", val: "v1.0.4-stable", icon: Cpu },
                ].map((item) => (
                  <div key={item.label} className={`p-4 rounded-2xl border ${d ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100"}`}>
                    <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <item.icon size={12} /> {item.label}
                    </div>
                    <div className="text-sm font-bold tracking-tight">{item.val}</div>
                  </div>
                ))}
              </div>

              <button 
                onClick={unlinkDevice}
                disabled={unlinking}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all
                  ${d ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                {unlinking ? <Loader2 className="animate-spin" size={14}/> : <Trash2 size={14} />}
                DESVINCULAR DISPOSITIVO
              </button>
            </div>

            {/* Instrucciones */}
            <div className={`rounded-3xl p-8 transition-all border ${d ? "bg-[#0f172a] border-slate-800" : "bg-slate-900 border-slate-800 shadow-xl"}`}>
              <h3 className="text-white font-black tracking-tight mb-6 flex items-center gap-2">
                <Info size={18} className="text-sky-400" /> GUÍA RÁPIDA
              </h3>
              <ul className="space-y-6">
                {[
                  "Enciende tu SIGMAFAM.",
                  "Conéctate a la red WiFi 'SIGMAFAM-Config'.",
                  "Usa el código del dispositivo para validar.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-[10px] flex items-center justify-center font-black border border-sky-500/30">
                      {i + 1}
                    </span>
                    <p className="text-slate-400 text-xs font-medium leading-relaxed">{step}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : showQR && newDevice ? (
          /* VISTA: QR GENERADO */
          <div className="flex flex-col items-center">
             <div className={`max-w-md w-full rounded-3xl p-10 text-center border transition-all ${d ? "bg-[#0d1426] border-slate-800 shadow-2xl" : "bg-white border-slate-200 shadow-xl"}`}>
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-black tracking-tighter mb-2 italic">¡LISTO PARA VINCULAR!</h2>
                <p className={`text-sm font-medium mb-8 ${d ? "text-slate-400" : "text-slate-500"}`}>
                  Escanea este código con tu dispositivo para completar la configuración.
                </p>
                
                <QRCodeDisplay value={qrPayload} dark={d} />

                <div className={`mt-8 p-4 rounded-2xl border border-dashed ${d ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-300"}`}>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Código Manual</p>
                  <p className="text-xl font-mono font-black tracking-[0.2em]">{newDevice.device_uid}</p>
                </div>

                <button 
                  onClick={() => setShowQR(false)}
                  className={`w-full mt-8 py-4 rounded-xl font-black text-xs tracking-widest uppercase transition-all
                    ${d ? "bg-slate-100 text-slate-900 hover:bg-white" : "bg-slate-900 text-white hover:bg-slate-800"}`}>
                  Finalizar Configuración
                </button>
             </div>
          </div>
        ) : (
          /* VISTA: SIN DISPOSITIVO (ESTADO INICIAL) */
          <div className={`rounded-[32px] p-12 text-center border transition-all ${d ? "bg-[#0d1426] border-slate-800" : "bg-white border-slate-200 shadow-2xl shadow-slate-200"}`}>
             <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-8 ${d ? "bg-slate-800" : "bg-slate-100"}`}>
               <QrIcon size={40} className={d ? "text-slate-400" : "text-slate-400"} />
             </div>
             <h2 className="text-3xl font-black tracking-tighter mb-4">SIN DISPOSITIVO</h2>
             <p className={`max-w-sm mx-auto text-sm font-medium leading-relaxed mb-10 ${d ? "text-slate-400" : "text-slate-500"}`}>
               Aún no has vinculado tu hardware SIGMAFAM. Genera un código de identidad para comenzar.
             </p>
             <button 
               onClick={generateDevice}
               disabled={generating}
               className={`group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-sm tracking-tight transition-all active:scale-95
                 ${d ? "bg-white text-slate-900 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]" : "bg-slate-900 text-white shadow-xl shadow-slate-200"}`}>
               {generating ? <Loader2 className="animate-spin" /> : <>GENERAR IDENTIDAD <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} /></>}
             </button>
          </div>
        )}
      </main>
    </div>
  );
}