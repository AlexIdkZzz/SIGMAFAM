import React, { useEffect, useState, useCallback } from "react";
import { PageShell, Card, Button, Pill } from "./_ui";
import { useAuth } from "../app/auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

function formatDate(dt) {
  if (!dt) return "Nunca";
  return new Date(dt).toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Componente QR simple usando API gratuita ─────────────────────
function QRCode({ value }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(value)}`;
  return (
    <img src={url} alt="QR de vinculación" className="rounded-xl border border-slate-200 mx-auto block" />
  );
}

export default function Device() {
  const { token } = useAuth();

  const [device, setDevice]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [generating, setGenerating] = useState(false);
  const [unlinking, setUnlinking]   = useState(false);
  const [showQR, setShowQR]         = useState(false);
  const [newDevice, setNewDevice]   = useState(null); // dispositivo recién generado

  const fetchDevice = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API_BASE}/devices/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDevice(data.device);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchDevice(); }, [fetchDevice]);

  async function generateDevice() {
    setGenerating(true); setError("");
    try {
      const res  = await fetch(`${API_BASE}/devices/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "ALREADY_HAS_DEVICE")
          throw new Error("Ya tienes un dispositivo vinculado.");
        throw new Error(data.error);
      }
      setNewDevice(data);
      setShowQR(true);
      fetchDevice();
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function unlinkDevice() {
    if (!confirm("¿Seguro que quieres desvincular el dispositivo? Tendrás que configurarlo de nuevo.")) return;
    setUnlinking(true); setError("");
    try {
      const res  = await fetch(`${API_BASE}/devices/mine`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDevice(null);
      setNewDevice(null);
      setShowQR(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setUnlinking(false);
    }
  }

  // Texto que va en el QR — el ESP32 lo leerá para configurarse
  const qrPayload = newDevice
    ? `SIGMAFAM|${newDevice.device_uid}|${newDevice.device_token}`
    : "";

  return (
    <PageShell title="Dispositivo" subtitle="Vinculación y estado del dispositivo IoT.">

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <div className="flex items-center justify-center h-24 text-slate-400 gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
            Cargando...
          </div>
        </Card>
      ) : device ? (
        // ── Dispositivo vinculado ──
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card title="Mi dispositivo">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">UID</span>
                <span className="font-mono font-bold text-slate-900">{device.device_uid}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Estado</span>
                <Pill variant="green">Vinculado</Pill>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Última conexión</span>
                <span className="text-slate-700">{formatDate(device.last_seen_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Vinculado el</span>
                <span className="text-slate-700">{formatDate(device.created_at)}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
              <Button
                variant="danger"
                onClick={unlinkDevice}
                disabled={unlinking}
              >
                {unlinking ? "Desvinculando..." : "Desvincular"}
              </Button>
            </div>
          </Card>

          <Card title="Instrucciones">
            <ol className="text-sm text-slate-600 space-y-2 list-decimal pl-4">
              <li>Enciende el dispositivo SIGMAFAM</li>
              <li>Conéctate al WiFi <b>SIGMAFAM-Config</b> desde tu celular</li>
              <li>Se abrirá una página de configuración automáticamente</li>
              <li>Ingresa tu red WiFi y el código <b>{device.device_uid}</b></li>
              <li>El dispositivo se configurará solo y quedará listo</li>
            </ol>
          </Card>
        </div>

      ) : showQR && newDevice ? (
        // ── Mostrar QR del dispositivo recién generado ──
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card title="¡Dispositivo generado!">
            <p className="text-sm text-slate-600 mb-4">
              Escanea este QR con el dispositivo SIGMAFAM o ingresa el código manualmente en el portal de configuración.
            </p>
            <QRCode value={qrPayload} />
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-500 mb-1">Código del dispositivo</div>
              <div className="font-mono font-bold text-lg text-slate-900 tracking-widest">
                {newDevice.device_uid}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">
              Guarda este código — lo necesitarás para configurar el dispositivo.
            </p>
          </Card>

          <Card title="Instrucciones">
            <ol className="text-sm text-slate-600 space-y-2 list-decimal pl-4">
              <li>Enciende el dispositivo SIGMAFAM</li>
              <li>Conéctate al WiFi <b>SIGMAFAM-Config</b> desde tu celular</li>
              <li>Se abrirá una página de configuración automáticamente</li>
              <li>Ingresa tu red WiFi y escanea el QR o escribe el código</li>
              <li>El dispositivo se configurará solo y quedará listo</li>
            </ol>
            <div className="mt-4">
              <Button onClick={() => setShowQR(false)}>Ver estado del dispositivo</Button>
            </div>
          </Card>
        </div>

      ) : (
        // ── Sin dispositivo ──
        <Card title="Sin dispositivo vinculado">
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
              </svg>
            </div>
            <p className="text-slate-700 font-semibold mb-1">No tienes un dispositivo vinculado</p>
            <p className="text-sm text-slate-400 mb-6">Genera un código para vincular tu dispositivo SIGMAFAM</p>
            <Button onClick={generateDevice} disabled={generating}>
              {generating ? "Generando..." : "Generar código de vinculación"}
            </Button>
          </div>
        </Card>
      )}
    </PageShell>
  );
}