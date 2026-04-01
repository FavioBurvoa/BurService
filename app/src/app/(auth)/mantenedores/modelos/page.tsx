// ============================================================================
// PÁGINA: MANTENEDOR DE MODELOS
// ============================================================================

'use client';

import { Container, Badge } from '@mantine/core';
import { Mantenedor } from '@/components/mantenedor/Mantenedor';
import type { MantenedorConfig, ColumnConfig } from '@/components/mantenedor/types';
import { colors } from '@/styles/theme';

// ============================================================================
// TIPOS
// ============================================================================

interface Modelo {
  id: number;
  codigo: string;
  descripcion: string;
  id_marca: number;
  activo: boolean;
}

// ============================================================================
// CONFIGURACIÓN DE COLUMNAS
// ============================================================================

const columns: ColumnConfig<Modelo>[] = [
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
      placeholder: 'Ej: COR',
      validation: {
        pattern: /^[a-zA-Z0-9]+$/,
        patternMessage: 'Solo se permiten caracteres alfanuméricos',
        maxLength: 20,
      },
    },
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
      placeholder: 'Nombre del modelo',
      validation: {
        maxLength: 200,
      },
    },
  },
  {
    key: 'id_marca',
    header: 'Marca',
    dataType: 'enum',
    required: true,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 2 },
      search: { enabled: true },
    },
    editor: {
      type: 'select',
      optionsKey: 'marcas',
      placeholder: 'Seleccione una marca',
    },
  },
  {
    key: 'activo',
    header: 'Estado',
    dataType: 'boolean',
    defaultValue: true,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 2 },
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

const config: MantenedorConfig<Modelo> = {
  title: 'Modelos',
  idField: 'id',
  data: {
    path: '/api/modelos',
    method: 'GET',
  },
  save: {
    path: '/api/modelos',
    method: 'POST',
  },
  delete: {
    path: '/api/modelos',
    method: 'DELETE',
  },
  columns,
  combos: {
    marcas: {
      path: '/api/combos/marcas',
      method: 'GET',
    },
  },
};

// ============================================================================
// COMPONENTE
// ============================================================================

export default function ModelosPage() {
  return (
    <Container size="xl">
      <Mantenedor<Modelo> config={config} />
    </Container>
  );
}
