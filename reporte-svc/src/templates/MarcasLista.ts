// ============================================================================
// TEMPLATE: Lista de Marcas (export + plantilla de import)
// Datos esperados: Marca[]  — o [] para generar plantilla vacía
// ============================================================================

import { ReporteBase } from '../core/ReporteBase';
import type { ColumnDef } from '../types';

interface Row {
  codigo:      string;
  descripcion: string;
  activo:      boolean;
}

export class MarcasListaReporte extends ReporteBase<Row> {
  readonly title     = 'Marcas';
  readonly sheetName = 'Marcas';

  readonly columns: ColumnDef<Row>[] = [
    { header: 'Código',      key: 'codigo',      width: 15, align: 'left'   },
    { header: 'Descripción', key: 'descripcion', width: 40, align: 'left'   },
    { header: 'Activo',      key: 'activo',      width: 12, align: 'center' },
  ];

  override readonly defaultOptions = {
    orientation: 'portrait' as const,
    fitToPage:   true,
    showTotals:  false,
    showDate:    true,
  };
}
