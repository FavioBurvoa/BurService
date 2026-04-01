// ============================================================================
// TEMPLATE: Seguimiento por Cliente
// Datos esperados: filas agrupadas/aplanadas por cliente
// ============================================================================

import { ReporteBase } from '../core/ReporteBase';
import type { ColumnDef } from '../types';

interface Row {
  cliente_nombre: string;
  cliente_rut:    string;
  count:          number;
  neto:           number;
  exento:         number;
  bruto:          number;
}

export class SeguimientoClienteReporte extends ReporteBase<Row> {
  readonly title     = 'Seguimiento por Cliente';
  readonly sheetName = 'Seguimiento';

  readonly columns: ColumnDef<Row>[] = [
    { header: 'Cliente',        key: 'cliente_nombre', width: 40, align: 'left'   },
    { header: 'RUT',            key: 'cliente_rut',    width: 16, align: 'center' },
    { header: 'Presupuestos',   key: 'count',          width: 14, align: 'center', total: 'sum' },
    { header: 'Neto',           key: 'neto',           width: 16, align: 'right',  format: 'currency', total: 'sum' },
    { header: 'Exento',         key: 'exento',         width: 16, align: 'right',  format: 'currency', total: 'sum' },
    { header: 'Total bruto',    key: 'bruto',          width: 16, align: 'right',  format: 'currency', total: 'sum', bold: true },
  ];
}
