// ============================================================================
// PÁGINA: MANTENEDOR DE TIPOS CONTRIBUYENTE
// ============================================================================

'use client';

import { Container, Badge, Text } from '@mantine/core';
import { Mantenedor } from '@/components/mantenedor/Mantenedor';
import type { MantenedorConfig, ColumnConfig } from '@/components/mantenedor/types';
import { colors } from '@/styles/theme';

// ============================================================================
// TIPOS
// ============================================================================

interface TipoContribuyente {
  id: number;
  codigo: string;
  descripcion: string;
  sw_factura: boolean;
  activo: boolean;
}

// ============================================================================
// CONFIGURACIÓN DE COLUMNAS
// ============================================================================

const columns: ColumnConfig<TipoContribuyente>[] = [
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
      placeholder: 'Ej: EMP',
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
      placeholder: 'Nombre del tipo',
      validation: {
        maxLength: 200,
      },
    },
  },
  {
    key: 'sw_factura',
    header: 'Factura',
    dataType: 'boolean',
    defaultValue: false,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
    },
    editor: {
      type: 'switch',
    },
    formatter: (value) => (
      <Badge color={value ? 'blue' : 'gray'} variant="light">
        {value ? 'Sí' : 'No'}
      </Badge>
    ),
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

const config: MantenedorConfig<TipoContribuyente> = {
  title: 'Tipos Contribuyente',
  idField: 'id',
  data: {
    path: '/api/tipos-contribuyente',
    method: 'GET',
  },
  save: {
    path: '/api/tipos-contribuyente',
    method: 'POST',
  },
  delete: {
    path: '/api/tipos-contribuyente',
    method: 'DELETE',
  },
  columns,
};

// ============================================================================
// COMPONENTE
// ============================================================================

export default function TiposContribuyenteMantenedorPage() {
  return (
    <Container size="xl">
      <Mantenedor<TipoContribuyente> config={config} />
    </Container>
  );
}
