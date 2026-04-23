// ============================================================================
// PÁGINA: MANTENEDOR DE TIPOS DE VEHÍCULO
// ============================================================================

'use client';

import { Container, Badge } from '@mantine/core';
import { Mantenedor } from '@/components/mantenedor/Mantenedor';
import type { MantenedorConfig, ColumnConfig } from '@/components/mantenedor/types';
import { colors } from '@/styles/theme';

// ============================================================================
// TIPOS
// ============================================================================

interface TipoVehiculo {
  id: number;
  codigo: string;
  descripcion: string;
  activo: boolean;
}

// ============================================================================
// CONFIGURACIÓN DE COLUMNAS
// ============================================================================

const columns: ColumnConfig<TipoVehiculo>[] = [
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
      placeholder: 'Ej: SED',
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
      placeholder: 'Nombre del tipo de vehículo',
      validation: {
        maxLength: 200,
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

const config: MantenedorConfig<TipoVehiculo> = {
  title: 'Tipos de Vehículo',
  idField: 'id',
  data: {
    path: '/api/tipos-vehiculo',
    method: 'GET',
  },
  save: {
    path: '/api/tipos-vehiculo',
    method: 'POST',
  },
  delete: {
    path: '/api/tipos-vehiculo',
    method: 'DELETE',
  },
  columns,
  bulkOps: {
    export: true,
    import: true,
  },
};

// ============================================================================
// COMPONENTE
// ============================================================================

export default function TiposVehiculoPage() {
  return (
    <Container size="xl">
      <Mantenedor<TipoVehiculo> config={config} />
    </Container>
  );
}
