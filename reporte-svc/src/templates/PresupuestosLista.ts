// ============================================================================
// TEMPLATE: Lista de Presupuestos
// Datos esperados: PresupuestoListItem[]
// ============================================================================

import { ReporteBase } from '../core/ReporteBase';
import type { ColumnDef } from '../types';

interface Row {
  numero:            number | null;
  folio:             string;
  estado:            string;
  fecha_presupuesto: string;
  patente:           string;
  cliente_nombre:    string;
  neto:              number;
  exento:            number;
  iva:               number;
  bruto:             number;
}

export class PresupuestosListaReporte extends ReporteBase<Row> {
  readonly title     = 'Lista de Presupuestos';
  readonly sheetName = 'Presupuestos';

  readonly columns: ColumnDef<Row>[] = [
    { header: 'N°',       key: 'numero',            width: 8,  align: 'center' },
    { header: 'Folio',    key: 'folio',              width: 14, align: 'left'   },
    { header: 'Estado',   key: 'estado',             width: 14, align: 'center' },
    { header: 'Fecha',    key: 'fecha_presupuesto',  width: 13, align: 'center', format: 'date' },
    { header: 'Patente',  key: 'patente',            width: 12, align: 'center' },
    { header: 'Cliente',  key: 'cliente_nombre',     width: 38, align: 'left'   },
    { header: 'Neto',     key: 'neto',               width: 16, align: 'right',  format: 'currency', total: 'sum' },
    { header: 'Exento',   key: 'exento',             width: 16, align: 'right',  format: 'currency', total: 'sum' },
    { header: 'IVA',      key: 'iva',                width: 16, align: 'right',  format: 'currency', total: 'sum' },
    { header: 'Total',    key: 'bruto',              width: 16, align: 'right',  format: 'currency', total: 'sum', bold: true },
  ];

  override readonly defaultOptions = {
    orientation: 'landscape' as const,
    fitToPage:   true,
    showTotals:  true,
    showDate:    true,
  };
}
