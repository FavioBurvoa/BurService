// ============================================================================
// TEMPLATE: Lista de Comunas (export + plantilla de import)
// ============================================================================

import { ReporteBase } from '../core/ReporteBase';
import type { ColumnDef } from '../types';

interface Row {
  codigo:      string;
  descripcion: string;
  region:      string;
  orden:       number;
  codigo_sii:  string | null;
  activo:      boolean;
}

export class ComunasListaReporte extends ReporteBase<Row> {
  readonly title     = 'Comunas';
  readonly sheetName = 'Comunas';

  readonly columns: ColumnDef<Row>[] = [
    { header: 'Código',      key: 'codigo',      width: 15, align: 'left'   },
    { header: 'Descripción', key: 'descripcion', width: 35, align: 'left'   },
    { header: 'Región',      key: 'region',      width: 30, align: 'left'   },
    { header: 'Orden',       key: 'orden',       width: 10, align: 'right'  },
    { header: 'Código SII',  key: 'codigo_sii',  width: 15, align: 'left'   },
    { header: 'Activo',      key: 'activo',      width: 12, align: 'center' },
  ];

  override readonly defaultOptions = {
    orientation: 'portrait' as const,
    fitToPage:   true,
    showTotals:  false,
    showDate:    true,
  };
}
