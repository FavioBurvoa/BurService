// ============================================================================
// TEMPLATE: Lista de Regiones (export + plantilla de import)
// ============================================================================

import { ReporteBase } from '../core/ReporteBase';
import type { ColumnDef } from '../types';

interface Row {
  codigo:      string;
  descripcion: string;
  orden:       number;
  codigo_sii:  string | null;
  activo:      boolean;
}

export class RegionesListaReporte extends ReporteBase<Row> {
  readonly title     = 'Regiones';
  readonly sheetName = 'Regiones';

  readonly columns: ColumnDef<Row>[] = [
    { header: 'Código',      key: 'codigo',      width: 12, align: 'left'   },
    { header: 'Descripción', key: 'descripcion', width: 45, align: 'left'   },
    { header: 'Orden',       key: 'orden',       width: 10, align: 'right'  },
    { header: 'Código SII',  key: 'codigo_sii',  width: 14, align: 'left'   },
    { header: 'Activo',      key: 'activo',      width: 12, align: 'center' },
  ];

  override readonly defaultOptions = {
    orientation: 'portrait' as const,
    fitToPage:   true,
    showTotals:  false,
    showDate:    true,
  };
}
