// ============================================================================
// REPORTE-SVC — TIPOS BASE
// Contrato entre el caller (Node API) y este servicio.
// ============================================================================

/** Formatos de celda soportados */
export type CellFormat = 'text' | 'number' | 'currency' | 'date' | 'percent';

/** Función de totales por columna */
export type TotalFn = 'sum' | 'count' | 'avg';

/** Definición de una columna del reporte */
export interface ColumnDef<T = Record<string, unknown>> {
  header:   string;
  key:      keyof T & string;
  width:    number;              // ancho en caracteres (explícito — crítico para fidelidad PDF)
  align?:   'left' | 'center' | 'right';
  format?:  CellFormat;
  bold?:    boolean;
  wrap?:    boolean;
  total?:   TotalFn;
}

/** Opciones globales del reporte */
export interface ReporteOptions {
  orientation?: 'portrait' | 'landscape';
  fitToPage?:   boolean;          // default true — necesario para PDF consistente
  showTotals?:  boolean;          // default true si alguna columna tiene total
  title?:       string;           // fila de título sobre la tabla
  subtitle?:    string;
  showDate?:    boolean;          // muestra fecha de generación
}

/** Request que recibe el servicio */
export interface RenderRequest {
  template: string;               // nombre del template a usar
  formato:  'xlsx' | 'pdf';
  data:     unknown[];
  options?: ReporteOptions;
}

/** Respuesta de error estándar */
export interface RenderError {
  success: false;
  message: string;
}
