// ============================================================================
// TEMPLATE: Lista de Tipos DTE (export + plantilla de import)
// ============================================================================

import { ReporteBase } from '../core/ReporteBase';
import type { ColumnDef } from '../types';

interface Row {
  codigo:         number;
  descripcion:    string;
  sw_afecto:      boolean;
  sw_exento:      boolean;
  sw_electronico: boolean;
  activo:         boolean;
}

export class TiposDteListaReporte extends ReporteBase<Row> {
  readonly title     = 'Tipos DTE';
  readonly sheetName = 'Tipos DTE';

  readonly columns: ColumnDef<Row>[] = [
    { header: 'Código',      key: 'codigo',         width: 12, align: 'right'  },
    { header: 'Descripción', key: 'descripcion',    width: 45, align: 'left'   },
    { header: 'Afecto',      key: 'sw_afecto',      width: 12, align: 'center' },
    { header: 'Exento',      key: 'sw_exento',      width: 12, align: 'center' },
    { header: 'Electrónico', key: 'sw_electronico', width: 14, align: 'center' },
    { header: 'Activo',      key: 'activo',         width: 12, align: 'center' },
  ];

  override readonly defaultOptions = {
    orientation: 'landscape' as const,
    fitToPage:   true,
    showTotals:  false,
    showDate:    true,
  };
}
