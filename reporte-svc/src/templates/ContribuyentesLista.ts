// ============================================================================
// TEMPLATE: Lista de Contribuyentes (export + plantilla de import)
// ============================================================================

import { ReporteBase } from '../core/ReporteBase';
import type { ColumnDef } from '../types';

interface Row {
  rut:                 string;
  nombre:              string;
  apellidos:           string;
  giro:                string | null;
  comuna:              string | null;
  direccion:           string | null;
  email:               string | null;
  telefono:            string | null;
  telefono2:           string | null;
  tipos_contribuyente: string;
  activo:              boolean;
}

export class ContribuyentesListaReporte extends ReporteBase<Row> {
  readonly title     = 'Contribuyentes';
  readonly sheetName = 'Contribuyentes';

  readonly columns: ColumnDef<Row>[] = [
    { header: 'RUT',          key: 'rut',                 width: 15, align: 'left'   },
    { header: 'Nombre',       key: 'nombre',              width: 30, align: 'left'   },
    { header: 'Apellidos',    key: 'apellidos',           width: 30, align: 'left'   },
    { header: 'Giro',         key: 'giro',                width: 30, align: 'left'   },
    { header: 'Comuna',       key: 'comuna',              width: 22, align: 'left'   },
    { header: 'Dirección',    key: 'direccion',           width: 35, align: 'left'   },
    { header: 'Email',        key: 'email',               width: 28, align: 'left'   },
    { header: 'Teléfono',     key: 'telefono',            width: 16, align: 'left'   },
    { header: 'Teléfono 2',   key: 'telefono2',           width: 16, align: 'left'   },
    { header: 'Tipos',        key: 'tipos_contribuyente', width: 30, align: 'left'   },
    { header: 'Activo',       key: 'activo',              width: 12, align: 'center' },
  ];

  override readonly defaultOptions = {
    orientation: 'landscape' as const,
    fitToPage:   true,
    showTotals:  false,
    showDate:    true,
  };
}
