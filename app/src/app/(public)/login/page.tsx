// ============================================================================
// PÁGINA: LOGIN
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Center,
  Group,
  TextInput,
  PasswordInput,
  Alert,
} from '@mantine/core';
import { IconKey, IconCar, IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/styles/theme';

// Detectar modo de autenticación
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

/**
 * Página de login con autenticación Keycloak o Mock (desarrollo)
 */
export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('demo@bur-service.com');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  /**
   * Manejar login con credenciales (modo mock)
   */
  const handleMockLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Credenciales inválidas. Use: demo@bur-service.com / demo123');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.headerBg} 0%, #1e293b 50%, ${colors.primary} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Elementos decorativos de fondo */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.primary}40 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.sidebarActive}30 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />

      <Container size={480} style={{ position: 'relative', zIndex: 1 }}>
        <Paper
          shadow="2xl"
          p="2.5rem"
          radius="xl"
          style={{
            position: 'relative',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${colors.border}`,
          }}
        >
          {/* Logo/Icono mejorado */}
          <Center mb="2rem">
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: '24px',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.sidebarActive} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 40px rgba(37, 99, 235, 0.3)',
                transform: 'rotate(-3deg)',
              }}
            >
              <IconCar size={50} color="white" stroke={2} />
            </div>
          </Center>

          {/* Título mejorado */}
          <Stack gap="xs" mb="2.5rem" style={{ textAlign: 'center' }}>
            <Title
              order={1}
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.sidebarActive} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              BUR-SERVICE
            </Title>
            <Text
              size="md"
              style={{
                color: colors.textSecondary,
                fontWeight: 500,
              }}
            >
              Sistema de Gestión para Taller Automotriz
            </Text>
          </Stack>

          {/* Contenido */}
          <Stack gap="xl">
            <Paper
              p="lg"
              radius="md"
              style={{
                backgroundColor: colors.bgSecondary,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Group gap="sm" mb="xs">
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: colors.success,
                    boxShadow: `0 0 8px ${colors.success}`,
                  }}
                />
                <Text size="lg" fw={600} style={{ color: colors.textPrimary }}>
                  Bienvenido
                </Text>
              </Group>
              <Text size="sm" style={{ color: colors.textSecondary }}>
                {USE_MOCK_AUTH
                  ? 'Modo de desarrollo activo. Usa las credenciales de prueba para continuar.'
                  : 'Inicia sesión con tus credenciales de Keycloak para acceder al sistema.'}
              </Text>
            </Paper>

            {/* Modo MOCK: Formulario de credenciales */}
            {USE_MOCK_AUTH ? (
              <form onSubmit={handleMockLogin}>
                <Stack gap="lg">
                  {error && (
                    <Alert
                      icon={<IconAlertCircle size={18} />}
                      color="red"
                      variant="filled"
                      radius="md"
                      styles={{
                        root: {
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: colors.error,
                        },
                      }}
                    >
                      {error}
                    </Alert>
                  )}

                  <TextInput
                    label="Correo Electrónico"
                    placeholder="demo@bur-service.com"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    required
                    disabled={loading}
                    size="md"
                    radius="md"
                    styles={{
                      input: {
                        border: `2px solid ${colors.border}`,
                        '&:focus': {
                          borderColor: colors.primary,
                        },
                      },
                    }}
                  />

                  <PasswordInput
                    label="Contraseña"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                    required
                    disabled={loading}
                    size="md"
                    radius="md"
                    styles={{
                      input: {
                        border: `2px solid ${colors.border}`,
                        '&:focus': {
                          borderColor: colors.primary,
                        },
                      },
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    leftSection={<IconKey size={20} />}
                    loading={loading}
                    radius="md"
                    styles={{
                      root: {
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.sidebarActive} 100%)`,
                        height: '52px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        transition: 'all 200ms ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                        },
                      },
                    }}
                  >
                    Iniciar Sesión
                  </Button>

                  <Paper
                    p="md"
                    radius="md"
                    style={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      border: '1px solid #fbbf24',
                    }}
                  >
                    <Group gap="xs" mb="xs">
                      <IconAlertCircle size={16} style={{ color: '#d97706' }} />
                      <Text size="sm" fw={700} style={{ color: '#92400e' }}>
                        Credenciales de prueba
                      </Text>
                    </Group>
                    <Text size="xs" style={{ color: '#78350f', marginBottom: 4 }}>
                      📧 Email: demo@bur-service.com
                    </Text>
                    <Text size="xs" style={{ color: '#78350f' }}>
                      🔑 Contraseña: demo123
                    </Text>
                  </Paper>
                </Stack>
              </form>
            ) : (
              // Modo PRODUCCIÓN: Botón Keycloak
              <Stack gap="lg">
                <Button
                  fullWidth
                  size="lg"
                  leftSection={<IconKey size={22} />}
                  onClick={login}
                  loading={isLoading}
                  radius="md"
                  styles={{
                    root: {
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.sidebarActive} 100%)`,
                      height: '56px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      transition: 'all 200ms ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                      },
                    },
                  }}
                >
                  Iniciar Sesión con Keycloak
                </Button>

                <Paper
                  p="lg"
                  radius="md"
                  style={{
                    backgroundColor: colors.bgSecondary,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <Stack gap="md">
                    <Group gap="sm">
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          backgroundColor: colors.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconKey size={18} color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text size="xs" fw={600} style={{ color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Autenticación
                        </Text>
                        <Text size="sm" fw={600} style={{ color: colors.textPrimary }}>
                          Keycloak (PKCE)
                        </Text>
                      </div>
                    </Group>
                    <div
                      style={{
                        height: '1px',
                        backgroundColor: colors.border,
                      }}
                    />
                    <Group gap="xs">
                      <Text size="xs" fw={600} style={{ color: colors.textSecondary }}>
                        ⏱️ Sesión:
                      </Text>
                      <Text size="xs" style={{ color: colors.textPrimary }}>
                        Expira después de 30 minutos de inactividad
                      </Text>
                    </Group>
                  </Stack>
                </Paper>
              </Stack>
            )}
          </Stack>

          {/* Footer mejorado */}
          <div
            style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: `1px solid ${colors.border}`,
              textAlign: 'center',
            }}
          >
            <Group justify="center" gap="xs">
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: colors.success,
                }}
              />
              <Text size="xs" fw={500} style={{ color: colors.textSecondary }}>
                Sistema en línea
              </Text>
            </Group>
            <Text
              size="xs"
              mt="xs"
              style={{
                color: colors.textSecondary,
                opacity: 0.7,
              }}
            >
              Versión 1.0.0 &bull; {new Date().getFullYear()} &bull; BUR-SERVICE
            </Text>
          </div>
        </Paper>
      </Container>
    </Center>
  );
}
