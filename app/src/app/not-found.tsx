// ============================================================================
// 404 — PAGINA NO ENCONTRADA
// ============================================================================

'use client';

import { Box, Stack, Title, Text, Button, Group } from '@mantine/core';
import { IconArrowLeft, IconHome } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { colors } from '@/styles/theme';

export default function NotFound() {
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
          {/* Código 404 grande */}
          <Box style={{ textAlign: 'center' }}>
            <Text
              style={{
                fontSize: 'clamp(6rem, 18vw, 9rem)',
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: '-0.04em',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.sidebarActive} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              404
            </Text>
            <Box
              style={{
                height: 3,
                width: 60,
                backgroundColor: colors.primary,
                borderRadius: 2,
                margin: '0 auto',
                opacity: 0.3,
              }}
            />
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
              Pagina no encontrada
            </Title>
            <Text
              size="md"
              style={{
                color: colors.textSecondary,
                textAlign: 'center',
                maxWidth: 380,
              }}
            >
              La ruta que intentas visitar no existe o fue movida. Verifica la URL o vuelve al inicio.
            </Text>
          </Stack>

          {/* Acciones */}
          <Group gap="sm" mt="xs">
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.back()}
            >
              Volver atras
            </Button>
            <Button
              leftSection={<IconHome size={16} />}
              onClick={() => router.push('/dashboard')}
            >
              Ir al inicio
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
