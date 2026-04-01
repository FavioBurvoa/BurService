// ============================================================================
// LAYOUT - RUTAS PÚBLICAS
// ============================================================================

interface PublicLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout para rutas públicas (sin autenticación)
 * Sin Navbar ni Header
 */
export default function PublicLayout({ children }: PublicLayoutProps) {
  return <>{children}</>;
}
