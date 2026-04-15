// ============================================================================
// CLIENT FETCH — Wrapper de fetch para componentes cliente
//
// Centraliza el manejo de respuestas 401: redirige al login y aborta
// el flujo antes de que el llamador intente parsear la respuesta.
//
// Uso: reemplaza fetch() en cualquier componente cliente que llame
// a las API routes de Next.js (/api/*).
// ============================================================================

/**
 * Error que indica sesión vencida.
 * Los catch handlers deben verificar este tipo antes de mostrar
 * un error genérico al usuario, ya que el redirect ya está en curso.
 */
export class SessionExpiredError extends Error {
  constructor() {
    super('Sesión expirada')
    this.name = 'SessionExpiredError'
  }
}

/**
 * Wrapper de fetch para uso cliente.
 * Detecta respuestas 401 del middleware, redirige al login y lanza
 * SessionExpiredError para abortar el flujo del llamador.
 */
export async function clientFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options)

  if (res.status === 401) {
    window.location.href = '/login'
    throw new SessionExpiredError()
  }

  return res
}
