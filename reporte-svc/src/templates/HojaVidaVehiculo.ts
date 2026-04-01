// ============================================================================
// TEMPLATE: Hoja de Vida del Vehículo
// Datos esperados: historial de presupuestos de una patente
// ============================================================================

import { ReporteBase } from '../core/ReporteBase';
import type { ColumnDef, ReporteOptions } from '../types';

interface Row {
  fecha_presupuesto: string;
  numero:            number | null;
  estado:            string;
  cliente_nombre:    string;
  cliente_rut:       string;
  neto:              number;
  bruto:             number;
}

export class HojaVidaVehiculoReporte extends ReporteBase<Row> {
  readonly title     = 'Hoja de Vida del Vehículo';
  readonly sheetName = 'Historial';

  readonly columns: ColumnDef<Row>[] = [
    { header: 'Fecha',    key: 'fecha_presupuesto', width: 13, align: 'center', format: 'date' },
    { header: 'N°',       key: 'numero',            width: 8,  align: 'center' },
    { header: 'Estado',   key: 'estado',            width: 14, align: 'center' },
    { header: 'Cliente',  key: 'cliente_nombre',    width: 35, align: 'left'   },
    { header: 'RUT',      key: 'cliente_rut',       width: 16, align: 'center' },
    { header: 'Neto',     key: 'neto',              width: 16, align: 'right',  format: 'currency', total: 'sum' },
    { header: 'Total',    key: 'bruto',             width: 16, align: 'right',  format: 'currency', total: 'sum', bold: true },
  ];

  override readonly defaultOptions: ReporteOptions = {
    orientation: 'portrait',
    fitToPage:   true,
    showTotals:  true,
    showDate:    true,
  };
}
