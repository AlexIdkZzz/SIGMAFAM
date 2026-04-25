import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../app/auth/AuthContext";
import { 
  Cpu, QrCode as QrIcon, Trash2, RefreshCw, 
  CheckCircle2, Info, AlertCircle, Wifi, 
  ArrowRight, Loader2, Calendar, HardDrive, X
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

// --- COMPONENTES AUXILIARES ---

function useIsDark() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(document.documentElement.classList.contains("dark")));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

const StatusPill = ({ children, active }) => (
  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
    ${active 
      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-500" 
      : "bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-500"}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
    {children}
  </div>
);

const ConfirmModal = ({ isOpen, onClose, onConfirm, loading, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-[32px] p-8 border bg-white dark:bg-[#0d1426] border-slate-200 dark:border-slate-800 shadow-2xl transition-all scale-in-center">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <h3 className="text-xl font-black tracking-tighter mb-2 uppercase italic text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          {message}
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={16}/> : "Confirmar Desvinculación"}
          </button>
          <button 
            onClick={onClose}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

function formatDate(dt) {
  if (!dt) return "Nunca";
  return new Date(dt).toLocaleString("es-MX", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function QRCodeDisplay({ value, dark }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(value)}&bgcolor=${dark ? '0d1426' : 'ffffff'}&color=${dark ? 'f1f5f9' : '0f172a'}`;
  return (
    <div className="p-4 rounded-2xl border transition-colors duration-300 inline-block bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-700">
      <img src={url} alt="QR" className="rounded-lg mix-blend-normal" />
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---

export default function Device() {
  const { token } = useAuth();
  const isDark = useIsDark();

  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [newDevice, setNewDevice] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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

  async function handleUnlink() {
    setUnlinking(true);
    try {
      const res = await fetch(`${API_BASE}/devices/mine`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al desvincular");
      setDevice(null); setNewDevice(null); setShowQR(false);
      setIsConfirmOpen(false);
    } catch (e) { setError(e.message); }
    finally { setUnlinking(false); }
  }

  const qrPayload = newDevice ? `SIGMAFAM|${newDevice.device_uid}|${newDevice.device_token}` : "";

  return (
    <div className="min-h-screen p-6 lg:p-10 transition-colors duration-300 bg-slate-50 dark:bg-[#0a0f1e] text-slate-900 dark:text-slate-100">
      
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleUnlink}
        loading={unlinking}
        title="¿Desvincular Dispositivo?"
        message="Esta acción interrumpirá la conexión de tu hardware SIGMAFAM. Tendrás que generar una nueva identidad para volver a conectarlo."
      />

      <header className="max-w-5xl mx-auto mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900 dark:bg-slate-100">
            <Cpu className="text-white dark:text-slate-900" size={20} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter">GESTIÓN DE DISPOSITIVO</h1>
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Control centralizado de tu hardware IoT SIGMAFAM.
        </p>
      </header>

      <main className="max-w-5xl mx-auto">
        {error && (
          <div className="mb-6 p-4 border-l-4 border-red-500 rounded-r-2xl flex items-center gap-3 bg-red-50 dark:bg-red-950/30">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-3xl p-8 border transition-all bg-white dark:bg-[#0d1426] border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <StatusPill active={true}>En línea</StatusPill>
                  <h2 className="text-3xl font-black tracking-tighter mt-3 uppercase">{device.device_uid}</h2>
                </div>
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <Wifi size={24} className="text-sky-500 dark:text-sky-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[
                  { label: "Última actividad", val: formatDate(device.last_seen_at), icon: RefreshCw },
                  { label: "Fecha de registro", val: formatDate(device.created_at), icon: Calendar },
                  { label: "Hardware ID", val: device.device_uid, icon: HardDrive },
                  { label: "Firmware", val: "v1.0.4-stable", icon: Cpu },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-2xl border bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      <item.icon size={12} /> {item.label}
                    </div>
                    <div className="text-sm font-bold tracking-tight">{item.val}</div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setIsConfirmOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-500 dark:hover:bg-red-500/20 active:scale-95">
                <Trash2 size={14} />
                {device ? "DESVINCULAR DISPOSITIVO" : "NO VINCULAR DISPOSITIVO"}
              </button>
            </div>

            <div className="rounded-3xl p-8 transition-all border bg-slate-900 dark:bg-[#0f172a] border-slate-800 shadow-xl">
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
          <div className="flex flex-col items-center">
             <div className="max-w-md w-full rounded-3xl p-10 text-center border transition-all bg-white dark:bg-[#0d1426] border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-black tracking-tighter mb-2 italic">¡LISTO PARA VINCULAR!</h2>
                <p className="text-sm font-medium mb-8 text-slate-500 dark:text-slate-400">
                  Escanea este código con tu dispositivo para completar la configuración.
                </p>
                
                <QRCodeDisplay value={qrPayload} dark={isDark} />

                <div className="mt-8 p-4 rounded-2xl border border-dashed bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Código Manual</p>
                  <p className="text-xl font-mono font-black tracking-[0.2em]">{newDevice.device_uid}</p>
                </div>

                <button 
                  onClick={() => setShowQR(false)}
                  className="w-full mt-8 py-4 rounded-xl font-black text-xs tracking-widest uppercase transition-all bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white active:scale-95">
                  Finalizar Configuración
                </button>
             </div>
          </div>
        ) : (
          <div className="rounded-[32px] p-12 text-center border transition-all bg-white dark:bg-[#0d1426] border-slate-200 dark:border-slate-800 shadow-2xl">
             <div className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-8 bg-slate-100 dark:bg-slate-800">
               <QrIcon size={40} className="text-slate-500 dark:text-slate-400" />
             </div>
             <h2 className="text-3xl font-black tracking-tighter mb-4 uppercase italic">Sin dispositivo</h2>
             <p className="max-w-sm mx-auto text-sm font-medium leading-relaxed mb-10 text-slate-500 dark:text-slate-400">
               Aún no has vinculado tu hardware SIGMAFAM. Genera un código de identidad para comenzar.
             </p>
             <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={generateDevice}
                  disabled={generating}
                  className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-sm tracking-tight transition-all active:scale-95 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:shadow-xl">
                  {generating ? <Loader2 className="animate-spin" /> : <>GENERAR IDENTIDAD <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} /></>}
                </button>
                <button 
                  className="text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                  onClick={() => setError("No hay ningún dispositivo para desvincular.")}>
                  No vincular dispositivo
                </button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}