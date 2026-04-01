// ============================================================================
// PROVIDERS - CLIENT COMPONENT
// Wrapper para providers que requieren 'use client'
// ============================================================================

'use client';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { theme } from '@/styles/theme';
import { useState } from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Client-side providers wrapper
 * Incluye MantineProvider, SessionProvider, QueryClientProvider y Notifications
 */
export function Providers({ children }: ProvidersProps) {
  // Crear QueryClient en estado para que sea único por sesión del cliente
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos
            gcTime: 10 * 60 * 1000, // 10 minutos
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Notifications position="top-right" zIndex={1000} />
          {children}
        </MantineProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
