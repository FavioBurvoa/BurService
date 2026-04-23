// ============================================================================
// TEMPLATE: Lista de Detalles de Tipo de Presupuesto (export + plantilla de import)
// ============================================================================

import { ReporteBase } from '../core/ReporteBase';
import type { ColumnDef } from '../types';

interface Row {
  codigo:          string;
  descripcion:     string;
  orden:           number;
  cant_max_det:    number;
  col_doc:         number;
  codigo_subtotal: string;
  nombre_subtotal: string;
  ver_sw_exento:   boolean;
  ver_cantidad:    boolean;
  ver_valor:       boolean;
  ver_total:       boolean;
  activo:          boolean;
}

export class TiposPresupuestoDetallesListaReporte extends ReporteBase<Row> {
  readonly title     = 'Detalles de Tipo de Presupuesto';
  readonly sheetName = 'Detalles';

  readonly columns: ColumnDef<Row>[] = [
    { header: 'Código',          key: 'codigo',          width: 12, align: 'left'   },
    { header: 'Descripción',     key: 'descripcion',     width: 28, align: 'left'   },
    { header: 'Orden',           key: 'orden',           width: 10, align: 'right'  },
    { header: 'Cant. Máx. Det.', key: 'cant_max_det',    width: 12, align: 'right'  },
    { header: 'Col. Doc.',       key: 'col_doc',         width: 10, align: 'right'  },
    { header: 'Código Subtotal', key: 'codigo_subtotal', width: 14, align: 'left'   },
    { header: 'Nombre Subtotal', key: 'nombre_subtotal', width: 28, align: 'left'   },
    { header: 'Ver SW Exento',   key: 'ver_sw_exento',   width: 12, align: 'center' },
    { header: 'Ver Cantidad',    key: 'ver_cantidad',    width: 12, align: 'center' },
    { header: 'Ver Valor',       key: 'ver_valor',       width: 12, align: 'center' },
    { header: 'Ver Total',       key: 'ver_total',       width: 12, align: 'center' },
    { header: 'Activo',          key: 'activo',          width: 10, align: 'center' },
  ];

  override readonly defaultOptions = {
    orientation: 'landscape' as const,
    fitToPage:   true,
    showTotals:  false,
    showDate:    true,
  };
}
