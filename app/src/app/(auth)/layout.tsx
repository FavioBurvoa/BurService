// ============================================================================
// LAYOUT - RUTAS AUTENTICADAS
// ============================================================================

import { AppShell } from '@/components/layout/AppShell';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout para todas las rutas autenticadas
 * Incluye el AppShell con Navbar y Header
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
