import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { PageShell, Card, Pill, Button } from "./_ui";
import { useAlerts } from "../app/alerts/AlertsContext";

function StatusPill({ status }) {
  if (status === "ACTIVE") return <Pill variant="red">ACTIVE</Pill>;
  if (status === "RECEIVED") return <Pill variant="yellow">RECEIVED</Pill>;
  if (status === "ATTENDED") return <Pill variant="blue">ATTENDED</Pill>;
  if (status === "CLOSED") return <Pill variant="green">CLOSED</Pill>;
  return <Pill>UNKNOWN</Pill>;
}

export default function MapLive() {
  const { alerts, selected, selectAlert } = useAlerts();

  const fallbackCenter = useMemo(() => {
    // Centro por defecto (GDL-ish) si no hay nada seleccionado
    return [20.6736, -103.4053];
  }, []);

  const center = selected
    ? [selected.lastLocation.lat, selected.lastLocation.lng]
    : fallbackCenter;

  return (
    <PageShell
      title="Mapa en vivo"
      subtitle="Marcador sobre la alerta seleccionada."
      right={
        <Button variant="outline" onClick={() => selectAlert(alerts[0]?.id ?? null)}>
          Seleccionar primera
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* MAPA */}
        <div className="lg:col-span-2">
          <Card title="Mapa (OpenStreetMap)">
            <div className="h-[520px] rounded-2xl overflow-hidden border border-slate-200">
              <MapContainer center={center} zoom={15} className="h-full w-full">
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {selected ? (
                  <Marker position={[selected.lastLocation.lat, selected.lastLocation.lng]} />
                ) : null}
              </MapContainer>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              Tip: cuando conectemos backend, aquí haremos actualización en tiempo real con polling/WebSocket.
            </div>
          </Card>
        </div>

        {/* LISTA / DETALLE */}
        <div className="space-y-3">
          <Card title="Seleccionada">
            {selected ? (
              <div className="text-sm text-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <b>#{selected.id}</b>
                  <StatusPill status={selected.status} />
                </div>
                <div><b>Usuario:</b> {selected.user}</div>
                <div><b>Origen:</b> {selected.source}</div>
                <div>
                  <b>Coords:</b> {selected.lastLocation.lat.toFixed(5)}, {selected.lastLocation.lng.toFixed(5)}
                </div>
                <div><b>Batería:</b> {typeof selected.battery === "number" ? `${selected.battery}%` : "N/A"}</div>
              </div>
            ) : (
              <div className="text-sm text-slate-600">Selecciona una alerta para ver el marcador.</div>
            )}
          </Card>

          <Card title="Alertas (click para centrar)">
            <div className="space-y-2">
              {alerts.map((a) => {
                const isSel = selected?.id === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => selectAlert(a.id)}
                    className={[
                      "w-full text-left px-3 py-2 rounded-xl border text-sm transition",
                      isSel ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">#{a.id} · {a.user}</span>
                      <StatusPill status={a.status} />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {a.lastLocation.lat.toFixed(4)}, {a.lastLocation.lng.toFixed(4)} · {a.source}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}