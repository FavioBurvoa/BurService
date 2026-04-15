// ============================================================================
// TIPOS GLOBALES - BUR-SERVICE
// ============================================================================

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
declare module '@auth/core/types' {
  interface Session {
    error?: 'RefreshAccessTokenError'
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    idToken?: string
    expiresAt?: number
    error?: 'RefreshAccessTokenError'
  }
}
