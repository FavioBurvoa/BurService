// ============================================================================
// PÁGINA: LISTA DE PRESUPUESTOS
// Filtros server-side (empresa, estado, fechas) via URL params.
// Búsqueda de texto client-side sobre los resultados.
// ============================================================================

'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Container, Stack, Group, Title, Button, Badge, Table, Text,
  TextInput, ActionIcon, Paper, Skeleton, Box, Select,
} from '@mantine/core';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { IconPlus, IconSearch, IconEye, IconX } from '@tabler/icons-react';
import { PdfButton } from '@/components/ui/PdfButton';
import { colors } from '@/styles/theme';
import type { PresupuestoListItem } from '@/components/transaccion/types';
import type { ApiResponse, ComboOption } from '@/components/mantenedor/types';

// ============================================================================
// CONSTANTES
// ============================================================================

const ESTADO_COLORS: Record<string, string> = {
  BORRADOR:  'gray',
  ENVIADO:   'blue',
  FACTURADO: 'green',
  ANULADO:   'red',
};

const ESTADO_OPTIONS = [
  { value: 'BORRADOR',  label: 'Borrador'  },
  { value: 'ENVIADO',   label: 'Enviado'   },
  { value: 'FACTURADO', label: 'Facturado' },
  { value: 'ANULADO',   label: 'Anulado'   },
];

function fmt(v: number): string {
  return Math.round(v).toLocaleString('es-CL');
}

function fmtFecha(s: string): string {
  return new Date(s + 'T00:00:00').toLocaleDateString('es-CL');
}

function defaultDesde(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().split('T')[0];
}

function defaultHasta(): string {
  return new Date().toISOString().split('T')[0];
}

// ============================================================================
// COMPONENTE
// ============================================================================

export default function ListaPresupuestosPage() {
  const router   = useRouter();
  const pathname = usePathname();
  const sp       = useSearchParams();
  const [search, setSearch] = useState('');

  // Valores de filtros desde URL (con defaults)
  const idEmpresa  = sp.get('id_empresa')  ?? '';
  const estado     = sp.get('estado')      ?? '';
  const fechaDesde = sp.get('fecha_desde') ?? defaultDesde();
  const fechaHasta = sp.get('fecha_hasta') ?? defaultHasta();

  const setParam = (key: string, value: string | null) => {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.push(`${pathname}?${p.toString()}`);
  };

  // Combo empresas
  const { data: empresas } = useQuery<ComboOption[]>({
    queryKey: ['combo', 'empresas'],
    queryFn: async () => {
      const res = await fetch('/api/combos/empresas');
      const r: ApiResponse<ComboOption[]> = await res.json();
      return r.data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const empresaOptions = useMemo(
    () => (empresas ?? []).map((e) => ({ value: String(e.valor), label: e.texto })),
    [empresas]
  );

  // Lista presupuestos (solo si hay empresa seleccionada)
  const { data, isLoading, isFetching } = useQuery<PresupuestoListItem[]>({
    queryKey: ['presupuestos', 'lista', { idEmpresa, estado, fechaDesde, fechaHasta }],
    queryFn: async () => {
      const params = new URLSearchParams({ id_empresa: idEmpresa, fecha_desde: fechaDesde, fecha_hasta: fechaHasta });
      if (estado) params.set('estado', estado);
      const res = await fetch(`/api/presupuestos?${params.toString()}`);
      const r: ApiResponse<PresupuestoListItem[]> = await res.json();
      if (!r.success) throw new Error(r.message);
      return r.data ?? [];
    },
    enabled: !!idEmpresa,
    staleTime: 2 * 60 * 1000,
  });

  const items = data ?? [];

  // Búsqueda client-side sobre resultados ya filtrados
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((p) =>
      String(p.numero ?? '').includes(q) ||
      (p.folio ?? '').toLowerCase().includes(q) ||
      (p.patente ?? '').toLowerCase().includes(q) ||
      (p.cliente_nombre ?? '').toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <Container size="xl">
      <Stack gap="lg">

        {/* Header */}
        <Group justify="space-between" align="center">
          <Title order={3} style={{ color: colors.textPrimary }}>Lista de Presupuestos</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => router.push('/presupuestos/nuevo')}
          >
            Nuevo Presupuesto
          </Button>
        </Group>

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
            <Select
              label="Estado"
              placeholder="Todos"
              data={ESTADO_OPTIONS}
              value={estado || null}
              onChange={(v) => setParam('estado', v)}
              style={{ width: 160 }}
              clearable
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
          </Group>
        </Paper>

        {/* Sin empresa seleccionada */}
        {!idEmpresa && (
          <Paper withBorder p="xl" radius="md">
            <Text ta="center" style={{ color: colors.textMuted }}>
              Selecciona una empresa para ver los presupuestos
            </Text>
          </Paper>
        )}

        {/* Buscador client-side (solo si hay datos) */}
        {!!idEmpresa && (
          <TextInput
            placeholder="Buscar por número, folio, patente, cliente..."
            leftSection={<IconSearch size={16} />}
            rightSection={
              search ? (
                <ActionIcon variant="subtle" size="sm" onClick={() => setSearch('')}>
                  <IconX size={14} />
                </ActionIcon>
              ) : null
            }
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ maxWidth: 420 }}
          />
        )}

        {/* Tabla */}
        {!!idEmpresa && (
          <Box style={{ position: 'relative' }}>
            <LoadingOverlay visible={isFetching && !isLoading} />

            {isLoading ? (
              <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      {['N°', 'Folio', 'Estado', 'Fecha', 'Patente', 'Cliente', 'Total', ''].map((h) => (
                        <Table.Th key={h}>{h}</Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Table.Tr key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <Table.Td key={j}><Skeleton height={14} radius="sm" /></Table.Td>
                        ))}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            ) : filtered.length === 0 ? (
              <Paper withBorder p="xl" radius="md">
                <Text ta="center" style={{ color: colors.textMuted }}>
                  {search ? 'No se encontraron resultados para la búsqueda' : 'No hay presupuestos en el período seleccionado'}
                </Text>
              </Paper>
            ) : (
              <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                <Table
                  highlightOnHover
                  styles={{
                    thead: { backgroundColor: colors.tableHeader },
                    th: {
                      color: colors.tableHeaderText,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    },
                    td: { fontSize: '0.875rem', color: colors.tableText },
                  }}
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 70 }}>N°</Table.Th>
                      <Table.Th style={{ width: 110 }}>Folio</Table.Th>
                      <Table.Th style={{ width: 110 }}>Estado</Table.Th>
                      <Table.Th style={{ width: 100 }}>Fecha</Table.Th>
                      <Table.Th style={{ width: 100 }}>Patente</Table.Th>
                      <Table.Th>Cliente</Table.Th>
                      <Table.Th style={{ width: 130, textAlign: 'right' }}>Total</Table.Th>
                      <Table.Th style={{ width: 70 }} />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filtered.map((p) => (
                      <Table.Tr
                        key={p.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/presupuestos/${p.id}`)}
                      >
                        <Table.Td>
                          <Text size="sm" fw={600}>{p.numero ?? '—'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" style={{ color: colors.textSecondary }}>{p.folio || '—'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={ESTADO_COLORS[p.estado] ?? 'gray'} variant="light" size="sm">
                            {p.estado}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{p.fecha_presupuesto ? fmtFecha(p.fecha_presupuesto) : '—'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600} style={{ letterSpacing: '0.05em' }}>
                            {p.patente || '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{p.cliente_nombre || '—'}</Text>
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
            )}
          </Box>
        )}

        {/* Contador */}
        {!!idEmpresa && !isLoading && (
          <Text size="xs" style={{ color: colors.textMuted }}>
            {filtered.length} de {items.length} presupuesto{items.length !== 1 ? 's' : ''}
            {search && ` — búsqueda: "${search}"`}
          </Text>
        )}

      </Stack>
    </Container>
  );
}
