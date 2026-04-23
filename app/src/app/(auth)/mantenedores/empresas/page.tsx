// ============================================================================
// PÁGINA: MANTENEDOR DE EMPRESAS
// ============================================================================

'use client';

import { Container, Badge } from '@mantine/core';
import { Mantenedor } from '@/components/mantenedor/Mantenedor';
import type { MantenedorConfig, ColumnConfig } from '@/components/mantenedor/types';

// ============================================================================
// TIPOS
// ============================================================================

interface Empresa {
  id: number;
  codigo: string;
  rut: string;
  razon_social: string;
  nombre_fantasia: string | null;
  giro: string | null;
  act_eco: string | null;
  id_region: number;
  id_comuna: number | null;
  direccion: string | null;
  direccion_referencia: string | null;
  email: string | null;
  telefono: string | null;
  numero_resolucion_sii: number | null;
  fecha_resolucion_sii: string | null;
  porcentaje_iva: number;
  ambiente: number;
  activo: boolean;
}

// ============================================================================
// CONFIGURACIÓN DE COLUMNAS
// ============================================================================

const columns: ColumnConfig<Empresa>[] = [
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
    usage: {
      grid: { visible: true },
      form: { visible: true, editableOnCreate: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'text',
      placeholder: 'Ej: EMP01',
      validation: {
        pattern: /^[a-zA-Z0-9]+$/,
        patternMessage: 'Solo se permiten caracteres alfanuméricos',
        maxLength: 20,
      },
    },
  },
  {
    key: 'rut',
    header: 'RUT',
    dataType: 'string',
    required: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'rut',
      validation: {
        pattern: /^\d{1,8}-[\dkK]$/,
        patternMessage: 'Formato RUT inválido (ej: 76123456-7)',
        maxLength: 20,
      },
    },
  },
  {
    key: 'razon_social',
    header: 'Razón Social',
    dataType: 'string',
    required: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 2 } },
    editor: {
      type: 'text',
      placeholder: 'Razón social de la empresa',
      validation: { maxLength: 300 },
    },
  },
  {
    key: 'nombre_fantasia',
    header: 'Nombre Fantasía',
    dataType: 'string',
    required: false,
    usage: { grid: { visible: false }, form: { visible: true, editable: true, colSpan: 2 } },
    editor: {
      type: 'text',
      placeholder: 'Nombre de fantasía',
      validation: { maxLength: 300 },
    },
  },
  {
    key: 'giro',
    header: 'Giro',
    dataType: 'string',
    required: false,
    usage: { grid: { visible: false }, form: { visible: true, editable: true, colSpan: 2 } },
    editor: {
      type: 'text',
      placeholder: 'Giro comercial',
      validation: { maxLength: 300 },
    },
  },
  {
    key: 'act_eco',
    header: 'Actividad Económica',
    dataType: 'string',
    required: false,
    usage: { grid: { visible: false }, form: { visible: true, editable: true, colSpan: 2 } },
    editor: {
      type: 'text',
      placeholder: 'Código actividad económica SII',
      validation: { maxLength: 50 },
    },
  },
  {
    key: 'ambiente',
    header: 'Ambiente',
    dataType: 'enum',
    required: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'select',
      optionsKey: 'ambiente',
      placeholder: 'Seleccione ambiente',
    },
    formatter: (value) => (
      <Badge
        color={value === 2 ? 'blue' : 'orange'}
        variant="light"
        size="sm"
      >
        {value === 2 ? 'Producción' : 'Certificación'}
      </Badge>
    ),
  },
  {
    key: 'id_region',
    header: 'Región',
    dataType: 'enum',
    required: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'select',
      optionsKey: 'regiones',
      placeholder: 'Seleccione región',
    },
  },
  {
    key: 'id_comuna',
    header: 'Comuna',
    dataType: 'enum',
    required: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'select',
      optionsKey: 'comunas',
      dependsOn: ['id_region'],
      placeholder: 'Seleccione comuna',
    },
  },
  {
    key: 'direccion',
    header: 'Dirección',
    dataType: 'string',
    required: false,
    usage: { grid: { visible: false }, form: { visible: true, editable: true, colSpan: 2 } },
    editor: {
      type: 'text',
      placeholder: 'Dirección completa',
      validation: { maxLength: 300 },
    },
  },
  {
    key: 'direccion_referencia',
    header: 'Referencia dirección',
    dataType: 'string',
    required: false,
    usage: { grid: { visible: false }, form: { visible: true, editable: true, colSpan: 2 } },
    editor: {
      type: 'text',
      placeholder: 'Ej: Local 3, Galería Central',
      validation: { maxLength: 300 },
    },
  },
  {
    key: 'email',
    header: 'Email',
    dataType: 'string',
    required: false,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'text',
      placeholder: 'contacto@empresa.cl',
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMessage: 'Formato de email inválido',
        maxLength: 300,
      },
    },
  },
  {
    key: 'telefono',
    header: 'Teléfono',
    dataType: 'string',
    required: false,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'text',
      placeholder: '+56222334455',
      validation: { maxLength: 20 },
    },
  },
  {
    key: 'numero_resolucion_sii',
    header: 'N° Resolución SII',
    dataType: 'number',
    required: false,
    usage: { grid: { visible: false }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'number',
      placeholder: 'Número resolución SII',
      min: 1,
    },
  },
  {
    key: 'fecha_resolucion_sii',
    header: 'Fecha Resolución SII',
    dataType: 'date',
    required: false,
    usage: { grid: { visible: false }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: { type: 'date' },
    formatter: (value) => {
      if (!value) return '';
      const parts = String(value).split('-');
      return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
    },
  },
  {
    key: 'porcentaje_iva',
    header: '% IVA',
    dataType: 'number',
    required: false,
    defaultValue: 19,
    usage: { grid: { visible: false }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'number',
      placeholder: '19',
      min: 0,
      max: 100,
    },
    formatter: (value) => value != null ? `${value}%` : '',
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

const config: MantenedorConfig<Empresa> = {
  title: 'Empresas',
  idField: 'id',
  data:   { path: '/api/empresas', method: 'GET' },
  save:   { path: '/api/empresas', method: 'POST' },
  delete: { path: '/api/empresas', method: 'DELETE' },
  columns,
  combos: {
    ambiente: { path: '/api/combos/ambiente', method: 'GET' },
    regiones: { path: '/api/combos/regiones', method: 'GET' },
    comunas:  { path: '/api/combos/comunas',  method: 'GET' },
  },
  bulkOps: {
    export: true,
    import: true,
  },
};

// ============================================================================
// COMPONENTE
// ============================================================================

export default function EmpresasMantenedorPage() {
  return (
    <Container size="xl">
      <Mantenedor<Empresa> config={config} />
    </Container>
  );
}
