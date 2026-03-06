import React from "react";
import { PageShell, Card, Pill, Button } from "./_ui";

export default function Device() {
  const hasDevice = true; // demo
  return (
    <PageShell title="Dispositivo" subtitle="Vinculación y estado del dispositivo.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Mi dispositivo">
          <div className="space-y-2 text-sm text-slate-700">
            <div><b>UID:</b> ESP32-ABC-123</div>
            <div><b>Estado:</b> <Pill variant="green">ACTIVE</Pill></div>
            <div><b>Última conexión:</b> hace 2 min</div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline">Desactivar</Button>
            <Button variant="danger">Desvincular</Button>
          </div>
        </Card>

        <Card title="Vincular nuevo dispositivo">
          {hasDevice ? (
            <div className="text-sm text-slate-600">
              Ya existe un dispositivo vinculado. Para cambiarlo, primero desvincula el actual.
            </div>
          ) : (
            <div className="space-y-2">
              <input className="w-full px-3 py-2 rounded-xl border border-slate-200" placeholder="Device UID" />
              <input className="w-full px-3 py-2 rounded-xl border border-slate-200" placeholder="Device Token" />
              <Button>Vincular</Button>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}