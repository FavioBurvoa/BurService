// ============================================================================
// PÁGINA: SEGUIMIENTO DE PRESUPUESTOS POR CLIENTE
// Agrupa los presupuestos del período por cliente para control de montos.
// Filtros server-side via URL params. Agrupamiento client-side.
// ============================================================================

'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import {
  Container, Stack, Group, Title, Badge, Table, Text,
  Paper, Skeleton, Box, Select, TextInput, ActionIcon,
  SimpleGrid, Card,
} from '@mantine/core';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { IconChevronRight, IconChevronDown, IconEye } from '@tabler/icons-react';
import { PdfButton } from '@/components/ui/PdfButton';
import { colors } from '@/styles/theme';
import type { PresupuestoListItem } from '@/components/transaccion/types';
import type { ApiResponse, ComboOption } from '@/components/mantenedor/types';

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

interface ClienteGroup {
  key: string;
  id_cliente: number | null;
  cliente_nombre: string;
  cliente_rut: string;
  count: number;
  neto: number;
  exento: number;
  bruto: number;
  presupuestos: PresupuestoListItem[];
}

// ============================================================================
// CONSTANTES Y HELPERS
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

function groupByCliente(items: PresupuestoListItem[]): ClienteGroup[] {
  const map = new Map<string, ClienteGroup>();
  for (const p of items) {
    const key = p.id_cliente != null ? String(p.id_cliente) : `_${p.cliente_nombre}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        id_cliente:     p.id_cliente,
        cliente_nombre: p.cliente_nombre || '(sin nombre)',
        cliente_rut:    p.cliente_rut    || '',
        count:   0,
        neto:    0,
        exento:  0,
        bruto:   0,
        presupuestos: [],
      });
    }
    const g = map.get(key)!;
    g.count++;
    g.neto   += p.neto;
    g.exento += p.exento;
    g.bruto  += p.bruto;
    g.presupuestos.push(p);
  }
  // Ordenar por bruto descendente
  return Array.from(map.values()).sort((a, b) => b.bruto - a.bruto);
}

// ============================================================================
// COMPONENTE
// ============================================================================

export default function SeguimientoPresupuestosPage() {
  const router   = useRouter();
  const pathname = usePathname();
  const sp       = useSearchParams();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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

  // Lista presupuestos
  const { data, isLoading, isFetching } = useQuery<PresupuestoListItem[]>({
    queryKey: ['presupuestos', 'seguimiento', { idEmpresa, estado, fechaDesde, fechaHasta }],
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

  const items   = data ?? [];
  const grupos  = useMemo(() => groupByCliente(items), [items]);

  // Totales generales
  const totales = useMemo(() => ({
    count: items.length,
    neto:  items.reduce((s, p) => s + p.neto,  0),
    bruto: items.reduce((s, p) => s + p.bruto, 0),
  }), [items]);

  const thStyle = {
    color: colors.tableHeaderText,
    fontWeight: 600 as const,
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  };

  return (
    <Container size="xl">
      <Stack gap="lg">

        {/* Header */}
        <Title order={3} style={{ color: colors.textPrimary }}>Seguimiento por Cliente</Title>

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

        {/* Sin empresa */}
        {!idEmpresa && (
          <Paper withBorder p="xl" radius="md">
            <Text ta="center" style={{ color: colors.textMuted }}>
              Selecciona una empresa para ver el seguimiento
            </Text>
          </Paper>
        )}

        {/* Tarjetas resumen */}
        {!!idEmpresa && !isLoading && items.length > 0 && (
          <SimpleGrid cols={3} spacing="md">
            <Card withBorder radius="md" p="md">
              <Text size="xs" style={{ color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Presupuestos
              </Text>
              <Text size="xl" fw={700} style={{ color: colors.textPrimary }}>{totales.count}</Text>
            </Card>
            <Card withBorder radius="md" p="md">
              <Text size="xs" style={{ color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Neto total
              </Text>
              <Text size="xl" fw={700} style={{ color: colors.textPrimary }}>$ {fmt(totales.neto)}</Text>
            </Card>
            <Card withBorder radius="md" p="md">
              <Text size="xs" style={{ color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total bruto
              </Text>
              <Text size="xl" fw={700} style={{ color: colors.primary }}>$ {fmt(totales.bruto)}</Text>
            </Card>
          </SimpleGrid>
        )}

        {/* Tabla agrupada */}
        {!!idEmpresa && (
          <Box style={{ position: 'relative' }}>
            <LoadingOverlay visible={isFetching && !isLoading} />

            {isLoading ? (
              <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      {['', 'Cliente', 'RUT', 'Presupuestos', 'Neto', 'Total'].map((h) => (
                        <Table.Th key={h}>{h}</Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Table.Tr key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <Table.Td key={j}><Skeleton height={14} radius="sm" /></Table.Td>
                        ))}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            ) : grupos.length === 0 ? (
              <Paper withBorder p="xl" radius="md">
                <Text ta="center" style={{ color: colors.textMuted }}>
                  No hay presupuestos en el período seleccionado
                </Text>
              </Paper>
            ) : (
              <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                <Table
                  styles={{
                    thead: { backgroundColor: colors.tableHeader },
                    th: thStyle,
                    td: { fontSize: '0.875rem', color: colors.tableText },
                  }}
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 36 }} />
                      <Table.Th>Cliente</Table.Th>
                      <Table.Th style={{ width: 130 }}>RUT</Table.Th>
                      <Table.Th style={{ width: 120, textAlign: 'center' }}>Presupuestos</Table.Th>
                      <Table.Th style={{ width: 140, textAlign: 'right' }}>Neto</Table.Th>
                      <Table.Th style={{ width: 140, textAlign: 'right' }}>Total bruto</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {grupos.map((g) => (
                      <React.Fragment key={g.key}>
                        {/* Fila grupo */}
                        <Table.Tr
                          style={{ cursor: 'pointer', backgroundColor: expanded.has(g.key) ? colors.primaryLight : undefined }}
                          onClick={() => toggleExpand(g.key)}
                        >
                          <Table.Td style={{ textAlign: 'center', paddingRight: 0 }}>
                            {expanded.has(g.key)
                              ? <IconChevronDown size={14} style={{ color: colors.primary }} />
                              : <IconChevronRight size={14} style={{ color: colors.textMuted }} />
                            }
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" fw={600}>{g.cliente_nombre}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" style={{ color: colors.textSecondary }}>{g.cliente_rut || '—'}</Text>
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'center' }}>
                            <Badge variant="light" color="blue" size="sm">{g.count}</Badge>
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>
                            <Text size="sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                              $ {fmt(g.neto)}
                            </Text>
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>
                            <Text size="sm" fw={600} style={{ fontVariantNumeric: 'tabular-nums', color: colors.primary }}>
                              $ {fmt(g.bruto)}
                            </Text>
                          </Table.Td>
                        </Table.Tr>

                        {/* Sub-tabla expandida */}
                        {expanded.has(g.key) && (
                          <Table.Tr>
                            <Table.Td
                              colSpan={6}
                              style={{ padding: 0, backgroundColor: colors.bgSecondary ?? '#f8f9fa' }}
                            >
                              <Box px="xl" py="xs">
                                <Table size="xs">
                                  <Table.Thead>
                                    <Table.Tr>
                                      <Table.Th style={{ ...thStyle, width: 70 }}>N°</Table.Th>
                                      <Table.Th style={{ ...thStyle, width: 100 }}>Fecha</Table.Th>
                                      <Table.Th style={{ ...thStyle, width: 110 }}>Estado</Table.Th>
                                      <Table.Th style={thStyle}>Patente</Table.Th>
                                      <Table.Th style={{ ...thStyle, textAlign: 'right', width: 130 }}>Total</Table.Th>
                                      <Table.Th style={{ width: 80 }} />
                                    </Table.Tr>
                                  </Table.Thead>
                                  <Table.Tbody>
                                    {g.presupuestos.map((p) => (
                                      <Table.Tr key={p.id}>
                                        <Table.Td>
                                          <Text size="xs" fw={600}>{p.numero ?? '—'}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                          <Text size="xs">{p.fecha_presupuesto ? fmtFecha(p.fecha_presupuesto) : '—'}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                          <Badge color={ESTADO_COLORS[p.estado] ?? 'gray'} variant="light" size="xs">
                                            {p.estado}
                                          </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                          <Text size="xs" fw={500} style={{ letterSpacing: '0.04em' }}>
                                            {p.patente || '—'}
                                          </Text>
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }}>
                                          <Text size="xs" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
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
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/presupuestos/${p.id}`);
                                              }}
                                            >
                                              <IconEye size={13} />
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
                              </Box>
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </React.Fragment>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Box>
        )}

        {/* Contador */}
        {!!idEmpresa && !isLoading && grupos.length > 0 && (
          <Text size="xs" style={{ color: colors.textMuted }}>
            {grupos.length} cliente{grupos.length !== 1 ? 's' : ''} · {totales.count} presupuesto{totales.count !== 1 ? 's' : ''}
          </Text>
        )}

      </Stack>
    </Container>
  );
}
