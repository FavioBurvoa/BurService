// ============================================================================
// PÁGINA: MANTENEDOR DE COMUNAS
// ============================================================================

'use client';

import { Container, Badge, Text } from '@mantine/core';
import { Mantenedor } from '@/components/mantenedor/Mantenedor';
import type { MantenedorConfig, ColumnConfig } from '@/components/mantenedor/types';
import { colors } from '@/styles/theme';

// ============================================================================
// TIPOS
// ============================================================================

interface Comuna {
  id: number;
  id_region: number;
  codigo: string;
  descripcion: string;
  orden: number;
  codigo_sii: string | null;
  activo: boolean;
}

// ============================================================================
// CONFIGURACIÓN DE COLUMNAS
// ============================================================================

const columns: ColumnConfig<Comuna>[] = [
  {
    key: 'id',
    header: 'ID',
    dataType: 'number',
    usage: {
      grid: { visible: false },
      form: { visible: false },
    },
  },
  {
    key: 'id_region',
    header: 'Región',
    dataType: 'enum',
    required: true,
    defaultValue: '7', // Región Metropolitana
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'select',
      optionsKey: 'regiones',
      placeholder: 'Seleccione región',
    },
  },
  {
    key: 'codigo',
    header: 'Código',
    dataType: 'string',
    required: true,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'text',
      placeholder: 'Ej: SCL',
      validation: {
        pattern: /^[a-zA-Z0-9]+$/,
        patternMessage: 'Solo se permiten caracteres alfanuméricos',
        maxLength: 20,
      },
    },
    formatter: (value) => (
      <Text fw={600} style={{ color: colors.primary }}>
        {value}
      </Text>
    ),
  },
  {
    key: 'descripcion',
    header: 'Descripción',
    dataType: 'string',
    required: true,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'text',
      placeholder: 'Nombre de la comuna',
      validation: {
        maxLength: 200,
      },
    },
  },
  {
    key: 'orden',
    header: 'Orden',
    dataType: 'number',
    required: true,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
    },
    editor: {
      type: 'number',
      placeholder: 'Orden',
      min: 1,
      max: 999,
    },
  },
  {
    key: 'codigo_sii',
    header: 'Código SII',
    dataType: 'string',
    required: false,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'text',
      placeholder: 'Código SII',
      validation: {
        pattern: /^[a-zA-Z0-9]*$/,
        patternMessage: 'Solo se permiten caracteres alfanuméricos',
        maxLength: 20,
      },
    },
  },
  {
    key: 'activo',
    header: 'Estado',
    dataType: 'boolean',
    defaultValue: true,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
    },
    editor: {
      type: 'switch',
    },
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

const config: MantenedorConfig<Comuna> = {
  title: 'Comunas',
  idField: 'id',
  data: {
    path: '/api/comunas',
    method: 'GET',
  },
  save: {
    path: '/api/comunas',
    method: 'POST',
  },
  delete: {
    path: '/api/comunas',
    method: 'DELETE',
  },
  columns,
  combos: {
    regiones: {
      path: '/api/combos/regiones',
      method: 'GET',
    },
  },
  bulkOps: {
    export: true,
    import: true,
  },
};

// ============================================================================
// COMPONENTE
// ============================================================================

export default function ComunasMantenedorPage() {
  return (
    <Container size="xl">
      <Mantenedor<Comuna> config={config} />
    </Container>
  );
}
