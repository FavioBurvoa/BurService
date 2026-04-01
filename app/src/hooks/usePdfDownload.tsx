// ============================================================================
// HOOK: usePdfDownload
// Descarga genérica de reportes PDF/Excel desde /api/reportes/[nombre].
// Maneja estado de carga, descarga del blob y notificación de error.
// ============================================================================

'use client';

import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';

export function usePdfDownload() {
  const [isLoading, setIsLoading] = useState(false);

  async function download(
    reportName: string,
    params: Record<string, string>,
    filename: string,
  ): Promise<void> {
    setIsLoading(true);
    try {
      // Omitir params vacíos para no contaminar la URL
      const filtered = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v != null),
      );
      const qs = new URLSearchParams(filtered).toString();
      const res = await fetch(`/api/reportes/${reportName}${qs ? `?${qs}` : ''}`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Error al generar reporte' }));
        throw new Error(err.message ?? 'Error al generar reporte');
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      notifications.show({
        title:   'Error al generar PDF',
        message: e instanceof Error ? e.message : 'Error desconocido',
        color:   'red',
        icon:    <IconX size={18} />,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return { download, isLoading };
}
