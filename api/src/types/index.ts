// ============================================================================
// TIPOS GLOBALES
// ============================================================================

/**
 * Payload del JWT emitido por Keycloak.
 * Los claims empresa_id, email y roles son claims personalizados del realm.
 */
export interface JWTPayload {
  sub:        string;
  empresa_id: number;
  email:      string;
  roles:      string[];
}

/**
 * Error individual en una respuesta fallida.
 * Mismo contrato que la app Next.js (ApiError en mantenedor/types.ts).
 */
export interface ApiError {
  field?:  string;
  code?:   string;
  detail?: string;
}

/**
 * Respuesta estándar de la API.
 * Mismo contrato que la app Next.js (ApiResponse en mantenedor/types.ts).
 */
export interface ApiResponse<T = unknown> {
  success:    boolean;
  message:    string;
  data:       T | null;
  errors?:    ApiError[];
  timestamp:  string;
}

/**
 * Estructura que DEBE retornar todo stored procedure.
 * El SP es responsable de armar message y data.
 *
 * Ejemplo en SQL:
 *   RETURN json_build_object('message', 'Registros obtenidos', 'data', json_agg(...));
 */
export interface SpResult<T = unknown> {
  message: string;
  data:    T;
}

// ============================================================================
// EXTENSIÓN DE EXPRESS REQUEST
// Permite usar req.user en controllers y middlewares con tipado correcto.
// ============================================================================
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
