// ============================================================================
// ERROR GLOBAL — PAGINA DE ERROR
// ============================================================================

'use client';

import { Box, Stack, Title, Text, Button, Group, Code } from '@mantine/core';
import { IconAlertTriangle, IconHome, IconRefresh } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { colors } from '@/styles/theme';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const router = useRouter();

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.bgSecondary,
      }}
    >
      {/* Top bar con branding */}
      <Box
        style={{
          height: 60,
          backgroundColor: colors.headerBg,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1.5rem',
          gap: '0.75rem',
        }}
      >
        <img
          src="/logo.png"
          alt="Saga Ops"
          style={{ width: 28, height: 28, objectFit: 'contain' }}
        />
        <Text
          style={{
            color: colors.sidebarText,
            fontWeight: 700,
            fontSize: '1rem',
            letterSpacing: '-0.01em',
          }}
        >
          Saga Ops
        </Text>
      </Box>

      {/* Contenido centrado */}
      <Box
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}
      >
        <Stack align="center" gap="xl" style={{ maxWidth: 480, width: '100%' }}>
          {/* Icono grande con halo */}
          <Box style={{ position: 'relative', textAlign: 'center' }}>
            <Box
              style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${colors.errorLight} 0%, transparent 70%)`,
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 0,
              }}
            />
            <Box
              style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                backgroundColor: colors.bgPrimary,
                border: `2px solid ${colors.errorLight}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1,
                boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.15)',
              }}
            >
              <IconAlertTriangle size={48} color={colors.error} strokeWidth={1.8} />
            </Box>
          </Box>

          {/* Texto */}
          <Stack align="center" gap={8}>
            <Title
              order={2}
              style={{
                color: colors.textPrimary,
                textAlign: 'center',
                fontWeight: 700,
              }}
            >
              Algo salio mal
            </Title>
            <Text
              size="md"
              style={{
                color: colors.textSecondary,
                textAlign: 'center',
                maxWidth: 380,
              }}
            >
              Ocurrio un error inesperado al cargar esta pagina. Puedes reintentar o volver al inicio.
            </Text>
            {error?.digest && (
              <Group gap={6} mt={6}>
                <Text size="xs" style={{ color: colors.textMuted }}>
                  Codigo de referencia:
                </Text>
                <Code style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
                  {error.digest}
                </Code>
              </Group>
            )}
          </Stack>

          {/* Acciones */}
          <Group gap="sm" mt="xs">
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconHome size={16} />}
              onClick={() => router.push('/dashboard')}
            >
              Ir al inicio
            </Button>
            <Button
              color="red"
              leftSection={<IconRefresh size={16} />}
              onClick={reset}
            >
              Reintentar
            </Button>
          </Group>
        </Stack>
      </Box>

      {/* Footer sutil */}
      <Box
        style={{
          padding: '1rem',
          textAlign: 'center',
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <Text size="xs" style={{ color: colors.textMuted }}>
          © {new Date().getFullYear()} Saga Ops
        </Text>
      </Box>
    </Box>
  );
}
