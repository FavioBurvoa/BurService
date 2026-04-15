// ============================================================================
// PÁGINA: LOGIN — Splash screen con auto-redirect a Keycloak
// Diseño alineado con el tema KC: dark glassmorphism, misma paleta, mismo logo.
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { Box, Text, Stack, Loader, Button } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

// Paleta idéntica a la del template de Keycloak
const d = {
  bg:           '#0a0f1e',
  cardBg:       'rgba(255,255,255,0.04)',
  cardBorder:   'rgba(255,255,255,0.09)',
  textWhite:    '#f1f5f9',
  textMuted:    '#94a3b8',
  textSubtle:   '#64748b',
  primary:      '#2563eb',
  primaryLight: '#3b82f6',
  errorBg:      'rgba(239,68,68,0.12)',
  errorBorder:  'rgba(239,68,68,0.28)',
  errorText:    '#fca5a5',
} as const;

// Mensajes de error traducidos desde los códigos de NextAuth / KC
const ERROR_MESSAGES: Record<string, string> = {
  OAuthCallback:        'Error al procesar la respuesta de Keycloak.',
  OAuthSignin:          'No se pudo iniciar el flujo de autenticación.',
  OAuthAccountNotLinked:'Esta cuenta no está vinculada. Contacta al administrador.',
  AccessDenied:         'Acceso denegado. No tienes permisos para ingresar.',
  Verification:         'El enlace de verificación expiró o ya fue usado.',
  Default:              'Ocurrió un error de autenticación. Intenta nuevamente.',
};

/**
 * Splash screen de autenticación.
 * El middleware ya garantiza que si este componente se renderiza,
 * el usuario NO está autenticado — se redirige a KC sin esperar useSession().
 */
export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const errorCode = params.get('error');

    if (errorCode) {
      setError(errorCode);
      return;
    }

    signIn('keycloak', { callbackUrl: '/dashboard' });
  }, []);

  const handleRetry = () => {
    setError(null);
    signIn('keycloak', { callbackUrl: '/dashboard' });
  };

  return (
    <Box
      style={{
        position:  'relative',
        minHeight: '100vh',
        background: d.bg,
        overflow:  'hidden',
      }}
    >
      {/* Gradientes radiales de fondo — mismos que KC */}
      <Box
        style={{
          position:   'fixed',
          inset:      0,
          background: `
            radial-gradient(ellipse 75% 55% at 82% 12%, rgba(37,99,235,0.22) 0%, transparent 58%),
            radial-gradient(ellipse 65% 50% at 18% 88%, rgba(79,70,229,0.16) 0%, transparent 55%),
            radial-gradient(ellipse 55% 45% at 50% 42%, rgba(14,165,233,0.09) 0%, transparent 52%),
            ${d.bg}
          `,
          zIndex:        0,
          pointerEvents: 'none',
        }}
      />

      {/* Layout centrado */}
      <Box
        style={{
          position:       'relative',
          zIndex:         1,
          minHeight:      '100vh',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '32px 16px',
        }}
      >
        {/* Card glassmorphism */}
        <Box
          style={{
            width:                '100%',
            maxWidth:             420,
            background:           d.cardBg,
            backdropFilter:       'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border:               `1px solid ${d.cardBorder}`,
            borderRadius:         24,
            padding:              '40px 40px 36px',
            boxShadow: `
              0 0 0 1px rgba(59,130,246,0.07),
              0 32px 80px rgba(0,0,0,0.55),
              0 4px 12px rgba(0,0,0,0.3),
              inset 0 1px 0 rgba(255,255,255,0.07)
            `,
          }}
        >
          {/* Logo + nombre */}
          <Stack align="center" gap={6} mb={32}>
            <img
              src="/logo.png"
              alt="Saga Ops"
              style={{
                width:     56,
                height:    56,
                objectFit: 'contain',
                filter:    'drop-shadow(0 0 18px rgba(37,99,235,0.55))',
              }}
            />
            <Text
              style={{
                color:         d.textWhite,
                fontFamily:    '"Outfit", sans-serif',
                fontWeight:    700,
                fontSize:      '1.25rem',
                letterSpacing: '-0.02em',
                lineHeight:    1,
              }}
            >
              Saga Ops
            </Text>
            <Text
              style={{
                color:         d.textSubtle,
                fontSize:      '0.75rem',
                letterSpacing: '0.03em',
              }}
            >
              SISTEMA DE GESTIÓN OPERACIONAL
            </Text>
          </Stack>

          {/* Separador */}
          <Box style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 32 }} />

          {/* Estado: error de autenticación */}
          {error ? (
            <Stack gap="lg" align="center">
              <Box
                style={{
                  display:      'flex',
                  alignItems:   'flex-start',
                  gap:          10,
                  background:   d.errorBg,
                  border:       `1px solid ${d.errorBorder}`,
                  borderRadius: 10,
                  padding:      '12px 16px',
                  width:        '100%',
                }}
              >
                <IconAlertCircle
                  size={16}
                  style={{ color: d.errorText, flexShrink: 0, marginTop: 2 }}
                />
                <Text style={{ color: d.errorText, fontSize: '0.875rem', lineHeight: 1.5 }}>
                  {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default}
                </Text>
              </Box>

              <Button
                onClick={handleRetry}
                leftSection={<IconRefresh size={16} />}
                fullWidth
                size="md"
                style={{
                  background:    `linear-gradient(135deg, ${d.primary} 0%, ${d.primaryLight} 100%)`,
                  boxShadow:     '0 4px 18px rgba(37,99,235,0.35)',
                  border:        'none',
                  fontWeight:    600,
                  fontSize:      '0.9375rem',
                }}
              >
                Intentar nuevamente
              </Button>
            </Stack>
          ) : (
            /* Estado: cargando / redirigiendo */
            <Stack align="center" gap="md">
              <Loader size="sm" color={d.primaryLight} />
              <Text size="sm" style={{ color: d.textMuted }}>
                Iniciando sesión...
              </Text>
            </Stack>
          )}
        </Box>

        {/* Footer */}
        <Text
          mt="xl"
          size="xs"
          style={{ color: d.textSubtle, textAlign: 'center' }}
        >
          © {new Date().getFullYear()} Saga Ops — Todos los derechos reservados
        </Text>
      </Box>
    </Box>
  );
}
