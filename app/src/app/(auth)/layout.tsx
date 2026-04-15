// ============================================================================
// LAYOUT - RUTAS AUTENTICADAS
// ============================================================================

import { AppShell } from '@/components/layout/AppShell';
import { SessionErrorGuard } from '@/components/layout/SessionErrorGuard';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout para todas las rutas autenticadas.
 * Incluye el AppShell con Navbar y Header, y el guard de errores de sesión.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AppShell>
      <SessionErrorGuard />
      {children}
    </AppShell>
  );
}
