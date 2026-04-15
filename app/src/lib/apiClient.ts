// ============================================================================
// API CLIENT — Utilidad compartida para llamadas autenticadas al Node API
//
// Flujo:
//   Next.js API route → apiFetch → Node API (bur-service-api)
//
// El token Keycloak se obtiene del JWT encriptado de NextAuth (server-side)
// via getToken() y se reenvía como Authorization: Bearer <token>.
// Esto nunca se llama desde el cliente — solo desde API routes (server).
// ============================================================================

import { getToken } from 'next-auth/jwt';
import { headers } from 'next/headers';
import type { ApiResponse } from '@/components/mantenedor/types';

/**
 * Convierte errores de apiFetch al Response correcto para un route handler.
 * - Error con status 401 → Response JSON 401 (detectado por clientFetch → redirect login)
 * - Cualquier otro error  → Response JSON 500
 *
 * Uso en cada route handler:
 *   } catch (err) { return handleRouteError(err) }
 */
export function handleRouteError(err: unknown): Response {
  const status = (err as { status?: number }).status === 401 ? 401 : 500;
  const message = status === 401
    ? 'Sesión expirada'
    : 'Error al conectar con el servidor';
  return Response.json(
    { success: false, message, data: null, timestamp: new Date().toISOString() },
    { status },
  );
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface FetchOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Query params adicionales para GET (ej: { empresa_id: 1 }) */
  params?: Record<string, string | number>;
}

/**
 * Realiza una llamada autenticada al Node API.
 * Obtiene el accessToken del JWT raw de NextAuth (server-side) y lo reenvía como Bearer.
 * Lanza un error con status 401 si la sesión es inválida, expirada o sin token.
 *
 * @param path    Ruta relativa al API_URL (ej: '/tipos-vehiculo')
 * @param options Método HTTP, body y query params opcionales
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error('API_URL no está configurada en las variables de entorno');
  }

  // Obtener JWT raw de NextAuth (incluye accessToken sin exponer al cliente)
  const rawToken = await getToken({
    req: { headers: await headers() },
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  });

  if (!rawToken) {
    const err = new Error('Sin sesión activa') as Error & { status: number };
    err.status = 401;
    throw err;
  }

  if (rawToken.error === 'RefreshAccessTokenError') {
    const err = new Error('Sesión expirada — reingreso requerido') as Error & { status: number };
    err.status = 401;
    throw err;
  }

  const accessToken = rawToken.accessToken as string | undefined;

  if (!accessToken) {
    const err = new Error('Token de acceso no disponible') as Error & { status: number };
    err.status = 401;
    throw err;
  }

  // Safety net: si por alguna razón el middleware refrescó el token pero la cookie
  // actualizada no llegó al route handler (edge case de propagación), fallamos rápido
  // con 401 en lugar de enviar un accessToken expirado al Node API.
  // En operación normal este bloque nunca se ejecuta.
  if (typeof rawToken.expiresAt === 'number' && Date.now() >= rawToken.expiresAt) {
    const err = new Error('Token de acceso expirado') as Error & { status: number };
    err.status = 401;
    throw err;
  }

  // Construir URL con query params si los hay
  const url = new URL(`${apiUrl}${path}`);
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  const res = await fetch(url.toString(), {
    method:  options.method ?? 'GET',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });

  // El Node API siempre retorna ApiResponse — parsear independiente del status
  return res.json() as Promise<ApiResponse<T>>;
}
