// ============================================================================
// ERROR GLOBAL — PAGINA DE ERROR
// ============================================================================

'use client';

import { Center, Stack, Title, Text, Button, Paper, Group } from '@mantine/core';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { colors } from '@/styles/theme';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
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
              backgroundColor: colors.errorLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconAlertTriangle size={40} color={colors.error} />
          </div>

          <Stack gap={4}>
            <Title order={2} style={{ color: colors.textPrimary }}>
              Error inesperado
            </Title>
            <Text size="sm" style={{ color: colors.textSecondary }}>
              Ocurrio un problema al cargar esta pagina.
            </Text>
            {error?.digest && (
              <Text size="xs" style={{ color: colors.textMuted }} mt={4}>
                Ref: {error.digest}
              </Text>
            )}
          </Stack>

          <Group gap="sm">
            <Button
              variant="light"
              color="gray"
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              Ir al inicio
            </Button>
            <Button
              variant="light"
              color="red"
              size="sm"
              leftSection={<IconRefresh size={14} />}
              onClick={reset}
            >
              Reintentar
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Center>
  );
}
