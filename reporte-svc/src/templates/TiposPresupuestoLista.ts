// ============================================================================
// TEMPLATE: Lista de Tipos de Presupuesto (export + plantilla de import)
// ============================================================================

import { ReporteBase } from '../core/ReporteBase';
import type { ColumnDef } from '../types';

interface Row {
  codigo:            string;
  descripcion:       string;
  tipo_dte:          string | null;
  encabezado_linea1: string | null;
  encabezado_linea2: string | null;
  logo_ancho:        number | null;
  logo_alto:         number | null;
  dias_validez:      number;
  activo:            boolean;
}

export class TiposPresupuestoListaReporte extends ReporteBase<Row> {
  readonly title     = 'Tipos de Presupuesto';
  readonly sheetName = 'Tipos Presupuesto';

  readonly columns: ColumnDef<Row>[] = [
    { header: 'Código',             key: 'codigo',            width: 15, align: 'left'   },
    { header: 'Descripción',        key: 'descripcion',       width: 35, align: 'left'   },
    { header: 'Tipo DTE',           key: 'tipo_dte',          width: 15, align: 'left'   },
    { header: 'Encabezado Línea 1', key: 'encabezado_linea1', width: 35, align: 'left'   },
    { header: 'Encabezado Línea 2', key: 'encabezado_linea2', width: 35, align: 'left'   },
    { header: 'Logo Ancho',         key: 'logo_ancho',        width: 12, align: 'right'  },
    { header: 'Logo Alto',          key: 'logo_alto',         width: 12, align: 'right'  },
    { header: 'Días Validez',       key: 'dias_validez',      width: 12, align: 'right'  },
    { header: 'Activo',             key: 'activo',            width: 10, align: 'center' },
  ];

  override readonly defaultOptions = {
    orientation: 'landscape' as const,
    fitToPage:   true,
    showTotals:  false,
    showDate:    true,
  };
}
