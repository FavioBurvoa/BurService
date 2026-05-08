// ============================================================================
// LAYOUT - RUTAS AUTENTICADAS
// ============================================================================

import { AppShell } from '@/components/layout/AppShell';
import { SessionErrorGuard } from '@/components/layout/SessionErrorGuard';

// Todas las rutas (auth) son inherentemente dinámicas: dependen de sesión,
// URL search params (filtros) y datos vivos. Opt-out de static generation
// para evitar el error "useSearchParams() should be wrapped in a suspense
// boundary" durante next build.
export const dynamic = 'force-dynamic';

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
