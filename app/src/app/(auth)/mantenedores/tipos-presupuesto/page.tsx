// ============================================================================
// PÁGINA: MANTENEDOR DE TIPOS DE PRESUPUESTO
// ============================================================================

'use client';

import { useState, useMemo } from 'react';
import { Container, Stack, Badge } from '@mantine/core';
import { Mantenedor } from '@/components/mantenedor/Mantenedor';
import type { MantenedorConfig, ColumnConfig } from '@/components/mantenedor/types';

// ============================================================================
// TIPOS
// ============================================================================

interface TipoPresupuesto {
  id: number;
  id_empresa: number;
  codigo: string;
  descripcion: string;
  id_tipo_dte: number | null;
  encabezado_linea1: string | null;
  encabezado_linea2: string | null;
  logo_ancho: number | null;
  logo_alto: number | null;
  dias_validez: number;
  activo: boolean;
}

interface TipoPresupuestoDetalle {
  id: number;
  id_tipo_presupuesto: number;
  codigo: string;
  descripcion: string;
  orden: number;
  cant_max_det: number;
  col_doc: number;
  codigo_subtotal: string;
  nombre_subtotal: string;
  ver_sw_exento: boolean;
  ver_cantidad: boolean;
  ver_valor: boolean;
  ver_total: boolean;
  activo: boolean;
}

// ============================================================================
// COLUMNAS - TIPO PRESUPUESTO
// ============================================================================

const columnsTipo: ColumnConfig<TipoPresupuesto>[] = [
  {
    key: 'id',
    header: 'ID',
    dataType: 'number',
    usage: { grid: { visible: false }, form: { visible: false } },
  },
  {
    key: 'codigo',
    header: 'Código',
    dataType: 'string',
    required: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'text',
      placeholder: 'Ej: PYD',
      validation: { maxLength: 10 },
    },
  },
  {
    key: 'descripcion',
    header: 'Descripción',
    dataType: 'string',
    required: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 2 } },
    editor: {
      type: 'text',
      placeholder: 'Descripción del tipo de presupuesto',
      validation: { maxLength: 200 },
    },
  },
  {
    key: 'id_tipo_dte',
    header: 'Tipo DTE',
    dataType: 'enum',
    required: false,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'select',
      optionsKey: 'tipos_dte',
      placeholder: 'Seleccione tipo DTE',
    },
  },
  {
    key: 'encabezado_linea1',
    header: 'Encabezado línea 1',
    dataType: 'string',
    required: false,
    usage: { grid: { visible: false }, form: { visible: true, editable: true, colSpan: 2 } },
    editor: {
      type: 'text',
      placeholder: 'Ej: Taller Automotriz',
      validation: { maxLength: 150 },
    },
  },
  {
    key: 'encabezado_linea2',
    header: 'Encabezado línea 2',
    dataType: 'string',
    required: false,
    usage: { grid: { visible: false }, form: { visible: true, editable: true, colSpan: 2 } },
    editor: {
      type: 'text',
      placeholder: 'Ej: BUR-SERVICE',
      validation: { maxLength: 150 },
    },
  },
  {
    key: 'logo_ancho',
    header: 'Logo ancho (px)',
    dataType: 'number',
    required: false,
    usage: { grid: { visible: false }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: { type: 'number', placeholder: '120', min: 20, max: 300 },
  },
  {
    key: 'logo_alto',
    header: 'Logo alto (px)',
    dataType: 'number',
    required: false,
    usage: { grid: { visible: false }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: { type: 'number', placeholder: '60', min: 20, max: 200 },
  },
  {
    key: 'dias_validez',
    header: 'Días validez presupuesto',
    dataType: 'number',
    required: false,
    defaultValue: 15,
    usage: { grid: { visible: false }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: { type: 'number', placeholder: '15', min: 1 },
  },
  {
    key: 'activo',
    header: 'Estado',
    dataType: 'boolean',
    defaultValue: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: { type: 'switch' },
    formatter: (value) => (
      <Badge color={value ? 'green' : 'gray'} variant="light" size="sm">
        {value ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
];

// ============================================================================
// COLUMNAS - DETALLE
// ============================================================================

const columnsDetalle: ColumnConfig<TipoPresupuestoDetalle>[] = [
  {
    key: 'id',
    header: 'ID',
    dataType: 'number',
    usage: { grid: { visible: false }, form: { visible: false } },
  },
  {
    key: 'id_tipo_presupuesto',
    header: 'Tipo Presupuesto',
    dataType: 'number',
    usage: { grid: { visible: false }, form: { visible: false } },
  },
  {
    key: 'codigo',
    header: 'Código',
    dataType: 'string',
    required: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'text',
      placeholder: 'Ej: RP',
      validation: { maxLength: 10 },
    },
  },
  {
    key: 'descripcion',
    header: 'Descripción',
    dataType: 'string',
    required: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 2 } },
    editor: {
      type: 'text',
      placeholder: 'Descripción del detalle',
      validation: { maxLength: 100 },
    },
  },
  {
    key: 'orden',
    header: 'Orden',
    dataType: 'number',
    required: true,
    defaultValue: 1,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: { type: 'number', placeholder: '1', min: 1 },
  },
  {
    key: 'cant_max_det',
    header: 'Máx. líneas',
    dataType: 'number',
    required: true,
    defaultValue: 10,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: { type: 'number', placeholder: '10', min: 1 },
  },
  {
    key: 'col_doc',
    header: 'Columna doc.',
    dataType: 'enum',
    required: true,
    defaultValue: 1,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'select',
      optionsKey: 'col_doc',
      placeholder: 'Seleccione columna',
    },
    formatter: (value) => (
      <Badge color={value === 1 ? 'blue' : 'teal'} variant="light" size="sm">
        {value === 1 ? 'Izquierda' : 'Derecha'}
      </Badge>
    ),
  },
  {
    key: 'codigo_subtotal',
    header: 'Cód. Subtotal',
    dataType: 'string',
    required: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'text',
      placeholder: 'Ej: REP',
      validation: { maxLength: 10 },
    },
  },
  {
    key: 'nombre_subtotal',
    header: 'Nombre Subtotal',
    dataType: 'string',
    required: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 2 } },
    editor: {
      type: 'text',
      placeholder: 'Ej: Subtotal Repuestos',
      validation: { maxLength: 50 },
    },
  },
  {
    key: 'ver_sw_exento',
    header: 'Ver Exento',
    dataType: 'boolean',
    defaultValue: false,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: { type: 'switch' },
    formatter: (value) => (
      <Badge color={value ? 'blue' : 'gray'} variant="light" size="sm">
        {value ? 'Sí' : 'No'}
      </Badge>
    ),
  },
  {
    key: 'ver_cantidad',
    header: 'Ver Cantidad',
    dataType: 'boolean',
    defaultValue: false,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: { type: 'switch' },
    formatter: (value) => (
      <Badge color={value ? 'blue' : 'gray'} variant="light" size="sm">
        {value ? 'Sí' : 'No'}
      </Badge>
    ),
  },
  {
    key: 'ver_valor',
    header: 'Ver Valor',
    dataType: 'boolean',
    defaultValue: false,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: { type: 'switch' },
    formatter: (value) => (
      <Badge color={value ? 'blue' : 'gray'} variant="light" size="sm">
        {value ? 'Sí' : 'No'}
      </Badge>
    ),
  },
  {
    key: 'ver_total',
    header: 'Ver Total',
    dataType: 'boolean',
    defaultValue: false,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: { type: 'switch' },
    formatter: (value) => (
      <Badge color={value ? 'blue' : 'gray'} variant="light" size="sm">
        {value ? 'Sí' : 'No'}
      </Badge>
    ),
  },
  {
    key: 'activo',
    header: 'Estado',
    dataType: 'boolean',
    defaultValue: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: { type: 'switch' },
    formatter: (value) => (
      <Badge color={value ? 'green' : 'gray'} variant="light" size="sm">
        {value ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
];

// ============================================================================
// CONFIGURACIÓN DE MANTENEDORES
// ============================================================================

const configTipo: MantenedorConfig<TipoPresupuesto> = {
  title: 'Tipos de Presupuesto',
  idField: 'id',
  data:   { path: '/api/tipos-presupuesto',  method: 'GET'    },
  save:   { path: '/api/tipos-presupuesto',  method: 'POST'   },
  delete: { path: '/api/tipos-presupuesto',  method: 'DELETE' },
  columns: columnsTipo,
  combos: {
    empresas:  { path: '/api/combos/empresas',  method: 'GET' },
    tipos_dte: { path: '/api/combos/tipos-dte', method: 'GET' },
  },
  contextConfig: {
    field:       'id_empresa',
    comboKey:    'empresas',
    label:       'Empresa',
    placeholder: 'Seleccione empresa...',
  },
  bulkOps: {
    export: true,
    import: true,
  },
};

function buildConfigDetalle(idEmpresa: string | null): MantenedorConfig<TipoPresupuestoDetalle> {
  const comboPath = idEmpresa
    ? `/api/combos/tipos-presupuesto?id_empresa=${idEmpresa}`
    : '/api/combos/tipos-presupuesto';

  return {
    title: 'Detalles',
    idField: 'id',
    data:   { path: '/api/tipos-presupuesto-detalles',  method: 'GET'    },
    save:   { path: '/api/tipos-presupuesto-detalles',  method: 'POST'   },
    delete: { path: '/api/tipos-presupuesto-detalles',  method: 'DELETE' },
    columns: columnsDetalle,
    combos: {
      tipos_presupuesto: { path: comboPath, method: 'GET' },
      col_doc: {
        static: [
          { valor: 1, texto: 'Izquierda' },
          { valor: 2, texto: 'Derecha'   },
        ],
      },
    },
    contextConfig: {
      field: 'id_tipo_presupuesto',
      comboKey: 'tipos_presupuesto',
      label: 'Tipo de Presupuesto',
      placeholder: 'Seleccione tipo de presupuesto...',
    },
    bulkOps: {
      export: true,
      import: true,
    },
  };
}

// ============================================================================
// COMPONENTE
// ============================================================================

export default function TiposPresupuestoPage() {
  const [selectedEmpresa, setSelectedEmpresa] = useState<string | null>(null);
  const configDetalle = useMemo(() => buildConfigDetalle(selectedEmpresa), [selectedEmpresa]);

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Mantenedor<TipoPresupuesto> config={configTipo} onContextChange={setSelectedEmpresa} />
        <Mantenedor<TipoPresupuestoDetalle> config={configDetalle} key={selectedEmpresa ?? 'none'} />
      </Stack>
    </Container>
  );
}
