import React from "react";
import { PageShell, Card, Button } from "./_ui";

export default function Family() {
  return (
    <PageShell
      title="Familia"
      subtitle="Miembros y roles (solo ADMIN/JEFE)."
      right={<Button>Agregar miembro</Button>}
    >
      <Card>Tabla de miembros aquí.</Card>
    </PageShell>
  );
}