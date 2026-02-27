import React from "react";
import { PageShell, Card } from "./_ui";

export default function Audit() {
  return (
    <PageShell title="Auditoría" subtitle="Logs del sistema (solo ADMIN).">
      <Card>Tabla de logs aquí.</Card>
    </PageShell>
  );
}