// ============================================================================
// COMPONENTE: PdfButton
// Botón genérico para descargar reportes PDF.
//
// Modos:
//   - default   → ActionIcon pequeño (para celdas de tabla, al lado del ojo)
//   - withLabel → Button con texto "PDF" (para headers de página)
// ============================================================================

'use client';

import { ActionIcon, Button, Tooltip } from '@mantine/core';
import { IconFileTypePdf } from '@tabler/icons-react';
import { usePdfDownload } from '@/hooks/usePdfDownload';

interface Props {
  /** Nombre del reporte — debe coincidir con una clave en la proxy route */
  reportName: string;
  /** Parámetros que se envían como query string a /api/reportes/[nombre] */
  params: Record<string, string>;
  /** Nombre del archivo descargado */
  filename?: string;
  /** Muestra botón con texto "PDF" en lugar de solo ícono */
  withLabel?: boolean;
  disabled?: boolean;
}

export function PdfButton({
  reportName,
  params,
  filename = 'reporte.pdf',
  withLabel = false,
  disabled = false,
}: Props) {
  const { download, isLoading } = usePdfDownload();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    download(reportName, params, filename);
  };

  if (withLabel) {
    return (
      <Button
        variant="light"
        color="red"
        size="sm"
        leftSection={<IconFileTypePdf size={14} />}
        loading={isLoading}
        disabled={disabled}
        onClick={handleClick}
      >
        PDF
      </Button>
    );
  }

  return (
    <Tooltip label="Descargar PDF" position="left">
      <ActionIcon
        variant="subtle"
        color="red"
        size="sm"
        loading={isLoading}
        disabled={disabled}
        onClick={handleClick}
      >
        <IconFileTypePdf size={14} />
      </ActionIcon>
    </Tooltip>
  );
}
