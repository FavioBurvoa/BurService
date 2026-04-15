// ============================================================================
// AUTH HOOK
// ============================================================================

'use client';

import { useSession } from 'next-auth/react';
import { signIn, signOut } from 'next-auth/react';

/**
 * Hook personalizado para manejar autenticación
 *
 * @returns Objeto con estado de sesión y funciones de autenticación
 */
export function useAuth() {
  const { data: session, status } = useSession();

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  /**
   * Iniciar sesión con Keycloak
   */
  const login = async () => {
    await signIn('keycloak', { callbackUrl: '/dashboard' });
  };

  /**
   * Cerrar sesión: limpia la sesión NextAuth server-side y cierra
   * la sesión en Keycloak (logout federado).
   */
  const logout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method:  'POST',
        headers: { Origin: window.location.origin },
      });

      if (res.ok) {
        const { logoutUrl } = await res.json() as { logoutUrl: string };
        window.location.href = logoutUrl;
        return;
      }
    } catch {
      // Si la API route falla, caer al logout local de NextAuth
    }

    await signOut({ callbackUrl: '/login' });
  };

  return {
    session,
    user: session?.user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
