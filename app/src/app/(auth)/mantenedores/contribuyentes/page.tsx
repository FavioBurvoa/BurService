// ============================================================================
// PÁGINA: MANTENEDOR DE CONTRIBUYENTES
// ============================================================================

'use client';

import { Container, Badge, Text } from '@mantine/core';
import { Mantenedor } from '@/components/mantenedor/Mantenedor';
import type { MantenedorConfig, ColumnConfig, ComboOption } from '@/components/mantenedor/types';
import { colors } from '@/styles/theme';

// ============================================================================
// TIPOS
// ============================================================================

interface Contribuyente {
  id: number;
  rut: string;
  nombre: string;
  apellidos: string;
  id_tipo_contribuyente: number[];
  giro: string | null;
  id_region: number;
  id_comuna: number | null;
  direccion: string | null;
  email: string | null;
  telefono: string | null;
  telefono2: string | null;
  activo: boolean;
}

// ============================================================================
// CONFIGURACIÓN DE COLUMNAS
// ============================================================================

const columns: ColumnConfig<Contribuyente>[] = [
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
    key: 'rut',
    header: 'RUT',
    dataType: 'string',
    required: true,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'rut',
      validation: {
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
    key: 'nombre',
    header: 'Nombre',
    dataType: 'string',
    required: true,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'text',
      placeholder: 'Nombre',
      validation: {
        maxLength: 300,
      },
    },
    formatter: (_value, row) => (
      <Text size="sm">{row.nombre} {row.apellidos}</Text>
    ),
  },
  {
    key: 'apellidos',
    header: 'Apellidos',
    dataType: 'string',
    required: true,
    usage: {
      grid: { visible: false },
      form: { visible: true, editable: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'text',
      placeholder: 'Apellidos',
      validation: {
        maxLength: 300,
      },
    },
  },
  {
    key: 'id_tipo_contribuyente',
    header: 'Tipo Contribuyente',
    dataType: 'enum',
    required: true,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'multiselect',
      optionsKey: 'tipos_contribuyente',
      placeholder: 'Seleccione tipo(s)',
    },
  },
  {
    key: 'giro',
    header: 'Giro',
    dataType: 'string',
    required: false, // Se maneja dinámicamente vía dynamicConfig
    usage: {
      grid: { visible: false },
      form: { visible: true, editable: true, colSpan: 2 },
      search: { enabled: true },
    },
    editor: {
      type: 'text',
      placeholder: 'Giro comercial',
      validation: {
        maxLength: 300,
      },
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
    key: 'id_comuna',
    header: 'Comuna',
    dataType: 'enum',
    required: false, // Se maneja dinámicamente vía dynamicConfig
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
      search: { enabled: true },
    },
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
    required: false, // Se maneja dinámicamente vía dynamicConfig
    usage: {
      grid: { visible: false },
      form: { visible: true, editable: true, colSpan: 2 },
      search: { enabled: true },
    },
    editor: {
      type: 'text',
      placeholder: 'Dirección',
      validation: {
        maxLength: 300,
      },
    },
  },
  {
    key: 'email',
    header: 'Email',
    dataType: 'string',
    required: false,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'text',
      placeholder: 'correo@ejemplo.com',
      validation: {
        maxLength: 300,
      },
    },
  },
  {
    key: 'telefono',
    header: 'Teléfono',
    dataType: 'string',
    required: false,
    usage: {
      grid: { visible: true },
      form: { visible: true, editable: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'text',
      placeholder: '+56912345678',
      validation: {
        maxLength: 20,
      },
    },
  },
  {
    key: 'telefono2',
    header: 'Teléfono 2',
    dataType: 'string',
    required: false,
    usage: {
      grid: { visible: false },
      form: { visible: true, editable: true, colSpan: 1 },
      search: { enabled: true },
    },
    editor: {
      type: 'text',
      placeholder: '+56912345678',
      validation: {
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

/**
 * Verifica si alguno de los tipos contribuyente seleccionados tiene swFactura = true
 */
function requiereFactura(
  formValues: Record<string, any>,
  combos: Record<string, ComboOption[]>
): boolean {
  const tiposSeleccionados: string[] = formValues.id_tipo_contribuyente || [];
  const tiposCombo = combos['tipos_contribuyente'] || [];

  return tiposSeleccionados.some((id) => {
    const tipo = tiposCombo.find((t) => String(t.valor) === String(id));
    return (tipo as any)?.sw_factura === true;
  });
}

const config: MantenedorConfig<Contribuyente> = {
  title: 'Contribuyentes',
  idField: 'id',
  data: {
    path: '/api/contribuyentes',
    method: 'GET',
  },
  save: {
    path: '/api/contribuyentes',
    method: 'POST',
  },
  delete: {
    path: '/api/contribuyentes',
    method: 'DELETE',
  },
  columns,
  combos: {
    tipos_contribuyente: {
      path: '/api/combos/tipos-contribuyente',
      method: 'GET',
    },
    regiones: {
      path: '/api/combos/regiones',
      method: 'GET',
    },
    comunas: {
      path: '/api/combos/comunas',
      method: 'GET',
    },
  },
  dynamicConfig: (formValues, combos) => {
    const factura = requiereFactura(formValues, combos);

    return {
      giro: { required: factura },
      id_comuna: { required: factura },
      direccion: { required: factura },
    };
  },
  bulkOps: {
    export: true,
    import: true,
  },
};

// ============================================================================
// COMPONENTE
// ============================================================================

export default function ContribuyentesMantenedorPage() {
  return (
    <Container size="xl">
      <Mantenedor<Contribuyente> config={config} />
    </Container>
  );
}
