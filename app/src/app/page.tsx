// ============================================================================
// PÁGINA DE INICIO - REDIRECCIÓN
// ============================================================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Center, Loader } from '@mantine/core';

/**
 * Página de inicio que redirige según el estado de autenticación
 * - Si está autenticado: redirige a /dashboard
 * - Si no está autenticado: redirige a /login
 */
export default function HomePage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  return (
    <Center h="100vh">
      <Loader size="lg" />
    </Center>
  );
}
