'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Componente invisible que detecta errores de sesión propagados por NextAuth
 * (ej: refresh token revocado o Keycloak caído) y ejecuta el logout federado.
 *
 * Cubre el caso de tabs ya abiertas donde el middleware no re-evalúa la sesión
 * hasta la próxima navegación.
 */
export function SessionErrorGuard() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error !== 'RefreshAccessTokenError') return;

    fetch('/api/auth/logout', {
        method:  'POST',
        headers: { Origin: window.location.origin },
      })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { logoutUrl?: string } | null) => {
        window.location.href = data?.logoutUrl ?? '/login';
      })
      .catch(() => {
        window.location.href = '/login';
      });
  }, [session?.error]);

  return null;
}
