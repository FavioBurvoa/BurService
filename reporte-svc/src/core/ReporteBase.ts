// ============================================================================
// REPORTE BASE
// Clase abstracta que todos los reportes extienden.
// Solo declaran: title, sheetName, columns.
// El rendering lo hace ExcelBuilder — ningún reporte escribe código Excel.
// ============================================================================

import type { ColumnDef, ReporteOptions } from '../types';

export abstract class ReporteBase<T = Record<string, unknown>> {
  /** Título del reporte (aparece en fila 1 del Excel) */
  abstract readonly title: string;

  /** Nombre de la hoja Excel */
  abstract readonly sheetName: string;

  /** Definición de columnas: cabecera, clave, ancho, formato, totales */
  abstract readonly columns: ColumnDef<T>[];

  /** Opciones por defecto del reporte — pueden sobreescribirse en el request */
  readonly defaultOptions: ReporteOptions = {
    orientation: 'landscape',
    fitToPage:   true,
    showTotals:  true,
    showDate:    true,
  };
}
