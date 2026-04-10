// ============================================================================
// PÁGINA: ALIAS POR EMPRESA + NÚMERO DE PRESUPUESTO
// Ruta: /presupuestos/:id/:numero  (id = código de empresa, numero = nro presupuesto)
// Hace lookup del id interno y redirige a /presupuestos/:id_interno
// Ejemplo: /presupuestos/MEGACORP/42  →  /presupuestos/5
// ============================================================================

'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Center, Loader, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { colors } from '@/styles/theme';

export default function PresupuestoPorEmpresaNumeroPage() {
  const router = useRouter();
  const params = useParams<{ id: string; numero: string }>();

  useEffect(() => {
    const codigoEmpresa = params.id;
    const numero = params.numero;
    if (!codigoEmpresa || !numero) return;

    fetch(
      `/api/presupuestos/lookup/numero?codigo_empresa=${encodeURIComponent(codigoEmpresa)}&numero=${encodeURIComponent(numero)}`
    )
      .then((r) => r.json())
      .then((res) => {
        if (!res.success || !res.data?.id) {
          notifications.show({
            title: 'No encontrado',
            message: `Presupuesto ${codigoEmpresa}/${numero} no existe`,
            color: 'red',
          });
          router.replace('/presupuestos/lista');
          return;
        }
        router.replace(`/presupuestos/${res.data.id}`);
      })
      .catch(() => {
        notifications.show({
          title: 'Error',
          message: 'No se pudo resolver el presupuesto',
          color: 'red',
        });
        router.replace('/presupuestos/lista');
      });
  }, [params, router]);

  return (
    <Center style={{ minHeight: 300 }}>
      <Stack align="center" gap="sm">
        <Loader size="md" />
        <Text size="sm" style={{ color: colors.textMuted }}>
          Buscando presupuesto {params.id}/{params.numero}...
        </Text>
      </Stack>
    </Center>
  );
}
