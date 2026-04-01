// ============================================================================
// PÁGINA: MANTENEDOR DE CERTIFICADOS DTE
// ============================================================================

'use client';

import { Container, Badge, Text } from '@mantine/core';
import { Mantenedor } from '@/components/mantenedor/Mantenedor';
import type { MantenedorConfig, ColumnConfig } from '@/components/mantenedor/types';
import { colors } from '@/styles/theme';

// ============================================================================
// TIPOS
// ============================================================================

interface CertificadoDte {
  id: number;
  id_empresa: number;
  descripcion: string;
  nombre_archivo: string;
  mime_type: string;
  certificado: string;
  password: string | null;
  fecha_vencimiento: string | null;
  activo: boolean;
}

// ============================================================================
// CONFIGURACIÓN DE COLUMNAS
// ============================================================================

const columns: ColumnConfig<CertificadoDte>[] = [
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
    key: 'descripcion',
    header: 'Descripción',
    dataType: 'string',
    required: true,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 2 } },
    editor: {
      type: 'text',
      placeholder: 'Descripción del certificado',
      validation: { maxLength: 300 },
    },
    formatter: (value) => (
      <Text fw={600} style={{ color: colors.primary }}>{value}</Text>
    ),
  },
  // Campos backing del archivo — ocultos (los gestiona el tipo 'file')
  {
    key: 'nombre_archivo',
    header: 'Nombre Archivo',
    dataType: 'string',
    usage: { grid: { visible: false }, form: { visible: false } },
  },
  {
    key: 'mime_type',
    header: 'Tipo MIME',
    dataType: 'string',
    usage: { grid: { visible: false }, form: { visible: false } },
  },
  {
    key: 'certificado',
    header: 'Certificado',
    dataType: 'string',
    usage: { grid: { visible: false }, form: { visible: false } },
  },
  // Selector de archivo (tipo 'file') — solo visible en el modal
  {
    key: '_archivoCert',
    header: 'Certificado Digital (.p12 / .pfx)',
    dataType: 'file',
    required: true,
    usage: { grid: { visible: false }, form: { visible: true, colSpan: 2 } },
    editor: {
      type: 'file',
      accept: ['.p12', '.pfx'],
      placeholder: 'Seleccionar certificado .p12 o .pfx',
      filenameKey: 'nombre_archivo',
      mimeTypeKey: 'mime_type',
      base64Key:   'certificado',
    },
  },
  {
    key: 'password',
    header: 'Contraseña del Certificado',
    dataType: 'string',
    required: false,
    usage: { grid: { visible: false }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: {
      type: 'password',
      placeholder: 'Contraseña del archivo .p12',
      validation: { maxLength: 300 },
    },
  },
  {
    key: 'fecha_vencimiento',
    header: 'Fecha Vencimiento',
    dataType: 'date',
    required: false,
    usage: { grid: { visible: true }, form: { visible: true, editable: true, colSpan: 1 } },
    editor: { type: 'date' },
    formatter: (value) => {
      if (!value) return '';
      const parts = String(value).split('-');
      return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
    },
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

const config: MantenedorConfig<CertificadoDte> = {
  title: 'Certificados DTE',
  idField: 'id',
  data:   { path: '/api/certificados-dte', method: 'GET' },
  save:   { path: '/api/certificados-dte', method: 'POST' },
  delete: { path: '/api/certificados-dte', method: 'DELETE' },
  columns,
  combos: {
    empresas: { path: '/api/combos/empresas', method: 'GET' },
  },
  contextConfig: {
    field: 'id_empresa',
    comboKey: 'empresas',
    label: 'Empresa',
    placeholder: 'Seleccione empresa...',
  },
};

// ============================================================================
// COMPONENTE
// ============================================================================

export default function CertificadosDteMantenedorPage() {
  return (
    <Container size="xl">
      <Mantenedor<CertificadoDte> config={config} />
    </Container>
  );
}
