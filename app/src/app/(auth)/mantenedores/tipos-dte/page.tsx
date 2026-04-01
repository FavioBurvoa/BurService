// ============================================================================
// PÁGINA: MANTENEDOR DE TIPOS DTE
// ============================================================================

'use client';

import { Container, Badge } from '@mantine/core';
import { Mantenedor } from '@/components/mantenedor/Mantenedor';
import type { MantenedorConfig, ColumnConfig } from '@/components/mantenedor/types';

// ============================================================================
// TIPOS
// ============================================================================

interface TipoDte {
  id: number;
  codigo: string;
  descripcion: string;
  sw_afecto: boolean;
  sw_exento: boolean;
  sw_electronico: boolean;
  activo: boolean;
}

// ============================================================================
// CONFIGURACIÓN DE COLUMNAS
// ============================================================================

const columns: ColumnConfig<TipoDte>[] = [
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
      placeholder: 'Ej: 33',
      validation: { maxLength: 10 },
    },
    formatter: (value) => (
      <Badge variant="outline" color="blue" size="sm">{value}</Badge>
    ),
  },
  {
    key: 'descripcion',
    header: 'Descripción',
    dataType: 'string',
    required: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'text',
      placeholder: 'Descripción del tipo DTE',
      validation: { maxLength: 200 },
    },
  },
  {
    key: 'sw_afecto',
    header: 'Afecto',
    dataType: 'boolean',
    defaultValue: false,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: { type: 'switch' },
    formatter: (value) => (
      <Badge color={value ? 'green' : 'gray'} variant="light" size="sm">
        {value ? 'Sí' : 'No'}
      </Badge>
    ),
  },
  {
    key: 'sw_exento',
    header: 'Exento',
    dataType: 'boolean',
    defaultValue: false,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: { type: 'switch' },
    formatter: (value) => (
      <Badge color={value ? 'green' : 'gray'} variant="light" size="sm">
        {value ? 'Sí' : 'No'}
      </Badge>
    ),
  },
  {
    key: 'sw_electronico',
    header: 'Electrónico',
    dataType: 'boolean',
    defaultValue: true,
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
      <Badge color={value ? 'green' : 'gray'} variant="light">
        {value ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
];

// ============================================================================
// CONFIGURACIÓN DEL MANTENEDOR
// ============================================================================

const config: MantenedorConfig<TipoDte> = {
  title: 'Tipos DTE',
  idField: 'id',
  data:   { path: '/api/tipos-dte', method: 'GET' },
  save:   { path: '/api/tipos-dte', method: 'POST' },
  delete: { path: '/api/tipos-dte', method: 'DELETE' },
  columns,
};

// ============================================================================
// COMPONENTE
// ============================================================================

export default function TiposDteMantenedorPage() {
  return (
    <Container size="xl">
      <Mantenedor<TipoDte> config={config} />
    </Container>
  );
}
