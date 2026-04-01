// ============================================================================
// PANEL SUBTOTALES
// Panel sticky con resumen de totales del presupuesto
// Caso 1: label izq. + input der. en una sola línea (editable)
// Caso 2/3: label izq. + valor der. calculado (readonly)
// ============================================================================

'use client';

import { Paper, Stack, Group, Text, Divider } from '@mantine/core';
import type { SubtotalGrupoUI } from './types';
import { CurrencyInput } from './CurrencyInput';
import { colors } from '@/styles/theme';

function fmt(v: number): string {
  return Math.round(v).toLocaleString('es-CL');
}

function ValorRow({ label, valor }: { label: string; valor: number }) {
  return (
    <Group justify="space-between">
      <Text size="sm" style={{ color: colors.textSecondary }}>{label}</Text>
      <Text size="sm" fw={600} style={{ fontVariantNumeric: 'tabular-nums', color: colors.textPrimary }}>
        $ {fmt(valor)}
      </Text>
    </Group>
  );
}

interface PanelSubtotalesProps {
  subtotales: SubtotalGrupoUI[];
  neto: number;
  exento: number;
  iva: number;
  bruto: number;
  porcentaje_iva: number;
  hasExento: boolean;
  onSubtotalDirectoChange: (codigo_subtotal: string, valor: number) => void;
  disabled?: boolean;
}

export function PanelSubtotales({
  subtotales,
  neto,
  exento,
  iva,
  bruto,
  porcentaje_iva,
  hasExento,
  onSubtotalDirectoChange,
  disabled = false,
}: PanelSubtotalesProps) {
  return (
    <Paper
      p="md"
      withBorder
      style={{ background: colors.bgSecondary, position: 'sticky', top: 16 }}
    >
      <Stack gap="sm">
        <Text
          fw={700}
          size="xs"
          style={{ color: colors.tableHeaderText, letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          Resumen
        </Text>

        <Divider />

        {subtotales.map((st) => (
          <div key={st.codigo_subtotal}>
            {st.caso === 1 ? (
              // Caso 1: editable — label izquierda + input derecha en una sola línea
              <Group justify="space-between" align="center" gap="xs" wrap="nowrap">
                <Text
                  size="xs"
                  fw={600}
                  style={{
                    color: colors.textLabel,
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {st.nombre_subtotal}
                </Text>
                <div style={{ width: 120, flexShrink: 0 }}>
                  <CurrencyInput
                    value={st.valor || null}
                    onChange={(v) => onSubtotalDirectoChange(st.codigo_subtotal, v ?? 0)}
                    disabled={disabled}
                    size="xs"
                    placeholder="0"
                    styles={{ input: { textAlign: 'right' } }}
                  />
                </div>
              </Group>
            ) : (
              <ValorRow label={st.nombre_subtotal} valor={st.valor} />
            )}
          </div>
        ))}

        <Divider />

        {hasExento && <ValorRow label="Exento" valor={exento} />}
        <ValorRow label="Neto" valor={neto} />
        <ValorRow label={`IVA (${porcentaje_iva}%)`} valor={iva} />

        <Divider />

        <Group justify="space-between" align="baseline">
          <Text fw={700} size="md" style={{ color: colors.textPrimary }}>Total</Text>
          <Text fw={800} size="xl" style={{ color: colors.primary, fontVariantNumeric: 'tabular-nums' }}>
            $ {fmt(bruto)}
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}
