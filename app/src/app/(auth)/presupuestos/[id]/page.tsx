// ============================================================================
// PÁGINA: EDITAR PRESUPUESTO
// ============================================================================

import { Container } from '@mantine/core';
import { PresupuestoForm } from '@/components/transaccion/PresupuestoForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarPresupuestoPage({ params }: Props) {
  const { id } = await params;
  const presupuestoId = parseInt(id);

  return (
    <Container size="xl" pb="xl">
      <PresupuestoForm presupuestoId={isNaN(presupuestoId) ? undefined : presupuestoId} />
    </Container>
  );
}
