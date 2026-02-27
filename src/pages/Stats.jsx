import React from "react";
import { PageShell, Card } from "./_ui";

export default function Stats() {
  return (
    <PageShell title="Estadísticas" subtitle="KPIs y gráficas (solo ADMIN/JEFE).">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card title="Alertas por mes">Gráfica aquí.</Card>
        <Card title="Tiempo promedio de atención">KPI aquí.</Card>
      </div>
    </PageShell>
  );
}