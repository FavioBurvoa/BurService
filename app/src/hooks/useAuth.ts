// ============================================================================
// AUTH HOOK
// ============================================================================

'use client';

import { useSession } from 'next-auth/react';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Hook personalizado para manejar autenticación
 *
 * @returns Objeto con estado de sesión y funciones de autenticación
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  /**
   * Iniciar sesión con Keycloak
   */
  const login = async () => {
    await signIn('keycloak', { callbackUrl: '/dashboard' });
  };

  /**
   * Cerrar sesión
   */
  const logout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  /**
   * Redirigir a página de login si no está autenticado
   */
  const requireAuth = () => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  };

  return {
    session,
    user: session?.user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    requireAuth,
  };
}
