// ============================================================================
// NAVBAR - SIDEBAR COLAPSABLE
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  NavLink,
  Stack,
  UnstyledButton,
  Text,
  ScrollArea,
  Menu,
  Tooltip,
} from '@mantine/core';
import {
  IconUsers,
  IconFileText,
  IconPackage,
  IconReceipt,
  IconCar,
  IconDatabase,
  IconBuilding,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { colors } from '@/styles/theme';
import menuConfig from '@/config/menu.json';
import type { MenuItem } from '@/types';

// Mapeo de nombres de iconos a componentes
const iconMap: Record<string, React.ComponentType<any>> = {
  IconUsers,
  IconFileText,
  IconPackage,
  IconReceipt,
  IconCar,
  IconDatabase,
  IconBuilding,
};

interface NavbarProps {
  mobile?: boolean;
  onClose?: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

/**
 * Sidebar colapsable con navegación del sistema
 */
export function Navbar({ mobile = false, onClose, onCollapseChange }: NavbarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!mobile) {
      const savedState = localStorage.getItem('sidebar-collapsed');
      if (savedState !== null) {
        const isCollapsed = savedState === 'true';
        setCollapsed(isCollapsed);
        onCollapseChange?.(isCollapsed);
      }
    }
  }, [mobile, onCollapseChange]);

  const toggleCollapsed = () => {
    if (!mobile) {
      const newState = !collapsed;
      setCollapsed(newState);
      localStorage.setItem('sidebar-collapsed', String(newState));
      onCollapseChange?.(newState);
    }
  };

  const isCollapsed = mobile ? false : collapsed;
  const sidebarWidth = isCollapsed ? 60 : 240;

  return (
    <Box
      style={{
        width: sidebarWidth,
        height: '100%',
        backgroundColor: colors.sidebarBg,
        transition: 'width 200ms ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Header con logo y toggle */}
      <Box
        style={{
          padding: isCollapsed ? '1rem 0.5rem' : '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: `1px solid ${colors.sidebarHover}`,
          minHeight: 56,
        }}
      >
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isCollapsed ? 0 : 10,
          }}
        >
          <img
            src="/logo.png"
            alt="Saga Ops"
            style={{
              width: 28,
              height: 28,
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 10px rgba(37,99,235,0.45))',
              flexShrink: 0,
            }}
          />
          {!isCollapsed && (
            <Text
              size="lg"
              fw={800}
              style={{
                color: colors.sidebarText,
                letterSpacing: '-0.025em',
                whiteSpace: 'nowrap',
              }}
            >
              Saga Ops
            </Text>
          )}
        </Box>

        {!mobile && (
          <Tooltip label={isCollapsed ? 'Expandir' : 'Colapsar'} position="right" withArrow>
            <UnstyledButton
              onClick={toggleCollapsed}
              style={{
                color: colors.sidebarTextInactive,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.375rem',
                borderRadius: '0.375rem',
                transition: 'all 150ms ease',
              }}
              styles={{
                root: {
                  '&:hover': {
                    backgroundColor: colors.sidebarHover,
                    color: colors.sidebarText,
                  },
                },
              }}
              aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              {isCollapsed ? (
                <IconChevronRight size={18} />
              ) : (
                <IconChevronLeft size={18} />
              )}
            </UnstyledButton>
          </Tooltip>
        )}
      </Box>

      {/* Navegación con scroll */}
      <ScrollArea style={{ flex: 1 }} type="scroll">
        <Stack gap={4} p={isCollapsed ? '0.5rem 0.25rem' : '0.75rem 0.5rem'}>
          {menuConfig.items.map((item) => (
            <NavbarItem
              key={item.id}
              item={item}
              collapsed={isCollapsed}
              pathname={pathname}
              onClose={onClose}
            />
          ))}
        </Stack>
      </ScrollArea>

      {/* Footer con versión */}
      <Box
        style={{
          padding: isCollapsed ? '0.75rem 0.5rem' : '0.75rem 1.25rem',
          borderTop: `1px solid ${colors.sidebarHover}`,
          textAlign: isCollapsed ? 'center' : 'left',
        }}
      >
        <Text
          size="xs"
          style={{
            color: colors.sidebarTextInactive,
            opacity: 0.7,
          }}
        >
          {isCollapsed ? 'v1' : 'v1.0.0'}
        </Text>
      </Box>
    </Box>
  );
}

/**
 * Item individual del menú con subitems
 */
function NavbarItem({
  item,
  collapsed,
  pathname,
  onClose,
}: {
  item: MenuItem;
  collapsed: boolean;
  pathname: string;
  onClose?: () => void;
}) {
  const [opened, setOpened] = useState(false);
  const Icon = iconMap[item.icon] || IconUsers;

  const hasActiveChild = item.children?.some((child) =>
    pathname.startsWith(child.href)
  );

  useEffect(() => {
    if (hasActiveChild && !collapsed) {
      setOpened(true);
    }
  }, [hasActiveChild, collapsed]);

  // En modo colapsado, mostrar menú popup
  if (collapsed) {
    return (
      <Menu
        trigger="hover"
        position="right-start"
        offset={8}
        withArrow
        arrowPosition="center"
        shadow="md"
      >
        <Menu.Target>
          <UnstyledButton
            style={{
              width: '100%',
              padding: '0.625rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: hasActiveChild
                ? colors.sidebarText
                : colors.sidebarTextInactive,
              backgroundColor: hasActiveChild
                ? colors.sidebarActive
                : 'transparent',
              transition: 'all 150ms ease',
            }}
            styles={{
              root: {
                '&:hover': {
                  backgroundColor: hasActiveChild
                    ? colors.sidebarActive
                    : colors.sidebarHover,
                  color: colors.sidebarText,
                },
              },
            }}
          >
            <Icon size={20} />
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown
          styles={{
            dropdown: {
              backgroundColor: colors.bgPrimary,
              border: `1px solid ${colors.border}`,
            },
          }}
        >
          <Menu.Label style={{ color: colors.textSecondary, fontWeight: 600 }}>
            {item.label}
          </Menu.Label>
          {item.children?.map((child) => {
            const isActive = pathname.startsWith(child.href);
            return (
              <Menu.Item
                key={child.href}
                component={Link}
                href={child.href}
                onClick={onClose}
                style={{
                  backgroundColor: isActive ? colors.primaryLight : undefined,
                  color: isActive ? colors.primary : colors.textPrimary,
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {child.label}
              </Menu.Item>
            );
          })}
        </Menu.Dropdown>
      </Menu>
    );
  }

  // Modo expandido
  return (
    <Box>
      <NavLink
        label={item.label}
        leftSection={<Icon size={20} />}
        opened={opened}
        onClick={() => setOpened(!opened)}
        active={hasActiveChild}
        variant="subtle"
        styles={{
          root: {
            borderRadius: '0.5rem',
            color: hasActiveChild
              ? colors.sidebarText
              : colors.sidebarTextInactive,
            backgroundColor: hasActiveChild
              ? colors.sidebarActive
              : 'transparent',
            '&:hover': {
              backgroundColor: hasActiveChild
                ? colors.sidebarActive
                : colors.sidebarHover,
              color: colors.sidebarText,
            },
          },
          label: {
            fontWeight: hasActiveChild ? 600 : 500,
            fontSize: '0.875rem',
          },
        }}
      >
        {item.children && (
          <Stack gap={2} mt={4}>
            {item.children.map((child) => {
              const isActive = pathname.startsWith(child.href);
              return (
                <NavLink
                  key={child.href}
                  component={Link}
                  href={child.href}
                  label={child.label}
                  onClick={onClose}
                  active={isActive}
                  variant="subtle"
                  styles={{
                    root: {
                      borderRadius: '0.375rem',
                      color: isActive
                        ? colors.sidebarText
                        : colors.sidebarTextInactive,
                      backgroundColor: isActive
                        ? colors.sidebarHover
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: colors.sidebarHover,
                        color: colors.sidebarText,
                      },
                    },
                    label: {
                      fontSize: '0.8125rem',
                      fontWeight: isActive ? 600 : 400,
                    },
                  }}
                />
              );
            })}
          </Stack>
        )}
      </NavLink>
    </Box>
  );
}
