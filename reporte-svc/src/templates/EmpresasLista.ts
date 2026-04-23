// ============================================================================
// TEMPLATE: Lista de Empresas (export + plantilla de import)
// ============================================================================

import { ReporteBase } from '../core/ReporteBase';
import type { ColumnDef } from '../types';

interface Row {
  codigo:                string;
  rut:                   string;
  razon_social:          string;
  nombre_fantasia:       string | null;
  giro:                  string | null;
  act_eco:               string | null;
  comuna:                string | null;
  direccion:             string | null;
  direccion_referencia:  string | null;
  email:                 string | null;
  telefono:              string | null;
  numero_resolucion_sii: number | null;
  fecha_resolucion_sii:  string | null;
  porcentaje_iva:        number;
  ambiente:              number;
  activo:                boolean;
}

export class EmpresasListaReporte extends ReporteBase<Row> {
  readonly title     = 'Empresas';
  readonly sheetName = 'Empresas';

  readonly columns: ColumnDef<Row>[] = [
    { header: 'Código',                key: 'codigo',                width: 12, align: 'left'   },
    { header: 'RUT',                   key: 'rut',                   width: 15, align: 'left'   },
    { header: 'Razón Social',          key: 'razon_social',          width: 35, align: 'left'   },
    { header: 'Nombre Fantasía',       key: 'nombre_fantasia',       width: 30, align: 'left'   },
    { header: 'Giro',                  key: 'giro',                  width: 30, align: 'left'   },
    { header: 'Act. Eco.',             key: 'act_eco',               width: 12, align: 'left'   },
    { header: 'Comuna',                key: 'comuna',                width: 22, align: 'left'   },
    { header: 'Dirección',             key: 'direccion',             width: 30, align: 'left'   },
    { header: 'Dirección Referencia',  key: 'direccion_referencia',  width: 30, align: 'left'   },
    { header: 'Email',                 key: 'email',                 width: 28, align: 'left'   },
    { header: 'Teléfono',              key: 'telefono',              width: 16, align: 'left'   },
    { header: 'Nro Resolución SII',    key: 'numero_resolucion_sii', width: 15, align: 'right'  },
    { header: 'Fecha Resolución SII',  key: 'fecha_resolucion_sii',  width: 18, align: 'center' },
    { header: '% IVA',                 key: 'porcentaje_iva',        width: 10, align: 'right'  },
    { header: 'Ambiente',              key: 'ambiente',              width: 10, align: 'center' },
    { header: 'Activo',                key: 'activo',                width: 10, align: 'center' },
  ];

  override readonly defaultOptions = {
    orientation: 'landscape' as const,
    fitToPage:   true,
    showTotals:  false,
    showDate:    true,
  };
}
