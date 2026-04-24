// ============================================================================
// HEADER - BARRA SUPERIOR
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { Box, Group, Avatar, Menu, Text, UnstyledButton } from '@mantine/core';
import {
  IconLogout,
  IconUser,
  IconSettings,
  IconChevronDown,
} from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/styles/theme';

interface HeaderProps {
  /** Título de la página actual */
  title?: string;
}

/**
 * Header de la aplicación con información del usuario y acciones
 */
export function Header({ title }: HeaderProps) {
  const { data: session } = useSession();
  const { logout } = useAuth();

  // Guard contra hydration mismatch: la sesión difiere entre SSR y cliente
  // hasta que next-auth termina de rehidratar. Renderizar un placeholder
  // estable en el primer render sincroniza SSR ≡ cliente.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const userName  = mounted ? (session?.user?.name  ?? 'Usuario') : 'Usuario';
  const userEmail = mounted ?  session?.user?.email ?? ''         : '';
  const userImage = mounted ?  session?.user?.image                : undefined;
  const userInitial = userName.charAt(0).toUpperCase() || 'U';

  return (
    <Box
      style={{
        height: 60,
        borderBottom: `1px solid rgba(255, 255, 255, 0.08)`,
        backgroundColor: colors.headerBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
      }}
    >
      {title && (
        <Text size="lg" fw={600} style={{ color: colors.sidebarText }}>
          {title}
        </Text>
      )}

      <Box style={{ flex: 1 }} />

      {/* Usuario y menú */}
      <Menu shadow="md" width={220} position="bottom-end">
        <Menu.Target>
          <UnstyledButton
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.375rem 0.75rem',
              borderRadius: '0.5rem',
              transition: 'background-color 150ms ease',
            }}
            styles={{
              root: {
                '&:hover': {
                  backgroundColor: colors.sidebarHover,
                },
              },
            }}
          >
            <Group gap="sm">
              <Avatar
                radius="xl"
                size={32}
                color="blue"
                src={userImage}
              >
                {userInitial}
              </Avatar>

              <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Text size="sm" fw={600} style={{ lineHeight: 1.2, color: colors.sidebarText }}>
                  {userName}
                </Text>
                <Text size="xs" style={{ lineHeight: 1.2, color: colors.sidebarTextInactive }}>
                  {userEmail}
                </Text>
              </Box>

              <IconChevronDown size={14} style={{ color: colors.sidebarTextInactive }} />
            </Group>
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Cuenta</Menu.Label>

          <Menu.Item leftSection={<IconUser size={16} />}>
            Mi Perfil
          </Menu.Item>

          <Menu.Item leftSection={<IconSettings size={16} />}>
            Configuración
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            leftSection={<IconLogout size={16} />}
            color="red"
            onClick={logout}
          >
            Cerrar Sesión
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Box>
  );
}
