import React from "react";
import { PageShell, Card, Button } from "./_ui";

export default function Contacts() {
  return (
    <PageShell
      title="Contactos"
      subtitle="Contactos de confianza (solo ADMIN/JEFE)."
      right={<Button>Agregar contacto</Button>}
    >
      <Card>Tabla de contactos aquí.</Card>
    </PageShell>
  );
}