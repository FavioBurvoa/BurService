// ============================================================================
// TEMPLATE: Lista de Vehículos (export + plantilla de import)
// ============================================================================

import { ReporteBase } from '../core/ReporteBase';
import type { ColumnDef } from '../types';

interface Row {
  ppu:           string;
  marca:         string;
  modelo:        string;
  anio:          number | null;
  color:         string | null;
  tipo_vehiculo: string | null;
  activo:        boolean;
}

export class VehiculosListaReporte extends ReporteBase<Row> {
  readonly title     = 'Vehículos';
  readonly sheetName = 'Vehículos';

  readonly columns: ColumnDef<Row>[] = [
    { header: 'PPU',           key: 'ppu',           width: 12, align: 'left'   },
    { header: 'Marca',         key: 'marca',         width: 22, align: 'left'   },
    { header: 'Modelo',        key: 'modelo',        width: 22, align: 'left'   },
    { header: 'Año',           key: 'anio',          width: 10, align: 'right'  },
    { header: 'Color',         key: 'color',         width: 18, align: 'left'   },
    { header: 'Tipo Vehículo', key: 'tipo_vehiculo', width: 20, align: 'left'   },
    { header: 'Activo',        key: 'activo',        width: 12, align: 'center' },
  ];

  override readonly defaultOptions = {
    orientation: 'landscape' as const,
    fitToPage:   true,
    showTotals:  false,
    showDate:    true,
  };
}
