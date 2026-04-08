// ============================================================================
// PÁGINA: MANTENEDOR DE LOGOS DE EMPRESA
// ============================================================================

'use client';

import { Container, Text } from '@mantine/core';
import { Mantenedor } from '@/components/mantenedor/Mantenedor';
import type { MantenedorConfig, ColumnConfig } from '@/components/mantenedor/types';
import { colors } from '@/styles/theme';

// ============================================================================
// TIPOS
// ============================================================================

interface EmpresaLogo {
  id:             number;
  id_empresa:     number;
  tipo:           string;
  nombre_archivo: string;
  mime_type:      string;
  archivo:        string;
}

// ============================================================================
// CONFIGURACIÓN DE COLUMNAS
// ============================================================================

const columns: ColumnConfig<EmpresaLogo>[] = [
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
    key: 'tipo',
    header: 'Tipo',
    dataType: 'string',
    defaultValue: 'presupuesto',
    usage: { grid: { visible: true }, form: { visible: true, editable: false, colSpan: 1 } },
    formatter: (value) => (
      <Text fw={600} style={{ color: colors.primary }}>{value}</Text>
    ),
  },
  // Campos backing del archivo — ocultos en form (los gestiona el tipo 'file')
  {
    key: 'nombre_archivo',
    header: 'Archivo',
    dataType: 'string',
    usage: { grid: { visible: true }, form: { visible: false } },
  },
  {
    key: 'mime_type',
    header: 'Tipo MIME',
    dataType: 'string',
    usage: { grid: { visible: false }, form: { visible: false } },
  },
  {
    key: 'archivo',
    header: 'Archivo',
    dataType: 'string',
    usage: { grid: { visible: false }, form: { visible: false } },
  },
  // Selector de archivo (tipo 'file') — solo visible en el modal
  {
    key: '_archivoLogo',
    header: 'Logo (.png / .jpg)',
    dataType: 'file',
    required: true,
    usage: { grid: { visible: false }, form: { visible: true, colSpan: 2 } },
    editor: {
      type:        'file',
      accept:      ['.png', '.jpg', '.jpeg'],
      placeholder: 'Seleccionar imagen (.png o .jpg)',
      filenameKey: 'nombre_archivo',
      mimeTypeKey: 'mime_type',
      base64Key:   'archivo',
    },
  },
];

// ============================================================================
// CONFIGURACIÓN DEL MANTENEDOR
// ============================================================================

const config: MantenedorConfig<EmpresaLogo> = {
  title:  'Logos de Empresa',
  idField: 'id',
  data:   { path: '/api/empresa-logo', method: 'GET' },
  save:   { path: '/api/empresa-logo', method: 'POST' },
  delete: { path: '/api/empresa-logo', method: 'DELETE' },
  columns,
  combos: {
    empresas: { path: '/api/combos/empresas', method: 'GET' },
  },
  contextConfig: {
    field:       'id_empresa',
    comboKey:    'empresas',
    label:       'Empresa',
    placeholder: 'Seleccione empresa...',
  },
};

// ============================================================================
// COMPONENTE
// ============================================================================

export default function EmpresaLogoMantenedorPage() {
  return (
    <Container size="xl">
      <Mantenedor<EmpresaLogo> config={config} />
    </Container>
  );
}
