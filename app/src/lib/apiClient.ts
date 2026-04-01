// ============================================================================
// API CLIENT — Utilidad compartida para llamadas autenticadas al Node API
//
// Flujo:
//   Next.js API route → apiFetch → Node API (bur-service-api)
//
// El token Keycloak se obtiene de la sesión NextAuth (server-side)
// y se reenvía como Authorization: Bearer <token>.
// Esto nunca se llama desde el cliente — solo desde API routes (server).
// ============================================================================

import { auth } from '@/lib/auth';
import type { ApiResponse } from '@/components/mantenedor/types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface FetchOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Query params adicionales para GET (ej: { empresa_id: 1 }) */
  params?: Record<string, string | number>;
}

/**
 * Realiza una llamada autenticada al Node API.
 * Obtiene el accessToken de la sesión NextAuth y lo reenvía como Bearer.
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

  // Obtener token de la sesión NextAuth (server-side)
  const session = await auth();
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
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
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });

  // El Node API siempre retorna ApiResponse — parsear independiente del status
  return res.json() as Promise<ApiResponse<T>>;
}
