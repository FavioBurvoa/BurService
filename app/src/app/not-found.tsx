// ============================================================================
// 404 — PAGINA NO ENCONTRADA
// ============================================================================

'use client';

import { Center, Stack, Title, Text, Button, Paper } from '@mantine/core';
import { IconError404 } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { colors } from '@/styles/theme';

export default function NotFound() {
  const router = useRouter();

  return (
    <Center h="100vh" style={{ backgroundColor: colors.bgSecondary }}>
      <Paper
        shadow="md"
        radius="lg"
        p="xl"
        w={420}
        style={{ textAlign: 'center' }}
      >
        <Stack align="center" gap="lg">
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: colors.primaryLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconError404 size={40} color={colors.primary} />
          </div>

          <Stack gap={4}>
            <Title order={2} style={{ color: colors.textPrimary }}>
              Pagina no encontrada
            </Title>
            <Text size="sm" style={{ color: colors.textSecondary }}>
              La pagina que buscas no existe o fue movida.
            </Text>
          </Stack>

          <Button
            variant="light"
            size="sm"
            onClick={() => router.push('/dashboard')}
          >
            Volver al inicio
          </Button>
        </Stack>
      </Paper>
    </Center>
  );
}
