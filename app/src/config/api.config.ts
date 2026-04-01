// ============================================================================
// API CONFIGURATION
// ============================================================================

/**
 * Configuración de URLs de la API externa
 * Estas URLs se usan en las API routes para hacer proxy a la API real
 */
export const API_CONFIG = {
  // URL base de la API externa (desde variables de entorno)
  baseURL: process.env.API_EXTERNAL_URL || 'https://api-externa.example.com',

  // Endpoints específicos
  endpoints: {
    clientes: '/api/clientes',
    presupuestos: '/api/presupuestos',
    inventario: '/api/inventario',
    facturacion: '/api/facturacion',
  },

  // Timeout para requests (en milisegundos)
  timeout: 30000, // 30 segundos

  // Headers por defecto
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const;

/**
 * Helper para construir URLs completas de endpoints
 */
export function getEndpointURL(endpoint: keyof typeof API_CONFIG.endpoints): string {
  return `${API_CONFIG.baseURL}${API_CONFIG.endpoints[endpoint]}`;
}
