// ============================================================================
// ERROR BOUNDARY
// ============================================================================

'use client';

import { Component, ReactNode } from 'react';
import { Container, Title, Text, Button, Stack, Paper } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { colors } from '@/styles/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary para capturar errores en componentes hijos
 *
 * Uso:
 * ```tsx
 * <ErrorBoundary>
 *   <ComponenteThatMightError />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log del error (en producción, enviar a servicio de logging)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback por defecto
      return (
        <Container size="sm" mt="xl">
          <Paper shadow="sm" p="xl" radius="md">
            <Stack align="center" gap="lg">
              <IconAlertCircle size={64} color={colors.error} />

              <div style={{ textAlign: 'center' }}>
                <Title order={2} style={{ color: colors.error, marginBottom: '0.5rem' }}>
                  Algo salió mal
                </Title>
                <Text style={{ color: colors.textSecondary }}>
                  Ha ocurrido un error inesperado. Por favor, intenta nuevamente.
                </Text>
              </div>

              {/* Mostrar mensaje de error en desarrollo */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Paper
                  p="md"
                  radius="sm"
                  style={{
                    backgroundColor: colors.bgSecondary,
                    width: '100%',
                    maxWidth: 500,
                  }}
                >
                  <Text size="xs" ff="monospace" c="red">
                    {this.state.error.message}
                  </Text>
                  {this.state.error.stack && (
                    <Text size="xs" ff="monospace" style={{ color: colors.textSecondary }} mt="xs">
                      {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                    </Text>
                  )}
                </Paper>
              )}

              <Button
                leftSection={<IconRefresh size={18} />}
                onClick={this.handleReset}
                style={{ backgroundColor: colors.primary }}
              >
                Intentar nuevamente
              </Button>
            </Stack>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}
