// ============================================================================
// PÁGINA: MANTENEDOR DE REGIONES
// ============================================================================

'use client';

import { Container, Badge, Text } from '@mantine/core';
import { Mantenedor } from '@/components/mantenedor/Mantenedor';
import type { MantenedorConfig, ColumnConfig } from '@/components/mantenedor/types';
import { colors } from '@/styles/theme';

// ============================================================================
// TIPOS
// ============================================================================

interface Region {
  id: number;
  codigo: string;
  descripcion: string;
  orden: number;
  codigo_sii: string | null;
  activo: boolean;
}

// ============================================================================
// CONFIGURACIÓN DE COLUMNAS
// ============================================================================

const columns: ColumnConfig<Region>[] = [
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
      placeholder: 'Ej: RM',
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
      placeholder: 'Nombre de la región',
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
      max: 99,
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

const config: MantenedorConfig<Region> = {
  title: 'Regiones',
  idField: 'id',
  data: {
    path: '/api/regiones',
    method: 'GET',
  },
  save: {
    path: '/api/regiones',
    method: 'POST',
  },
  delete: {
    path: '/api/regiones',
    method: 'DELETE',
  },
  columns,
};

// ============================================================================
// COMPONENTE
// ============================================================================

export default function RegionesMantenedorPage() {
  return (
    <Container size="xl">
      <Mantenedor<Region> config={config} />
    </Container>
  );
}
