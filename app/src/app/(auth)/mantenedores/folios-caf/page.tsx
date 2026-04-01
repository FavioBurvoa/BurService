// ============================================================================
// PÁGINA: MANTENEDOR DE FOLIOS CAF
// ============================================================================

'use client';

import { Container, Badge } from '@mantine/core';
import { Mantenedor } from '@/components/mantenedor/Mantenedor';
import type { MantenedorConfig, ColumnConfig } from '@/components/mantenedor/types';

// ============================================================================
// TIPOS
// ============================================================================

interface FolioCaf {
  id: number;
  id_empresa: number;
  id_tipo_dte: number;
  folio_desde: number;
  folio_hasta: number;
  nombre_archivo: string;
  mime_type: string;
  fecha_vencimiento: string | null;
  archivo_caf: string;
  activo: boolean;
}

// ============================================================================
// CONFIGURACIÓN DE COLUMNAS
// ============================================================================

const columns: ColumnConfig<FolioCaf>[] = [
  {
    key: 'id',
    header: 'ID',
    dataType: 'number',
    usage: { grid: { visible: false }, form: { visible: false } },
  },
  {
    key: 'id_empresa',
    header: 'Empresa',
    dataType: 'number',
    usage: { grid: { visible: false }, form: { visible: false } },
  },
  {
    key: 'id_tipo_dte',
    header: 'Tipo DTE',
    dataType: 'enum',
    required: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'select',
      optionsKey: 'tipos_dte',
      placeholder: 'Seleccione tipo DTE',
    },
  },
  {
    key: 'folio_desde',
    header: 'Folio Desde',
    dataType: 'number',
    required: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'number',
      placeholder: 'Folio inicial',
      min: 1,
    },
  },
  {
    key: 'folio_hasta',
    header: 'Folio Hasta',
    dataType: 'number',
    required: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'number',
      placeholder: 'Folio final',
      min: 1,
    },
  },
  // Campos backing del archivo — ocultos (los gestiona el tipo 'file')
  {
    key: 'nombre_archivo',
    header: 'Nombre Archivo',
    dataType: 'string',
    usage: { grid: { visible: false }, form: { visible: false } },
  },
  {
    key: 'mime_type',
    header: 'Tipo MIME',
    dataType: 'string',
    usage: { grid: { visible: false }, form: { visible: false } },
  },
  {
    key: 'archivo_caf',
    header: 'Archivo CAF',
    dataType: 'string',
    usage: { grid: { visible: false }, form: { visible: false } },
  },
  // Selector de archivo CAF (solo visible en el modal)
  {
    key: '_archivoCaf',
    header: 'Archivo CAF (.xml)',
    dataType: 'file',
    required: true,
    usage: { grid: { visible: false }, form: { visible: true, colSpan: 2 } },
    editor: {
      type: 'file',
      accept: ['.xml'],
      placeholder: 'Seleccionar archivo CAF .xml',
      filenameKey: 'nombre_archivo',
      mimeTypeKey: 'mime_type',
      base64Key:   'archivo_caf',
    },
  },
  {
    key: 'fecha_vencimiento',
    header: 'Fecha Vencimiento',
    dataType: 'date',
    required: false,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: { type: 'date' },
    formatter: (value) => {
      if (!value) return 'Sin vencimiento';
      const parts = String(value).split('-');
      return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
    },
  },
  {
    key: 'activo',
    header: 'Estado',
    dataType: 'boolean',
    defaultValue: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: { type: 'switch' },
    formatter: (value) => (
      <Badge color={value ? 'green' : 'gray'} variant="light">
        {value ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
];

// ============================================================================
// CONFIGURACIÓN DEL MANTENEDOR
// ============================================================================

const config: MantenedorConfig<FolioCaf> = {
  title: 'Folios CAF',
  idField: 'id',
  data:   { path: '/api/folios-caf', method: 'GET' },
  save:   { path: '/api/folios-caf', method: 'POST' },
  delete: { path: '/api/folios-caf', method: 'DELETE' },
  columns,
  combos: {
    empresas: { path: '/api/combos/empresas', method: 'GET' },
    tipos_dte: { path: '/api/combos/tipos-dte', method: 'GET' },
  },
  contextConfig: {
    field: 'id_empresa',
    comboKey: 'empresas',
    label: 'Empresa',
    placeholder: 'Seleccione empresa...',
  },
  crossFieldValidators: {
    folio_hasta: (value, allValues) => {
      if (
        value !== undefined &&
        value !== null &&
        allValues.folio_desde !== undefined &&
        allValues.folio_desde !== null
      ) {
        if (Number(value) < Number(allValues.folio_desde)) {
          return 'Folio Hasta debe ser mayor o igual a Folio Desde';
        }
      }
      return null;
    },
  },
};

// ============================================================================
// COMPONENTE
// ============================================================================

export default function FoliosCafMantenedorPage() {
  return (
    <Container size="xl">
      <Mantenedor<FolioCaf> config={config} />
    </Container>
  );
}
