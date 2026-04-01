// ============================================================================
// LOADING OVERLAY
// ============================================================================

'use client';

import { Loader, Overlay, Stack, Text } from '@mantine/core';
import { colors } from '@/styles/theme';

interface LoadingOverlayProps {
  /** Mostrar el overlay */
  visible: boolean;
  /** Mensaje opcional para mostrar */
  message?: string;
  /** Blur del fondo */
  blur?: number;
}

/**
 * Overlay de carga con loader y mensaje opcional
 *
 * Uso:
 * ```tsx
 * const [loading, setLoading] = useState(false);
 *
 * <div style={{ position: 'relative' }}>
 *   <LoadingOverlay visible={loading} message="Cargando datos..." />
 *   <YourContent />
 * </div>
 * ```
 */
export function LoadingOverlay({
  visible,
  message = 'Cargando...',
  blur = 2,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <Overlay
      color="#000"
      backgroundOpacity={0.35}
      blur={blur}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Stack align="center" gap="md">
        <Loader size="xl" color={colors.primary} />
        {message && (
          <Text size="lg" fw={500} c="white">
            {message}
          </Text>
        )}
      </Stack>
    </Overlay>
  );
}
