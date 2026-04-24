import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell, Card, Button, Pill } from "./_ui";
import { useAlerts } from "../app/alerts/AlertsContext";

function StatusPill({ status }) {
  if (status === "ACTIVE") return <Pill variant="red">ACTIVE</Pill>;
  if (status === "RECEIVED") return <Pill variant="yellow">RECEIVED</Pill>;
  if (status === "ATTENDED") return <Pill variant="blue">ATTENDED</Pill>;
  if (status === "CLOSED") return <Pill variant="green">CLOSED</Pill>;
  return <Pill>UNKNOWN</Pill>;
}

export default function Dashboard() {
  const nav = useNavigate();
  const { alerts, selected, simulateIncomingAlert } = useAlerts();

  const activeAlerts = useMemo(
    () => alerts.filter((a) => a.status === "ACTIVE" || a.status === "RECEIVED"),
    [alerts]
  );

  const latestActive = activeAlerts[0] ?? null;

  const alertsToday = activeAlerts.length; // demo simple
  const alertsMonth = alerts.length;       // demo simple

  return (
    <PageShell
      title="Dashboard"
      subtitle="Resumen rápido del estado del sistema."
      right={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => nav("/app/alerts")}>
            Ver alertas
          </Button>
          <Button onClick={simulateIncomingAlert}>Simular alerta</Button>
        </div>
      }
    >
      {latestActive ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-extrabold text-red-700 flex items-center gap-2">
              ALERTA ACTIVA <StatusPill status={latestActive.status} />
            </div>
            <div className="text-sm text-red-600 mt-1">
              {latestActive.user} · {latestActive.source} · Lat {latestActive.lastLocation.lat.toFixed(4)} / Lng{" "}
              {latestActive.lastLocation.lng.toFixed(4)}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => nav("/app/map")}>Ver en mapa</Button>
            <Button variant="outline" onClick={() => nav("/app/alerts")}>
              Abrir detalle
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <div className="font-extrabold text-emerald-700">Sin alertas activas</div>
          <div className="text-sm text-emerald-600">Todo tranquilo por ahora ✅</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card title="Dispositivo">Online ✅ · Last seen 2m</Card>
        <Card title="Alertas activas hoy">{alertsToday}</Card>
        <Card title="Alertas totales (demo)">{alertsMonth}</Card>
        <Card title="Seleccionada">{selected ? `#${selected.id}` : "Ninguna"}</Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <Card title="Actividad reciente (demo)">
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              {alerts.slice(0, 3).map((a) => (
                <li key={a.id}>
                  #{a.id} · {a.user} · {a.source} · {a.status}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card title="Acciones rápidas">
          <div className="space-y-2">
            <Button onClick={() => nav("/app/map")}>Ir a mapa</Button>
            <Button variant="outline" onClick={() => nav("/app/history")}>
              Ver historial
            </Button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}