// ============================================================================
// PÁGINA: DASHBOARD
// ============================================================================

'use client';

import {
  Container,
  Title,
  Text,
  Paper,
  Group,
  Stack,
  SimpleGrid,
} from '@mantine/core';
import {
  IconUsers,
  IconCar,
  IconFileText,
  IconReceipt,
} from '@tabler/icons-react';
import { colors } from '@/styles/theme';

// ============================================================================
// DATOS PLACEHOLDER
// ============================================================================

const stats = [
  { label: 'Contribuyentes', value: '124', icon: IconUsers, color: colors.primary },
  { label: 'Vehículos', value: '87', icon: IconCar, color: colors.success },
  { label: 'Presupuestos', value: '32', icon: IconFileText, color: colors.warning },
  { label: 'Facturas', value: '18', icon: IconReceipt, color: '#8b5cf6' },
];

// ============================================================================
// COMPONENTE
// ============================================================================

export default function DashboardPage() {
  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <Paper
          shadow="sm"
          p="xl"
          radius="lg"
          style={{
            backgroundColor: colors.bgPrimary,
            border: `1px solid ${colors.border}`,
          }}
        >
          <Group gap="sm" mb={4}>
            <div
              style={{
                width: 4,
                height: 28,
                borderRadius: 2,
                backgroundColor: colors.primary,
              }}
            />
            <Title
              order={2}
              style={{
                fontSize: '1.5rem',
                color: colors.textPrimary,
              }}
            >
              Dashboard
            </Title>
          </Group>
          <Text size="sm" style={{ color: colors.textSecondary, paddingLeft: 16 }}>
            Bienvenido a BUR-SERVICE
          </Text>
        </Paper>

        {/* Stats */}
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="lg">
          {stats.map((stat) => (
            <Paper
              key={stat.label}
              shadow="sm"
              p="lg"
              radius="lg"
              style={{
                backgroundColor: colors.bgPrimary,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text size="xs" fw={600} tt="uppercase" style={{ color: colors.textSecondary, letterSpacing: '0.05em' }}>
                    {stat.label}
                  </Text>
                  <Text size="1.75rem" fw={800} mt={4} style={{ color: colors.textPrimary }}>
                    {stat.value}
                  </Text>
                </div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: `${stat.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <stat.icon size={22} style={{ color: stat.color }} />
                </div>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>

        {/* Placeholder */}
        <Paper
          shadow="sm"
          p="xl"
          radius="lg"
          style={{
            backgroundColor: colors.bgPrimary,
            border: `1px solid ${colors.border}`,
            minHeight: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Stack align="center" gap="xs">
            <Text fw={500} size="sm" style={{ color: colors.textSecondary }}>
              Contenido del dashboard en desarrollo
            </Text>
            <Text size="xs" style={{ color: colors.textMuted }}>
              Aquí se mostrarán resúmenes, gráficos y tareas pendientes
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
