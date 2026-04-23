// ============================================================================
// TEMPLATE: Lista de Modelos (export + plantilla de import)
// ============================================================================

import { ReporteBase } from '../core/ReporteBase';
import type { ColumnDef } from '../types';

interface Row {
  codigo:      string;
  descripcion: string;
  marca:       string;
  activo:      boolean;
}

export class ModelosListaReporte extends ReporteBase<Row> {
  readonly title     = 'Modelos';
  readonly sheetName = 'Modelos';

  readonly columns: ColumnDef<Row>[] = [
    { header: 'Código',      key: 'codigo',      width: 15, align: 'left'   },
    { header: 'Descripción', key: 'descripcion', width: 40, align: 'left'   },
    { header: 'Marca',       key: 'marca',       width: 25, align: 'left'   },
    { header: 'Activo',      key: 'activo',      width: 12, align: 'center' },
  ];

  override readonly defaultOptions = {
    orientation: 'portrait' as const,
    fitToPage:   true,
    showTotals:  false,
    showDate:    true,
  };
}
