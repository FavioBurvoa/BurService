// ============================================================================
// TEMPLATE: Lista de Tipos de Contribuyente (export + plantilla de import)
// ============================================================================

import { ReporteBase } from '../core/ReporteBase';
import type { ColumnDef } from '../types';

interface Row {
  codigo:      string;
  descripcion: string;
  sw_factura:  boolean;
  activo:      boolean;
}

export class TiposContribuyenteListaReporte extends ReporteBase<Row> {
  readonly title     = 'Tipos de Contribuyente';
  readonly sheetName = 'Tipos de Contribuyente';

  readonly columns: ColumnDef<Row>[] = [
    { header: 'Código',      key: 'codigo',      width: 15, align: 'left'   },
    { header: 'Descripción', key: 'descripcion', width: 40, align: 'left'   },
    { header: 'Factura',     key: 'sw_factura',  width: 12, align: 'center' },
    { header: 'Activo',      key: 'activo',      width: 12, align: 'center' },
  ];

  override readonly defaultOptions = {
    orientation: 'portrait' as const,
    fitToPage:   true,
    showTotals:  false,
    showDate:    true,
  };
}
