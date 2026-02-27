import React, { useMemo, useState } from "react";
import { PageShell, Card, Pill, Button } from "./_ui";
import Drawer from "./_drawer";
import ConfirmModal from "./_modal";
import { useAlerts } from "../app/alerts/AlertsContext";
import MiniMap from "../app/maps/MiniMap";
import { useNavigate } from "react-router-dom";

function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function StatusPill({ status }) {
  if (status === "ACTIVE") return <Pill variant="red">ACTIVE</Pill>;
  if (status === "RECEIVED") return <Pill variant="yellow">RECEIVED</Pill>;
  if (status === "ATTENDED") return <Pill variant="blue">ATTENDED</Pill>;
  if (status === "CLOSED") return <Pill variant="green">CLOSED</Pill>;
  return <Pill>UNKNOWN</Pill>;
}

function SourcePill({ source }) {
  return <Pill variant={source === "IOT" ? "slate" : "blue"}>{source}</Pill>;
}

export default function Alerts() {
  const {
    alerts,
    selected,
    selectedId,
    selectAlert,
    simulateIncomingAlert,
    markAttended,
    closeAlert,
  } = useAlerts();

  const [drawerOpen, setDrawerOpen] = useState(true);
  const [confirmClose, setConfirmClose] = useState(false);

  const activeCount = useMemo(
    () => alerts.filter((a) => a.status === "ACTIVE" || a.status === "RECEIVED").length,
    [alerts]
  );

  return (
    <PageShell
      title="Alertas"
      subtitle={`Alertas activas y recientes. Activas: ${activeCount}`}
      right={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDrawerOpen((v) => !v)}>
            {drawerOpen ? "Ocultar detalle" : "Ver detalle"}
          </Button>
          <Button onClick={simulateIncomingAlert}>Simular alerta</Button>
        </div>
      }
    >
      <Card>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">Usuario</th>
                <th className="py-2 pr-3">Creada</th>
                <th className="py-2 pr-3">Origen</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="text-slate-800">
              {alerts.map((a) => {
                const nav = useNavigate();
                const isSel = a.id === selectedId;
                return (
                  <tr
                    key={a.id}
                    className={[
                      "border-b border-slate-100 cursor-pointer",
                      isSel ? "bg-blue-50/50" : "hover:bg-slate-50",
                    ].join(" ")}
                    onClick={() => {
                      selectAlert(a.id);
                      setDrawerOpen(true);
                    }}
                  >
                    <td className="py-3 pr-3 font-semibold">{a.id}</td>
                    <td className="py-3 pr-3">{a.user}</td>
                    <td className="py-3 pr-3">{fmtTime(a.createdAt)}</td>
                    <td className="py-3 pr-3">
                      <SourcePill source={a.source} />
                    </td>
                    <td className="py-3 pr-3">
                      <StatusPill status={a.status} />
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex justify-end gap-2">
                        <button
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-white text-xs font-semibold"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectAlert(a.id);
                            setDrawerOpen(true);
                          }}
                        >
                          Ver
                        </button>

                        <button
                          className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectAlert(a.id);
                            nav("/app/map");
                          }}
                        >
                          Mapa
                        </button>

                        <button
                          className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectAlert(a.id);
                            setConfirmClose(true);
                          }}
                        >
                          Cerrar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No hay alertas todavía.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Drawer detalle */}
      <Drawer
        open={drawerOpen}
        title={selected ? `Detalle alerta #${selected.id}` : "Detalle"}
        onClose={() => setDrawerOpen(false)}
      >
        {!selected ? (
          <div className="text-sm text-slate-600">Selecciona una alerta.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card title="Usuario">{selected.user}</Card>
              <Card title="Estado"><StatusPill status={selected.status} /></Card>
              <Card title="Origen"><SourcePill source={selected.source} /></Card>
              <Card title="Creada">{fmtTime(selected.createdAt)}</Card>
            </div>

            <Card title="Última ubicación">
              <div className="text-sm text-slate-700">
                <div><b>Lat:</b> {selected.lastLocation.lat}</div>
                <div><b>Lng:</b> {selected.lastLocation.lng}</div>
                <div><b>Hora:</b> {fmtTime(selected.lastLocation.at)}</div>
              </div>
              <MiniMap lat={selected.lastLocation.lat} lng={selected.lastLocation.lng} />
            </Card>

            <Card title="Dispositivo">
              <div className="text-sm text-slate-700 space-y-1">
                <div><b>Batería:</b> {typeof selected.battery === "number" ? `${selected.battery}%` : "N/A"}</div>
                <div><b>Notas:</b> Placeholder (luego metemos logs/errores).</div>
              </div>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => markAttended(selected.id)}
                disabled={selected.status === "CLOSED"}
              >
                Marcar atendida
              </Button>
              <Button
                variant="danger"
                onClick={() => setConfirmClose(true)}
                disabled={selected.status === "CLOSED"}
              >
                Cerrar alerta
              </Button>
            </div>

            <div className="text-xs text-slate-500">
              luego conectamos “Mapa” con /app/map y el mini mapa con Leaflet.
            </div>
          </div>
        )}
      </Drawer>

      {/* Confirm cerrar */}
      <ConfirmModal
        open={confirmClose}
        title="Cerrar alerta"
        desc="¿Seguro que quieres cerrar esta alerta? Esto cambiará su estado a CLOSED."
        confirmText="Sí, cerrar"
        onClose={() => setConfirmClose(false)}
        onConfirm={() => {
          if (selected) closeAlert(selected.id);
          setConfirmClose(false);
        }}
      />
    </PageShell>
  );
}