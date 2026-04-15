// ============================================================================
// PÁGINA: MANTENEDOR DE VEHÍCULOS
// ============================================================================

'use client';

import { Container, Badge, Text } from '@mantine/core';
import { Mantenedor } from '@/components/mantenedor/Mantenedor';
import type { MantenedorConfig, ColumnConfig } from '@/components/mantenedor/types';
import { colors } from '@/styles/theme';

// ============================================================================
// TIPOS
// ============================================================================

interface Vehiculo {
  id: number;
  ppu: string;
  id_marca: number;
  id_modelo: number;
  anio: number | null;
  color: string;
  id_tipo_vehiculo: number | null;
  activo: boolean;
}

// ============================================================================
// CONFIGURACIÓN DE COLUMNAS
// ============================================================================

const columns: ColumnConfig<Vehiculo>[] = [
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
    key: 'ppu',
    header: 'PPU',
    dataType: 'string',
    required: true,
    usage: {
      grid: { visible: true },
      form: { visible: true, editableOnCreate: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'patente',
      validation: {
        maxLength: 10,
      },
    },
    formatter: (value) => (
      <Text fw={600} style={{ color: colors.primary }}>
        {value}
      </Text>
    ),
  },
  {
    key: 'id_marca',
    header: 'Marca',
    dataType: 'enum',
    required: true,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'select',
      optionsKey: 'marcas',
      placeholder: 'Seleccione marca',
    },
  },
  {
    key: 'id_modelo',
    header: 'Modelo',
    dataType: 'enum',
    required: true,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'select',
      optionsKey: 'modelos',
      dependsOn: ['id_marca'],
      placeholder: 'Seleccione modelo',
    },
  },
  {
    key: 'anio',
    header: 'Año',
    dataType: 'number',
    required: false,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'number',
      placeholder: 'Año',
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
  },
  {
    key: 'color',
    header: 'Color',
    dataType: 'string',
    required: true,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'text',
      placeholder: 'Color del vehículo',
      validation: {
        maxLength: 100,
      },
    },
  },
  {
    key: 'id_tipo_vehiculo',
    header: 'Tipo',
    dataType: 'enum',
    required: false,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'select',
      optionsKey: 'tipos_vehiculo',
      placeholder: 'Seleccione tipo',
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

const config: MantenedorConfig<Vehiculo> = {
  title: 'Vehículos',
  idField: 'id',
  data: {
    path: '/api/vehiculos',
    method: 'GET',
  },
  save: {
    path: '/api/vehiculos',
    method: 'POST',
  },
  delete: {
    path: '/api/vehiculos',
    method: 'DELETE',
  },
  columns,
  combos: {
    marcas: {
      path: '/api/combos/marcas',
      method: 'GET',
    },
    modelos: {
      path: '/api/combos/modelos',
      method: 'GET',
    },
    tipos_vehiculo: {
      path: '/api/combos/tipos-vehiculo',
      method: 'GET',
    },
  },
};

// ============================================================================
// COMPONENTE
// ============================================================================

export default function VehiculosMantenedorPage() {
  return (
    <Container size="xl">
      <Mantenedor<Vehiculo> config={config} />
    </Container>
  );
}
