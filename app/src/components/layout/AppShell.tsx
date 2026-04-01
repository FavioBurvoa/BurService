// ============================================================================
// APP SHELL - LAYOUT PRINCIPAL
// ============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppShell as MantineAppShell, Burger, Box } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Navbar } from './Navbar';
import { Header } from './Header';
import { colors } from '@/styles/theme';

interface AppShellProps {
  children: React.ReactNode;
  /** Título de la página actual */
  title?: string;
}

/**
 * Layout principal de la aplicación con AppShell de Mantine
 *
 * Características:
 * - Sidebar colapsable en desktop (240px / 60px)
 * - Drawer en mobile (<768px)
 * - Header con información del usuario
 * - Transiciones suaves al colapsar
 */
export function AppShell({ children, title }: AppShellProps) {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] =
    useDisclosure();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isMobile = useMediaQuery('(max-width: 768px)');

  // Cargar estado inicial del sidebar desde localStorage
  useEffect(() => {
    if (!isMobile) {
      const savedState = localStorage.getItem('sidebar-collapsed');
      if (savedState !== null) {
        setSidebarCollapsed(savedState === 'true');
      }
    }
  }, [isMobile]);

  const handleCollapseChange = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  }, []);

  const sidebarWidth = sidebarCollapsed ? 60 : 240;

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        width: { base: sidebarWidth },
        breakpoint: 'sm',
      }}
      padding={0}
      styles={{
        main: {
          backgroundColor: colors.bgSecondary,
          minHeight: 'calc(100vh - 60px)',
          transition: 'padding-left 200ms ease',
        },
      }}
    >
      {/* Header */}
      <MantineAppShell.Header>
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            paddingLeft: isMobile ? '1rem' : 0,
            gap: '0.75rem',
            backgroundColor: colors.headerBg,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {isMobile && (
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              size="sm"
              color={colors.sidebarText}
              aria-label="Abrir menú"
            />
          )}
          <Box style={{ flex: 1 }}>
            <Header title={title} />
          </Box>
        </Box>
      </MantineAppShell.Header>

      {/* Navbar */}
      {isMobile ? (
        <MantineAppShell.Navbar
          style={{
            display: mobileOpened ? 'block' : 'none',
          }}
        >
          <Navbar mobile onClose={closeMobile} />
        </MantineAppShell.Navbar>
      ) : (
        <MantineAppShell.Navbar>
          <Navbar onCollapseChange={handleCollapseChange} />
        </MantineAppShell.Navbar>
      )}

      {/* Contenido principal */}
      <MantineAppShell.Main>
        <Box
          style={{
            padding: isMobile ? '1rem' : '1.5rem',
          }}
        >
          {children}
        </Box>
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}
