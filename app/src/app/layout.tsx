// ============================================================================
// ROOT LAYOUT - BUR-SERVICE
// Configuración de providers y estilos globales
// ============================================================================

import type { Metadata } from 'next';
import { ColorSchemeScript } from '@mantine/core';
import { DM_Sans, Outfit } from 'next/font/google';
import { Providers } from '@/components/layout/Providers';

// Estilos de Mantine
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './globals.css';

// Tipografía: DM Sans (cuerpo) + Outfit (encabezados)
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'BUR-SERVICE - Gestión de Taller Automotriz',
  description: 'Sistema profesional de gestión para taller automotriz',
};

/**
 * Root Layout con providers configurados
 * - next/font para tipografía optimizada (DM Sans + Outfit)
 * - ColorSchemeScript para soporte de dark mode (futuro)
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${dmSans.variable} ${outfit.variable}`}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
