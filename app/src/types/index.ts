// ============================================================================
// TIPOS GLOBALES - BUR-SERVICE
// ============================================================================

/**
 * Estructura estándar de respuesta de la API externa
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: ApiError[];
  timestamp?: string;
}

/**
 * Estructura de errores de la API
 */
export interface ApiError {
  field?: string;
  code?: string;
  detail?: string;
}

/**
 * Configuración de items del menú
 */
export interface MenuItem {
  id: string;
  label: string;
  icon: string;             // Nombre del icono de @tabler/icons-react
  href?: string;
  children?: MenuItemChild[];
}

export interface MenuItemChild {
  label: string;
  href: string;
}

/**
 * Configuración completa del menú
 */
export interface MenuConfig {
  items: MenuItem[];
}

/**
 * Extensión de tipos de NextAuth v5
 */
declare module 'next-auth' {
  interface Session {
    accessToken?: string
    error?: string
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    error?: string
  }
}
