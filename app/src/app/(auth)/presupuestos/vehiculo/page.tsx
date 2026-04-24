// ============================================================================
// PÁGINA: HOJA DE VIDA DEL VEHÍCULO
// Historial de presupuestos por patente.
// Filtros: empresa (obligatorio) + patente + rango de fechas.
// ============================================================================

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Container, Stack, Group, Title, Badge, Table, Text,
  Paper, Skeleton, Box, Select, TextInput, ActionIcon,
  Card, Button,
} from '@mantine/core';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { IconSearch, IconEye, IconX, IconCar, IconFilterOff } from '@tabler/icons-react';
import { PdfButton } from '@/components/ui/PdfButton';
import { colors } from '@/styles/theme';
import type { PresupuestoListItem } from '@/components/transaccion/types';
import type { ApiResponse, ComboOption } from '@/components/mantenedor/types';
import { clientFetch } from '@/lib/clientFetch';
import { useStickyFilters } from '@/hooks/useStickyFilters';

const VEHICULO_FILTER_KEYS = ['id_empresa', 'patente', 'fecha_desde', 'fecha_hasta'] as const;

// ============================================================================
// HELPERS
// ============================================================================

const ESTADO_COLORS: Record<string, string> = {
  BORRADOR:  'gray',
  ENVIADO:   'blue',
  FACTURADO: 'green',
  ANULADO:   'red',
};

function fmt(v: number): string {
  return Math.round(v).toLocaleString('es-CL');
}

function fmtFecha(s: string): string {
  return new Date(s + 'T00:00:00').toLocaleDateString('es-CL');
}

// Normaliza patente: mayúsculas, sin separadores
function normalizarPatente(v: string): string {
  return v.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// ============================================================================
// COMPONENTE
// ============================================================================

export default function HojaVidaVehiculoPage() {
  const router   = useRouter();
  const pathname = usePathname();
  const sp       = useSearchParams();
  const patenteInputRef = useRef<HTMLInputElement>(null);

  const idEmpresa  = sp.get('id_empresa')  ?? '';
  const patente    = sp.get('patente')     ?? '';
  const fechaDesde = sp.get('fecha_desde') ?? '';   // opcional — vacío = sin límite
  const fechaHasta = sp.get('fecha_hasta') ?? '';   // opcional — vacío = sin límite

  const { clearFilters } = useStickyFilters('presupuestos-vehiculo', VEHICULO_FILTER_KEYS);

  // Estado local del input de patente (antes de aplicar)
  const [patenteInput, setPatenteInput] = useState(patente);

  // Sincronizar el input con la patente del URL cuando cambia externamente
  // (hidratación de sticky filters, browser back/forward, etc.)
  useEffect(() => {
    setPatenteInput(patente);
  }, [patente]);

  const setParam = (key: string, value: string | null) => {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.push(`${pathname}?${p.toString()}`);
  };

  const aplicarPatente = () => {
    const norm = normalizarPatente(patenteInput.trim());
    setParam('patente', norm || null);
  };

  const limpiarPatente = () => {
    setPatenteInput('');
    setParam('patente', null);
    patenteInputRef.current?.focus();
  };

  // Combo empresas
  const { data: empresas } = useQuery<ComboOption[]>({
    queryKey: ['combo', 'empresas'],
    queryFn: async () => {
      const res = await clientFetch('/api/combos/empresas');
      const r: ApiResponse<ComboOption[]> = await res.json();
      return r.data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const empresaOptions = useMemo(
    () => (empresas ?? []).map((e) => ({ value: String(e.valor), label: e.texto })),
    [empresas]
  );

  // Historial del vehículo (requiere empresa + patente)
  const { data, isLoading, isFetching } = useQuery<PresupuestoListItem[]>({
    queryKey: ['presupuestos', 'vehiculo', { idEmpresa, patente, fechaDesde, fechaHasta }],
    queryFn: async () => {
      const params = new URLSearchParams({ id_empresa: idEmpresa, patente });
      if (fechaDesde) params.set('fecha_desde', fechaDesde);
      if (fechaHasta) params.set('fecha_hasta', fechaHasta);
      const res = await clientFetch(`/api/presupuestos?${params.toString()}`);
      const r: ApiResponse<PresupuestoListItem[]> = await res.json();
      if (!r.success) throw new Error(r.message);
      return r.data ?? [];
    },
    enabled: !!idEmpresa && !!patente,
    staleTime: 2 * 60 * 1000,
  });

  const items = data ?? [];

  // Info del vehículo derivada del primer resultado
  const vehiculoInfo = items[0] ?? null;

  // Total acumulado
  const totalBruto = useMemo(() => items.reduce((s, p) => s + p.bruto, 0), [items]);

  const thStyle = {
    color: colors.tableHeaderText,
    fontWeight: 600 as const,
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  };

  const puedeConsultar = !!idEmpresa && !!patenteInput.trim();

  return (
    <Container size="xl">
      <Stack gap="lg">

        {/* Header */}
        <Title order={3} style={{ color: colors.textPrimary }}>Hoja de Vida del Vehículo</Title>

        {/* Filtros */}
        <Paper withBorder p="md" radius="md">
          <Group gap="sm" wrap="wrap" align="flex-end">
            <Select
              label="Empresa"
              placeholder="Seleccionar empresa..."
              data={empresaOptions}
              value={idEmpresa || null}
              onChange={(v) => setParam('id_empresa', v)}
              style={{ width: 220 }}
              required
            />
            <TextInput
              ref={patenteInputRef}
              label="Patente"
              placeholder="Ej: ABCD12"
              value={patenteInput}
              onChange={(e) => setPatenteInput(e.currentTarget.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter') aplicarPatente(); }}
              rightSection={
                patenteInput ? (
                  <ActionIcon variant="subtle" size="sm" onClick={limpiarPatente}>
                    <IconX size={14} />
                  </ActionIcon>
                ) : null
              }
              style={{ width: 140 }}
              maxLength={8}
            />
            <TextInput
              type="date"
              label="Desde"
              value={fechaDesde}
              onChange={(e) => setParam('fecha_desde', e.currentTarget.value)}
              style={{ width: 160 }}
            />
            <TextInput
              type="date"
              label="Hasta"
              value={fechaHasta}
              onChange={(e) => setParam('fecha_hasta', e.currentTarget.value)}
              style={{ width: 160 }}
            />
            <Button
              leftSection={<IconSearch size={15} />}
              onClick={aplicarPatente}
              disabled={!puedeConsultar}
              style={{ marginBottom: 1 }}
            >
              Buscar
            </Button>
            <Button
              variant="default"
              leftSection={<IconFilterOff size={15} />}
              onClick={() => { setPatenteInput(''); clearFilters(); }}
              style={{ marginBottom: 1 }}
            >
              Limpiar
            </Button>
          </Group>
        </Paper>

        {/* Estado inicial */}
        {!idEmpresa && (
          <Paper withBorder p="xl" radius="md">
            <Text ta="center" style={{ color: colors.textMuted }}>
              Selecciona una empresa para comenzar
            </Text>
          </Paper>
        )}

        {!!idEmpresa && !patente && (
          <Paper withBorder p="xl" radius="md">
            <Text ta="center" style={{ color: colors.textMuted }}>
              Ingresa una patente y presiona Buscar
            </Text>
          </Paper>
        )}

        {/* Ficha del vehículo */}
        {!!patente && !isLoading && vehiculoInfo && (
          <Card withBorder radius="md" p="md">
            <Group gap="lg">
              <Box>
                <IconCar size={36} style={{ color: colors.primary }} />
              </Box>
              <Box style={{ flex: 1 }}>
                <Group gap="xs" align="baseline">
                  <Text size="xl" fw={800} style={{ letterSpacing: '0.08em', color: colors.textPrimary }}>
                    {patente}
                  </Text>
                  {vehiculoInfo.marca && (
                    <Text size="sm" style={{ color: colors.textSecondary }}>
                      {vehiculoInfo.marca} {vehiculoInfo.modelo}
                      {vehiculoInfo.anio ? ` · ${vehiculoInfo.anio}` : ''}
                      {vehiculoInfo.color ? ` · ${vehiculoInfo.color}` : ''}
                    </Text>
                  )}
                </Group>
                <Group gap="lg" mt={4}>
                  <Text size="xs" style={{ color: colors.textMuted }}>
                    {items.length} intervención{items.length !== 1 ? 'es' : ''} en el período
                  </Text>
                  <Text size="xs" fw={600} style={{ color: colors.primary }}>
                    Total acumulado: $ {fmt(totalBruto)}
                  </Text>
                </Group>
              </Box>
            </Group>
          </Card>
        )}

        {/* Sin resultados para esta patente */}
        {!!patente && !isLoading && items.length === 0 && (
          <Paper withBorder p="xl" radius="md">
            <Text ta="center" style={{ color: colors.textMuted }}>
              No se encontraron presupuestos para la patente <strong>{patente}</strong> en el período seleccionado
            </Text>
          </Paper>
        )}

        {/* Tabla historial */}
        {!!patente && (
          <Box style={{ position: 'relative' }}>
            <LoadingOverlay visible={isFetching && !isLoading} />

            {isLoading ? (
              <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      {['Fecha', 'N°', 'Estado', 'Cliente', 'Neto', 'Total', ''].map((h) => (
                        <Table.Th key={h}>{h}</Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Table.Tr key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <Table.Td key={j}><Skeleton height={14} radius="sm" /></Table.Td>
                        ))}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            ) : items.length > 0 ? (
              <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                <Table
                  highlightOnHover
                  styles={{
                    thead: { backgroundColor: colors.tableHeader },
                    th: thStyle,
                    td: { fontSize: '0.875rem', color: colors.tableText },
                  }}
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 100 }}>Fecha</Table.Th>
                      <Table.Th style={{ width: 70 }}>N°</Table.Th>
                      <Table.Th style={{ width: 110 }}>Estado</Table.Th>
                      <Table.Th>Cliente</Table.Th>
                      <Table.Th style={{ width: 130, textAlign: 'right' }}>Neto</Table.Th>
                      <Table.Th style={{ width: 130, textAlign: 'right' }}>Total</Table.Th>
                      <Table.Th style={{ width: 70 }} />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {items.map((p) => (
                      <Table.Tr
                        key={p.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/presupuestos/${p.id}`)}
                      >
                        <Table.Td>
                          <Text size="sm">{p.fecha_presupuesto ? fmtFecha(p.fecha_presupuesto) : '—'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600}>{p.numero ?? '—'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={ESTADO_COLORS[p.estado] ?? 'gray'} variant="light" size="sm">
                            {p.estado}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Stack gap={0}>
                            <Text size="sm">{p.cliente_nombre || '—'}</Text>
                            {p.cliente_rut && (
                              <Text size="xs" style={{ color: colors.textMuted }}>{p.cliente_rut}</Text>
                            )}
                          </Stack>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text size="sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            $ {fmt(p.neto)}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text size="sm" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
                            $ {fmt(p.bruto)}
                          </Text>
                        </Table.Td>
                        <Table.Td
                          style={{ textAlign: 'center' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Group gap={4} justify="center" wrap="nowrap">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              size="sm"
                              onClick={() => router.push(`/presupuestos/${p.id}`)}
                            >
                              <IconEye size={14} />
                            </ActionIcon>
                            <PdfButton
                              reportName="presupuesto-documento"
                              params={{ id: String(p.id) }}
                              filename={`presupuesto-${p.numero ?? p.id}.pdf`}
                            />
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            ) : null}
          </Box>
        )}

      </Stack>
    </Container>
  );
}
