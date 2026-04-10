// ============================================================================
// PRESUPUESTO FORM
// Vista transaccional de creación / edición de presupuestos.
// Encabezado sticky + layout dos columnas: form (izq.) + panel totales (der.)
// ============================================================================

'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import {
  Stack, Group, Paper, Text, Badge, Button, Select, TextInput, Textarea,
  Divider, Title, ActionIcon, Tooltip, Loader, Center,
  SimpleGrid, ThemeIcon, Modal, Grid, Box, SegmentedControl,
} from '@mantine/core';
import {
  IconSearch, IconDeviceFloppy, IconPlus, IconArrowLeft,
  IconCar, IconUser, IconBuilding, IconFileText, IconLayoutList,
  IconChevronDown, IconChevronUp,
} from '@tabler/icons-react';
import { PdfButton } from '@/components/ui/PdfButton';
import { useRouter } from 'next/navigation';
import { colors } from '@/styles/theme';
import { useTransaccion } from './useTransaccion';
import { EditableGrid, type EditableColumn } from './EditableGrid';
import { PanelSubtotales } from './PanelSubtotales';
import type { GrupoDetalle, DetalleLinea, ComboOption } from './types';
import { calcularTotal } from './types';

// ============================================================================
// TIPOS
// ============================================================================

interface ModeloComboLocal extends ComboOption {
  id_marca: number;
}

// ============================================================================
// HELPERS
// ============================================================================

const ESTADOS = [
  { value: 'BORRADOR',  label: 'Borrador'  },
  { value: 'ENVIADO',   label: 'Enviado'   },
  { value: 'FACTURADO', label: 'Facturado' },
  { value: 'ANULADO',   label: 'Anulado'   },
];

const ESTADO_COLORS: Record<string, string> = {
  BORRADOR:  'gray',
  ENVIADO:   'blue',
  FACTURADO: 'green',
  ANULADO:   'red',
};

function toSelectData(opts: ComboOption[]): { value: string; label: string }[] {
  return opts.map((o) => ({ value: String(o.valor), label: o.texto }));
}

/** Columnas del EditableGrid según el caso del grupo */
function buildGridColumns(grupo: GrupoDetalle): EditableColumn[] {
  const cols: EditableColumn[] = [
    { key: 'descripcion', header: 'Descripción', type: 'text', flex: true },
  ];
  if (grupo.ver_sw_exento) {
    cols.push({ key: 'sw_exento', header: 'Exento', type: 'switch', width: 70 });
  }
  if (grupo.ver_cantidad) {
    cols.push({ key: 'cantidad', header: 'Cant.', type: 'number', width: 80 });
  }
  if (grupo.ver_valor) {
    cols.push({ key: 'valor', header: 'Valor', type: 'currency', width: 130 });
  }
  if (grupo.ver_total) {
    cols.push({
      key: 'total',
      header: 'Total',
      type: 'currency',
      width: 130,
      editable: false,
      computed: (row) => calcularTotal(row.cantidad as number | null, row.valor as number | null),
    });
  }
  return cols;
}

/** Fila vacía nueva para un grupo */
function makeNewLinea(grupo: GrupoDetalle): DetalleLinea {
  return {
    _tempId: String(Math.random()),
    id_tipo_detalle: grupo.id,
    descripcion: '',
    sw_exento: false,
    cantidad: grupo.ver_cantidad ? 1 : null,
    valor: null,
    total: null,
  };
}

function rowsToLineas(rows: Record<string, any>[], grupo: GrupoDetalle): DetalleLinea[] {
  return rows.map((row) => ({
    ...row,
    total:
      grupo.caso === 1
        ? null
        : calcularTotal(row.cantidad as number | null, row.valor as number | null),
  } as DetalleLinea));
}

// ============================================================================
// SUB-COMPONENTES
// ============================================================================

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Paper withBorder p="sm" radius="md">
      <Stack gap="sm">
        <Group gap="xs">
          <ThemeIcon size="sm" variant="light" color="blue" radius="sm">
            {icon}
          </ThemeIcon>
          <Text fw={600} size="sm" style={{ color: colors.textPrimary, letterSpacing: '0.02em' }}>
            {title}
          </Text>
        </Group>
        <Divider />
        {children}
      </Stack>
    </Paper>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface PresupuestoFormProps {
  presupuestoId?: number;
}

export function PresupuestoForm({ presupuestoId }: PresupuestoFormProps) {
  const router = useRouter();

  const {
    encabezado, grupos, totales,
    loading, saving, hasExento,
    setEncabezadoField, setVehiculoField, setClienteField, setContribuyenteField,
    setGrupoLineas, setSubtotalDirecto,
    lookupPatente, lookupRut,
    onTipoPresupuestoChange, save, reset,
  } = useTransaccion(presupuestoId);

  // Combos base
  const [empresas, setEmpresas] = useState<ComboOption[]>([]);
  const [tiposPresupuesto, setTiposPresupuesto] = useState<ComboOption[]>([]);

  // Combos vehículo / cliente
  const [marcasCombos, setMarcasCombos] = useState<ComboOption[]>([]);
  const [modelosCombos, setModelosCombos] = useState<ModeloComboLocal[]>([]);
  const [comunasCombos, setComunasCombos] = useState<ComboOption[]>([]);

  // Modal agregar marca/modelo
  const [marcaModeloModal, setMarcaModeloModal]   = useState(false);
  const [modalMarcaMode, setModalMarcaMode]       = useState<'existente' | 'nueva'>('nueva');
  const [modalMarcaId, setModalMarcaId]           = useState<string | null>(null);
  const [modalMarcaCodigo, setModalMarcaCodigo]   = useState('');
  const [modalMarcaDesc, setModalMarcaDesc]       = useState('');
  const [modalModeloCodigo, setModalModeloCodigo] = useState('');
  const [modalModeloDesc, setModalModeloDesc]     = useState('');
  const [savingMarcaModelo, setSavingMarcaModelo] = useState(false);

  // Bloqueo empresa/tipo cuando hay líneas
  const hasLines = grupos.some((g) => g.lineas.length > 0);

  // Colapso del card Cliente / Vehículo
  const [infoCollapsed, setInfoCollapsed] = useState(false);
  // Colapso de fechas/folio en Encabezado (minimizado por defecto)
  const [fechasCollapsed, setFechasCollapsed] = useState(true);

  // Carga inicial de combos
  useEffect(() => {
    fetch('/api/combos/empresas')
      .then((r) => r.json())
      .then((res) => { if (res.success) setEmpresas(res.data); });
    fetch('/api/combos/marcas')
      .then((r) => r.json())
      .then((res) => { if (res.success) setMarcasCombos(res.data); });
    fetch('/api/combos/modelos')
      .then((r) => r.json())
      .then((res) => { if (res.success) setModelosCombos(res.data); });
    fetch('/api/combos/comunas')
      .then((r) => r.json())
      .then((res) => { if (res.success) setComunasCombos(res.data); });
  }, []);

  // Recarga tipos cuando cambia la empresa
  useEffect(() => {
    if (encabezado.id_empresa === null) {
      setTiposPresupuesto([]);
      return;
    }
    fetch(`/api/combos/tipos-presupuesto?id_empresa=${encabezado.id_empresa}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setTiposPresupuesto(res.data); });
  }, [encabezado.id_empresa]);

  // Derived: datos para Select (IDs como value)
  const allMarcaData  = useMemo(() => marcasCombos.map((m) => ({ value: String(m.valor), label: m.texto })), [marcasCombos]);
  const allModeloData = useMemo(() => {
    if (encabezado.vehiculo.id_marca === null) return [];
    return modelosCombos
      .filter((m) => m.id_marca === encabezado.vehiculo.id_marca)
      .map((m) => ({ value: String(m.valor), label: m.texto }));
  }, [modelosCombos, encabezado.vehiculo.id_marca]);
  const allComunaData = useMemo(() => comunasCombos.map((c) => ({ value: String(c.valor), label: c.texto })), [comunasCombos]);

  // Labels para vista colapsada (no se almacenan strings, se derivan desde combos)
  const marcaLabel  = useMemo(() => marcasCombos.find((m) => m.valor === encabezado.vehiculo.id_marca)?.texto  ?? '', [marcasCombos,  encabezado.vehiculo.id_marca]);
  const modeloLabel = useMemo(() => modelosCombos.find((m) => m.valor === encabezado.vehiculo.id_modelo)?.texto ?? '', [modelosCombos, encabezado.vehiculo.id_modelo]);

  // ---- Handlers ----

  const handleEmpresaChange = useCallback(
    (v: string | null) => {
      const newId = v ? parseInt(v) : null;
      setEncabezadoField('id_empresa', newId);
      onTipoPresupuestoChange(null);
    },
    [setEncabezadoField, onTipoPresupuestoChange]
  );

  const handleMarcaChange = useCallback(
    (v: string | null) => {
      setVehiculoField('id_marca',  v ? parseInt(v) : null);
      setVehiculoField('id_modelo', null);
    },
    [setVehiculoField]
  );

  const openMarcaModeloModal = useCallback(() => {
    // Pre-seleccionar marca existente si ya hay una en el form
    if (encabezado.vehiculo.id_marca !== null) {
      setModalMarcaMode('existente');
      setModalMarcaId(String(encabezado.vehiculo.id_marca));
    } else {
      setModalMarcaMode('nueva');
      setModalMarcaId(null);
    }
    setModalMarcaCodigo('');
    setModalMarcaDesc('');
    setModalModeloCodigo('');
    setModalModeloDesc('');
    setMarcaModeloModal(true);
  }, [encabezado.vehiculo.id_marca]);

  const handleSaveMarcaModelo = useCallback(async () => {
    const modeloCodigo = modalModeloCodigo.trim();
    const modeloDesc   = modalModeloDesc.trim();
    if (!modeloCodigo || !modeloDesc) return;

    setSavingMarcaModelo(true);
    try {
      // 1. Resolver marca
      let idMarca: number;
      if (modalMarcaMode === 'existente') {
        if (!modalMarcaId) throw new Error('Selecciona una marca');
        idMarca = parseInt(modalMarcaId);
      } else {
        const marcaCodigo = modalMarcaCodigo.trim();
        const marcaDesc   = modalMarcaDesc.trim();
        if (!marcaCodigo || !marcaDesc) throw new Error('Ingresa código y nombre de la marca');
        const resM  = await fetch('/api/marcas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: marcaCodigo, descripcion: marcaDesc }),
        });
        const dataM = await resM.json();
        if (!dataM.success) throw new Error(dataM.message ?? 'Error al crear marca');
        idMarca = dataM.data.id;
        setMarcasCombos((prev) => [...prev, { valor: idMarca, texto: marcaDesc }]);
      }

      // 2. Crear modelo
      const resMod  = await fetch('/api/modelos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: modeloCodigo, descripcion: modeloDesc, id_marca: idMarca }),
      });
      const dataMod = await resMod.json();
      if (!dataMod.success) throw new Error(dataMod.message ?? 'Error al crear modelo');
      const idModelo: number = dataMod.data.id;
      setModelosCombos((prev) => [...prev, { valor: idModelo, texto: modeloDesc, id_marca: idMarca }]);

      // 3. Aplicar al form y cerrar
      setVehiculoField('id_marca',  idMarca);
      setVehiculoField('id_modelo', idModelo);
      setMarcaModeloModal(false);
      notifications.show({ title: 'Listo', message: 'Marca y modelo agregados correctamente', color: 'green' });
    } catch (e: any) {
      notifications.show({ title: 'Error', message: e.message ?? 'No se pudo agregar', color: 'red' });
    } finally {
      setSavingMarcaModelo(false);
    }
  }, [modalMarcaMode, modalMarcaId, modalMarcaCodigo, modalMarcaDesc, modalModeloCodigo, modalModeloDesc, setVehiculoField]);

  const handleSave = async () => {
    const result = await save();
    if (result.success) {
      if (result.id && !presupuestoId) {
        window.history.replaceState({}, '', `/presupuestos/${result.id}`);
      }
      setInfoCollapsed(true);
    }
  };

  const handleGrupoChange = useCallback(
    (grupo: GrupoDetalle, rows: Record<string, any>[]) => {
      setGrupoLineas(grupo.id, rowsToLineas(rows, grupo));
    },
    [setGrupoLineas]
  );

  // ---- Render ----

  if (loading) {
    return (
      <Center style={{ minHeight: 300 }}>
        <Stack align="center" gap="sm">
          <Loader size="md" />
          <Text size="sm" style={{ color: colors.textMuted }}>Cargando presupuesto...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap={0}>
      {/* ================================================================
          HEADER STICKY
          ================================================================ */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backgroundColor: colors.bgPrimary,
          borderBottom: `1px solid ${colors.border}`,
          padding: '10px 0 10px 0',
          marginBottom: 20,
        }}
      >
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Tooltip label="Volver a la lista" position="right">
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => router.push('/presupuestos/lista')}
              >
                <IconArrowLeft size={18} />
              </ActionIcon>
            </Tooltip>
            <Title order={4} style={{ color: colors.textPrimary }}>
              {encabezado.numero ? `Presupuesto #${encabezado.numero}` : 'Nuevo Presupuesto'}
            </Title>
            {encabezado.folio && (
              <Text size="sm" style={{ color: colors.textSecondary }}>
                {encabezado.folio}
              </Text>
            )}
            <Badge color={ESTADO_COLORS[encabezado.estado] ?? 'gray'} variant="light">
              {encabezado.estado}
            </Badge>
          </Group>

          <Group gap="sm">
            <Button
              variant="subtle"
              color="gray"
              size="sm"
              leftSection={<IconPlus size={14} />}
              onClick={() => { reset(); router.push('/presupuestos/nuevo'); }}
              disabled={saving}
            >
              Nuevo
            </Button>
            <Button
              size="sm"
              leftSection={<IconDeviceFloppy size={14} />}
              onClick={handleSave}
              loading={saving}
            >
              Guardar
            </Button>
            {presupuestoId && (
              <PdfButton
                reportName="presupuesto-documento"
                params={{ id: String(presupuestoId) }}
                filename={`presupuesto-${encabezado.numero ?? presupuestoId}.pdf`}
                withLabel
              />
            )}
          </Group>
        </Group>
      </div>

      {/* ================================================================
          LAYOUT PRINCIPAL: form (izq.) + panel totales (der.)
          ================================================================ */}
      <Grid gutter={{ base: 'sm', md: 20 }} align="flex-start">
        {/* ---- COLUMNA IZQUIERDA ---- */}
        <Grid.Col span={{ base: 12, md: 9 }}>
        <Stack gap="sm">

          {/* ENCABEZADO */}
          <SectionCard icon={<IconFileText size={14} />} title="Encabezado">
            {/* Fila siempre visible: Empresa · Tipo · Estado */}
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
              <Select
                label="Empresa"
                placeholder="Seleccione empresa..."
                data={toSelectData(empresas)}
                value={encabezado.id_empresa !== null ? String(encabezado.id_empresa) : null}
                onChange={handleEmpresaChange}
                searchable
                size="sm"
                disabled={hasLines}
              />
              <Select
                label="Tipo Presupuesto"
                placeholder={encabezado.id_empresa ? 'Seleccione tipo...' : 'Primero seleccione empresa'}
                data={toSelectData(tiposPresupuesto)}
                value={encabezado.id_tipo_presupuesto !== null ? String(encabezado.id_tipo_presupuesto) : null}
                onChange={(v) => onTipoPresupuestoChange(v ? parseInt(v) : null, encabezado.id_empresa)}
                disabled={!encabezado.id_empresa || hasLines}
                searchable
                size="sm"
              />
              <Select
                label="Estado"
                data={ESTADOS}
                value={encabezado.estado}
                onChange={(v) => setEncabezadoField('estado', v ?? 'BORRADOR')}
                size="sm"
              />
            </SimpleGrid>

            {/* Toggle fechas / folio */}
            <Group
              gap={4}
              style={{ cursor: 'pointer', width: 'fit-content' }}
              onClick={() => setFechasCollapsed((v) => !v)}
            >
              {fechasCollapsed ? <IconChevronDown size={13} color={colors.primary} /> : <IconChevronUp size={13} color={colors.primary} />}
              <Text size="xs" style={{ color: colors.primary, userSelect: 'none' }}>
                Fechas y folio
              </Text>
            </Group>

            {/* Fechas y folio — colapsables */}
            {!fechasCollapsed && (
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
                <TextInput
                  label="Folio"
                  placeholder="Ej: F-000123"
                  value={encabezado.folio ?? ''}
                  onChange={(e) => setEncabezadoField('folio', e.currentTarget.value)}
                  size="sm"
                />
                <TextInput
                  type="date"
                  label="Fecha Presupuesto"
                  value={encabezado.fecha_presupuesto}
                  onChange={(e) => setEncabezadoField('fecha_presupuesto', e.currentTarget.value)}
                  size="sm"
                />
                <TextInput
                  type="date"
                  label="Vencimiento"
                  value={encabezado.fecha_vencimiento ?? ''}
                  onChange={(e) => setEncabezadoField('fecha_vencimiento', e.currentTarget.value)}
                  size="sm"
                />
                <TextInput
                  type="date"
                  label="Fecha Recepción"
                  value={encabezado.fecha_recepcion ?? ''}
                  onChange={(e) => setEncabezadoField('fecha_recepcion', e.currentTarget.value)}
                  size="sm"
                />
                <TextInput
                  type="date"
                  label="Fecha Entrega"
                  value={encabezado.fecha_entrega ?? ''}
                  onChange={(e) => setEncabezadoField('fecha_entrega', e.currentTarget.value)}
                  size="sm"
                />
              </SimpleGrid>
            )}

            {/* TODO: habilitar switches cuando se defina flujo de facturación
            <Group gap="xl">
              <Switch
                label="Datos Facturación"
                checked={encabezado.sw_facturar}
                onChange={(e) => setEncabezadoField('sw_facturar', e.currentTarget.checked)}
              />
              {encabezado.sw_facturar && (
                <Switch
                  label="Datos del cliente"
                  description="Usar mismos datos del cliente como contribuyente"
                  checked={encabezado.sw_mismo_cliente}
                  onChange={(e) => setEncabezadoField('sw_mismo_cliente', e.currentTarget.checked)}
                />
              )}
            </Group>
            */}
          </SectionCard>

          {/* CLIENTE / VEHÍCULO — card combinada colapsable */}
          <Paper withBorder p="sm" radius="md">
            <Stack gap="sm">
              {/* Header — misma estructura que SectionCard */}
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <ThemeIcon size="sm" variant="light" color="blue" radius="sm">
                    <IconUser size={14} />
                  </ThemeIcon>
                  <ThemeIcon size="sm" variant="light" color="blue" radius="sm">
                    <IconCar size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="sm" style={{ color: colors.textPrimary, letterSpacing: '0.02em' }}>
                    Cliente / Vehículo
                  </Text>
                </Group>
                <Tooltip label={infoCollapsed ? 'Expandir' : 'Minimizar'} position="left">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    onClick={() => setInfoCollapsed((v) => !v)}
                  >
                    {infoCollapsed ? <IconChevronDown size={14} /> : <IconChevronUp size={14} />}
                  </ActionIcon>
                </Tooltip>
              </Group>
              <Divider />

              {infoCollapsed ? (
                /* ---- VISTA COLAPSADA ---- */
                <Stack gap={6}>
                  <Group gap="xs" wrap="nowrap" align="center">
                  <IconUser size={15} style={{ color: colors.primary, flexShrink: 0 }} />
                  {encabezado.cliente.nombre || encabezado.cliente.rut ? (
                    <Text size="sm" lineClamp={1}>
                      {encabezado.cliente.nombre && (
                        <span style={{ fontWeight: 600, color: colors.textPrimary }}>
                          {encabezado.cliente.nombre}
                        </span>
                      )}
                      {encabezado.cliente.rut && (
                        <span style={{ color: colors.textSecondary }}>
                          {encabezado.cliente.nombre ? '  ·  ' : ''}{encabezado.cliente.rut}
                        </span>
                      )}
                      {encabezado.cliente.telefono && (
                        <span style={{ color: colors.textSecondary }}>
                          {'  ·  '}{encabezado.cliente.telefono}
                        </span>
                      )}
                    </Text>
                  ) : (
                    <Text size="sm" style={{ color: colors.textMuted, fontStyle: 'italic' }}>Sin datos de cliente</Text>
                  )}
                </Group>
                <Group gap="xs" wrap="nowrap" align="center">
                  <IconCar size={15} style={{ color: colors.primary, flexShrink: 0 }} />
                  {encabezado.vehiculo.patente || marcaLabel ? (
                    <Text size="sm" lineClamp={1}>
                      {encabezado.vehiculo.patente && (
                        <span style={{ fontWeight: 600, color: colors.textPrimary, letterSpacing: '0.06em' }}>
                          {encabezado.vehiculo.patente}
                        </span>
                      )}
                      {(marcaLabel || modeloLabel || encabezado.vehiculo.anio) && (
                        <span style={{ color: colors.textSecondary }}>
                          {encabezado.vehiculo.patente ? '  ·  ' : ''}
                          {[marcaLabel, modeloLabel, encabezado.vehiculo.anio].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </Text>
                  ) : (
                    <Text size="sm" style={{ color: colors.textMuted, fontStyle: 'italic' }}>Sin datos de vehículo</Text>
                  )}
                </Group>
              </Stack>
            ) : (
              /* ---- VISTA EXPANDIDA ---- */
              <Stack gap="sm">
                {/* SUBSECCIÓN: CLIENTE */}
                <Text size="xs" fw={700} tt="uppercase" style={{ color: colors.textMuted, letterSpacing: '0.06em' }}>
                  Cliente
                </Text>

                <Group gap="xs" align="flex-end" wrap="wrap">
                  <TextInput
                    label="RUT"
                    placeholder="12.345.678-9"
                    value={encabezado.cliente.rut ?? ''}
                    onChange={(e) => setClienteField('rut', e.currentTarget.value)}
                    onBlur={() => lookupRut(encabezado.cliente.rut, 'cliente')}
                    style={{ flex: '0 0 140px' }}
                    size="sm"
                  />
                  <Tooltip label="Buscar historial por RUT">
                    <ActionIcon variant="light" color="blue" mb={1} onClick={() => lookupRut(encabezado.cliente.rut, 'cliente')}>
                      <IconSearch size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <TextInput
                    label="Nombre"
                    placeholder="Nombre completo"
                    value={encabezado.cliente.nombre ?? ''}
                    onChange={(e) => setClienteField('nombre', e.currentTarget.value)}
                    style={{ flex: 1 }}
                    size="sm"
                  />
                </Group>

                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                  <TextInput
                    label="Teléfono"
                    placeholder="+56 9 1234 5678"
                    value={encabezado.cliente.telefono ?? ''}
                    onChange={(e) => setClienteField('telefono', e.currentTarget.value)}
                    size="sm"
                  />
                  <TextInput
                    label="Email"
                    placeholder="correo@ejemplo.com"
                    value={encabezado.cliente.email ?? ''}
                    onChange={(e) => setClienteField('email', e.currentTarget.value)}
                    size="sm"
                  />
                  <Select
                    label="Comuna"
                    placeholder="Santiago"
                    data={allComunaData}
                    value={encabezado.cliente.id_comuna !== null ? String(encabezado.cliente.id_comuna) : null}
                    onChange={(v) => setClienteField('id_comuna', v ? parseInt(v) : null)}
                    searchable
                    clearable
                    size="sm"
                  />
                  <TextInput
                    label="Dirección"
                    placeholder="Av. Ejemplo 123"
                    value={encabezado.cliente.direccion ?? ''}
                    onChange={(e) => setClienteField('direccion', e.currentTarget.value)}
                    size="sm"
                  />
                </SimpleGrid>

                <Divider mt="xs" />

                {/* SUBSECCIÓN: VEHÍCULO */}
                <Text size="xs" fw={700} tt="uppercase" style={{ color: colors.textMuted, letterSpacing: '0.06em' }}>
                  Vehículo
                </Text>

                {/* DESKTOP: una sola fila */}
                <Box visibleFrom="md">
                  <Group gap="xs" align="flex-end" wrap="nowrap">
                    <TextInput
                      label="Patente"
                      placeholder="ABCD12"
                      value={encabezado.vehiculo.patente}
                      onChange={(e) => setVehiculoField('patente', e.currentTarget.value.toUpperCase())}
                      onBlur={() => lookupPatente(encabezado.vehiculo.patente)}
                      style={{ flex: '0 0 110px' }}
                      styles={{ input: { textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 } }}
                      size="sm"
                    />
                    <Tooltip label="Buscar historial por patente">
                      <ActionIcon variant="light" color="blue" mb={1} onClick={() => lookupPatente(encabezado.vehiculo.patente)}>
                        <IconSearch size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Select label="Marca" placeholder="Toyota" data={allMarcaData} value={encabezado.vehiculo.id_marca !== null ? String(encabezado.vehiculo.id_marca) : null} onChange={handleMarcaChange} searchable clearable size="sm" style={{ flex: 1 }} />
                    <Group gap={4} align="flex-end" style={{ flex: 1 }}>
                      <Select label="Modelo" placeholder={encabezado.vehiculo.id_marca ? 'Seleccione...' : '—'} data={allModeloData} value={encabezado.vehiculo.id_modelo !== null ? String(encabezado.vehiculo.id_modelo) : null} onChange={(v) => setVehiculoField('id_modelo', v ? parseInt(v) : null)} disabled={!encabezado.vehiculo.id_marca} searchable clearable size="sm" style={{ flex: 1 }} />
                      <Tooltip label="Agregar marca / modelo">
                        <ActionIcon variant="light" color="blue" size="sm" mb={1} onClick={openMarcaModeloModal}>
                          <IconPlus size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                    <TextInput label="Año" placeholder="2020" value={encabezado.vehiculo.anio !== null ? String(encabezado.vehiculo.anio) : ''} onChange={(e) => { const n = parseInt(e.currentTarget.value); setVehiculoField('anio', isNaN(n) ? null : n); }} inputMode="numeric" size="sm" style={{ flex: '0 0 72px' }} />
                    <TextInput label="Color" placeholder="Blanco" value={encabezado.vehiculo.color ?? ''} onChange={(e) => setVehiculoField('color', e.currentTarget.value)} size="sm" style={{ flex: '0 0 90px' }} />
                  </Group>
                </Box>

                {/* MÓVIL: patente + grid 2 cols */}
                <Box hiddenFrom="md">
                  <Stack gap="xs">
                    <Group gap="xs" align="flex-end">
                      <TextInput
                        label="Patente"
                        placeholder="ABCD12"
                        value={encabezado.vehiculo.patente}
                        onChange={(e) => setVehiculoField('patente', e.currentTarget.value.toUpperCase())}
                        onBlur={() => lookupPatente(encabezado.vehiculo.patente)}
                        style={{ flex: '0 0 110px' }}
                        styles={{ input: { textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 } }}
                        size="sm"
                      />
                      <Tooltip label="Buscar historial por patente">
                        <ActionIcon variant="light" color="blue" mb={1} onClick={() => lookupPatente(encabezado.vehiculo.patente)}>
                          <IconSearch size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                    <SimpleGrid cols={2} spacing="xs">
                      <Select label="Marca" placeholder="Toyota" data={allMarcaData} value={encabezado.vehiculo.id_marca !== null ? String(encabezado.vehiculo.id_marca) : null} onChange={handleMarcaChange} searchable clearable size="sm" />
                      <Group gap={4} align="flex-end">
                        <Select label="Modelo" placeholder={encabezado.vehiculo.id_marca ? 'Seleccione...' : '—'} data={allModeloData} value={encabezado.vehiculo.id_modelo !== null ? String(encabezado.vehiculo.id_modelo) : null} onChange={(v) => setVehiculoField('id_modelo', v ? parseInt(v) : null)} disabled={!encabezado.vehiculo.id_marca} searchable clearable size="sm" style={{ flex: 1 }} />
                        <Tooltip label="Agregar marca / modelo">
                          <ActionIcon variant="light" color="blue" size="sm" mb={1} onClick={openMarcaModeloModal}>
                            <IconPlus size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                      <TextInput label="Año" placeholder="2020" value={encabezado.vehiculo.anio !== null ? String(encabezado.vehiculo.anio) : ''} onChange={(e) => { const n = parseInt(e.currentTarget.value); setVehiculoField('anio', isNaN(n) ? null : n); }} inputMode="numeric" size="sm" />
                      <TextInput label="Color" placeholder="Blanco" value={encabezado.vehiculo.color ?? ''} onChange={(e) => setVehiculoField('color', e.currentTarget.value)} size="sm" />
                    </SimpleGrid>
                  </Stack>
                </Box>
              </Stack>
            )}
            </Stack>
          </Paper>

          {/* CONTRIBUYENTE (solo si sw_facturar y !sw_mismo_cliente) */}
          {encabezado.sw_facturar && !encabezado.sw_mismo_cliente && encabezado.contribuyente && (
            <SectionCard icon={<IconBuilding size={14} />} title="Contribuyente">
              <Group gap="sm" align="flex-end">
                <TextInput
                  label="RUT"
                  placeholder="76.543.210-K"
                  value={encabezado.contribuyente.rut ?? ''}
                  onChange={(e) => setContribuyenteField('rut', e.currentTarget.value)}
                  onBlur={() =>
                    encabezado.contribuyente &&
                    lookupRut(encabezado.contribuyente.rut, 'contribuyente')
                  }
                  style={{ flex: '0 0 160px' }}
                  size="sm"
                />
                <Tooltip label="Buscar historial por RUT">
                  <ActionIcon
                    variant="light"
                    color="blue"
                    mb={1}
                    onClick={() =>
                      encabezado.contribuyente &&
                      lookupRut(encabezado.contribuyente.rut, 'contribuyente')
                    }
                  >
                    <IconSearch size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
                <TextInput
                  label="Razón Social"
                  value={encabezado.contribuyente.nombre ?? ''}
                  onChange={(e) => setContribuyenteField('nombre', e.currentTarget.value)}
                  size="sm"
                />
                <TextInput
                  label="Teléfono"
                  value={encabezado.contribuyente.telefono ?? ''}
                  onChange={(e) => setContribuyenteField('telefono', e.currentTarget.value)}
                  size="sm"
                />
                <TextInput
                  label="Email"
                  value={encabezado.contribuyente.email ?? ''}
                  onChange={(e) => setContribuyenteField('email', e.currentTarget.value)}
                  size="sm"
                />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
                <TextInput
                  label="Giro"
                  value={encabezado.contribuyente.giro ?? ''}
                  onChange={(e) => setContribuyenteField('giro', e.currentTarget.value)}
                  size="sm"
                />
                <Select
                  label="Comuna"
                  data={allComunaData}
                  value={encabezado.contribuyente.id_comuna !== null ? String(encabezado.contribuyente.id_comuna) : null}
                  onChange={(v) => setContribuyenteField('id_comuna', v ? parseInt(v) : null)}
                  searchable
                  clearable
                  size="sm"
                />
                <TextInput
                  label="Dirección"
                  value={encabezado.contribuyente.direccion ?? ''}
                  onChange={(e) => setContribuyenteField('direccion', e.currentTarget.value)}
                  size="sm"
                />
              </SimpleGrid>
            </SectionCard>
          )}

          {/* SECCIONES DE DETALLE */}
          {grupos.length === 0 && (
            <Paper withBorder p="xl" radius="md">
              <Stack align="center" gap="xs">
                <IconLayoutList size={32} color={colors.textMuted} />
                <Text size="sm" style={{ color: colors.textMuted }}>
                  Seleccione una empresa y tipo de presupuesto para ingresar detalles
                </Text>
              </Stack>
            </Paper>
          )}

          {grupos.map((grupo) => (
            <Paper key={grupo.id} withBorder radius="md" style={{ overflow: 'hidden' }}>
              <div
                style={{
                  background: colors.tableHeader,
                  padding: '8px 16px',
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <Group justify="space-between">
                  <Group gap="xs">
                    <Text
                      size="xs"
                      fw={700}
                      style={{
                        color: colors.tableHeaderText,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {grupo.codigo}
                    </Text>
                    <Text size="xs" style={{ color: colors.tableHeaderText }}>
                      — {grupo.descripcion}
                    </Text>
                  </Group>
                  <Text size="xs" style={{ color: colors.textMuted }}>
                    máx. {grupo.cant_max_det} líneas
                  </Text>
                </Group>
              </div>

              <div style={{ padding: '8px 0 0 0' }}>
                <EditableGrid
                  columns={buildGridColumns(grupo)}
                  rows={grupo.lineas as Record<string, any>[]}
                  maxRows={grupo.cant_max_det}
                  onChange={(rows) => handleGrupoChange(grupo, rows)}
                  getNewRow={() => makeNewLinea(grupo)}
                  emptyMessage={`Sin líneas — presione + para agregar (${grupo.descripcion})`}
                />
              </div>
            </Paper>
          ))}
          {/* OBSERVACIÓN */}
          <SectionCard icon={<IconFileText size={14} />} title="Observación">
            <Textarea
              placeholder="Indicaciones adicionales para el cliente..."
              autosize
              minRows={3}
              maxRows={3}
              maxLength={500}
              size="sm"
              value={encabezado.observacion ?? ''}
              onChange={(e) => {
                const lines = e.currentTarget.value.split('\n');
                setEncabezadoField('observacion', lines.slice(0, 3).join('\n'));
              }}
            />
          </SectionCard>

        </Stack>
        </Grid.Col>

        {/* ---- COLUMNA DERECHA: PANEL TOTALES ---- */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <div style={{ position: 'sticky', top: 72 }}>
            <PanelSubtotales
              subtotales={totales.subtotales}
              neto={totales.neto}
              exento={totales.exento}
              iva={totales.iva}
              bruto={totales.bruto}
              porcentaje_iva={encabezado.porcentaje_iva}
              hasExento={hasExento}
              onSubtotalDirectoChange={setSubtotalDirecto}
              disabled={saving}
            />
          </div>
        </Grid.Col>
      </Grid>

      {/* ================================================================
          MODAL: Agregar Marca / Modelo
          ================================================================ */}
      <Modal
        opened={marcaModeloModal}
        onClose={() => setMarcaModeloModal(false)}
        title="Agregar Marca / Modelo"
        size="md"
      >
        <Stack gap="md">

          {/* ── Marca ── */}
          <Box>
            <Text size="sm" fw={600} mb={8} style={{ color: colors.textPrimary }}>Marca</Text>
            <SegmentedControl
              fullWidth
              size="sm"
              mb="sm"
              value={modalMarcaMode}
              onChange={(v) => {
                setModalMarcaMode(v as 'existente' | 'nueva');
                setModalMarcaId(null);
                setModalMarcaCodigo('');
                setModalMarcaDesc('');
              }}
              data={[
                { value: 'existente', label: 'Seleccionar existente' },
                { value: 'nueva',     label: 'Crear nueva'           },
              ]}
            />

            {modalMarcaMode === 'existente' ? (
              <Select
                placeholder="Buscar marca..."
                data={allMarcaData}
                value={modalMarcaId}
                onChange={setModalMarcaId}
                searchable
                size="sm"
              />
            ) : (
              <Group gap="sm" grow>
                <TextInput
                  label="Código"
                  placeholder="Ej: KIA"
                  value={modalMarcaCodigo}
                  onChange={(e) => setModalMarcaCodigo(e.currentTarget.value.toUpperCase())}
                  maxLength={10}
                  size="sm"
                  style={{ flex: '0 0 120px' }}
                />
                <TextInput
                  label="Nombre"
                  placeholder="Ej: Kia"
                  value={modalMarcaDesc}
                  onChange={(e) => setModalMarcaDesc(e.currentTarget.value)}
                  maxLength={200}
                  size="sm"
                />
              </Group>
            )}
          </Box>

          <Divider />

          {/* ── Modelo (siempre nuevo) ── */}
          <Box>
            <Text size="sm" fw={600} mb={8} style={{ color: colors.textPrimary }}>Modelo <Text span size="xs" style={{ color: colors.textMuted }}>(nuevo)</Text></Text>
            <Group gap="sm" grow>
              <TextInput
                label="Código"
                placeholder="Ej: SPORT"
                value={modalModeloCodigo}
                onChange={(e) => setModalModeloCodigo(e.currentTarget.value.toUpperCase())}
                maxLength={10}
                size="sm"
                style={{ flex: '0 0 120px' }}
              />
              <TextInput
                label="Nombre"
                placeholder="Ej: Sportage"
                value={modalModeloDesc}
                onChange={(e) => setModalModeloDesc(e.currentTarget.value)}
                maxLength={200}
                size="sm"
              />
            </Group>
          </Box>

          <Group justify="flex-end" gap="xs">
            <Button variant="subtle" color="gray" size="sm" onClick={() => setMarcaModeloModal(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              loading={savingMarcaModelo}
              disabled={
                !modalModeloCodigo.trim() || !modalModeloDesc.trim() ||
                (modalMarcaMode === 'existente' ? !modalMarcaId : !modalMarcaCodigo.trim() || !modalMarcaDesc.trim())
              }
              onClick={() => { void handleSaveMarcaModelo(); }}
            >
              Agregar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
