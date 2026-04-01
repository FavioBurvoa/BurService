// ============================================================================
// PÁGINA: NUEVO PRESUPUESTO
// ============================================================================

import { Container } from '@mantine/core';
import { PresupuestoForm } from '@/components/transaccion/PresupuestoForm';

export default function NuevoPresupuestoPage() {
  return (
    <Container size="xl" pb="xl">
      <PresupuestoForm />
    </Container>
  );
}
