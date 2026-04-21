// ============================================================================
// IMPORT RESULT — Tipos compartidos del resultado de import bulk.
//
// El resolver (Node API opción 7) devuelve un array de ResolvedRow.
// El commit (loop de POST /api/<entidad>) acumula ImportRowResult por fila.
// ============================================================================

import type { ApiError } from '@/components/mantenedor/types';

export type ImportAction = 'insert' | 'update';

/** Fila tal como la devuelve el resolver (opción 7 del SP). */
export interface ResolvedRow {
  fila:   number;
  action: ImportAction;
  data:   Record<string, unknown>;
  errors: ApiError[] | null;
}

export type ImportRowStatus = 'creado' | 'actualizado' | 'error' | 'omitido' | 'pendiente';

/** Resultado por fila después del commit. */
export interface ImportRowResult {
  fila:          number;
  status:        ImportRowStatus;
  action:        ImportAction;
  /** Identificador humano (ej: rut, patente, descripción) para ubicar la fila. */
  identificador: string;
  /** ID resultante si el registro fue creado/actualizado. */
  id?:           number;
  /** Mensaje de error si status === 'error'. */
  mensaje?:      string;
  /** Errores por campo. */
  campos?:       ApiError[];
}

export interface ImportSummary {
  totalFilas:    number;
  creadas:       number;
  actualizadas:  number;
  conError:      number;
  omitidas:      number;
  duracionMs:    number;
  detalle:       ImportRowResult[];
}
