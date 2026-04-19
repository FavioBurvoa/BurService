import type { ApiResponse } from '@/components/mantenedor/types';

/**
 * Construye el mensaje a mostrar en una notification de error a partir de un ApiResponse fallido.
 * Si el backend retornó errors[] (validación Zod), devuelve una lista multilínea con los detalles.
 * En caso contrario, devuelve el message general o un fallback.
 */
export function buildApiErrorMessage(
  data: ApiResponse<unknown>,
  fallback = 'Ocurrió un error',
): string {
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const lines = data.errors
      .map((e) => (e.detail ? `• ${e.detail}` : ''))
      .filter((s) => s !== '');
    if (lines.length > 0) return lines.join('\n');
  }
  return data.message || fallback;
}

/**
 * Indica si el error representa una validación fallida del backend.
 */
export function isApiValidationError(data: ApiResponse<unknown>): boolean {
  return Array.isArray(data.errors) && data.errors.length > 0;
}
