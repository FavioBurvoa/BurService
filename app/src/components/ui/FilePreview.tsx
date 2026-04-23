// ============================================================================
// FILE PREVIEW — Miniatura para archivos adjuntos (imagen / pdf / office / otros)
// ============================================================================

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Paper, Stack, Text, ThemeIcon, Image, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconFile,
  IconFileTypePdf,
  IconFileTypeXls,
  IconFileTypeDoc,
  IconFileTypeXml,
  IconCertificate,
  IconPhoto,
} from '@tabler/icons-react';
import { colors } from '@/styles/theme';

export interface FilePreviewProps {
  /** Archivo recién seleccionado (prevalece sobre base64). */
  file?: File | null;
  /** Contenido base64 del archivo guardado (sin prefijo `data:`). */
  base64?: string | null;
  /** MIME type del archivo guardado. */
  mimeType?: string | null;
  /** Nombre del archivo guardado. */
  filename?: string | null;
  /** Tamaño visual del preview. */
  size?: 'sm' | 'md' | 'lg';
}

type Kind = 'image' | 'pdf' | 'xls' | 'doc' | 'xml' | 'certificate' | 'other';

const SIZE_PX: Record<NonNullable<FilePreviewProps['size']>, number> = {
  sm:  64,
  md:  96,
  lg: 140,
};

const ICON_MAP: Record<Kind, typeof IconFile> = {
  image:       IconPhoto,
  pdf:         IconFileTypePdf,
  xls:         IconFileTypeXls,
  doc:         IconFileTypeDoc,
  xml:         IconFileTypeXml,
  certificate: IconCertificate,
  other:       IconFile,
};

const COLOR_MAP: Record<Kind, string> = {
  image:       colors.primary,
  pdf:         '#d93025',
  xls:         '#0f9d58',
  doc:         '#1a73e8',
  xml:         '#b06000',
  certificate: colors.primary,
  other:       '#6c757d',
};

function detectKind(mimeType?: string | null, filename?: string | null): Kind {
  const mt  = (mimeType ?? '').toLowerCase();
  const ext = (filename?.split('.').pop() ?? '').toLowerCase();

  if (mt.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext))
    return 'image';
  if (mt === 'application/pdf' || ext === 'pdf')
    return 'pdf';
  if (mt.includes('spreadsheet') || mt.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext))
    return 'xls';
  if (mt.includes('word') || ['doc', 'docx'].includes(ext))
    return 'doc';
  if (mt.includes('xml') || ext === 'xml')
    return 'xml';
  if (mt === 'application/x-pkcs12' || ['p12', 'pfx', 'cer', 'crt', 'pem'].includes(ext))
    return 'certificate';
  return 'other';
}

function formatBytes(bytes?: number): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePreview({ file, base64, mimeType, filename, size = 'md' }: FilePreviewProps) {
  const [zoomOpened, { open: openZoom, close: closeZoom }] = useDisclosure(false);
  const px = SIZE_PX[size];

  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const effMime = file?.type     ?? mimeType ?? null;
  const effName = file?.name     ?? filename ?? null;
  const effSize = file?.size;

  const previewUrl = useMemo(() => {
    if (objectUrl) return objectUrl;
    if (base64 && effMime) return `data:${effMime};base64,${base64}`;
    return null;
  }, [objectUrl, base64, effMime]);

  if (!effName && !previewUrl) return null;

  const kind        = detectKind(effMime, effName);
  const Icon        = ICON_MAP[kind];
  const canZoom     = kind === 'image' && !!previewUrl;

  return (
    <>
      <Paper
        withBorder
        p="sm"
        radius="md"
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '0.75rem',
          cursor:     canZoom ? 'zoom-in' : 'default',
        }}
        onClick={canZoom ? openZoom : undefined}
      >
        {kind === 'image' && previewUrl ? (
          <Image
            src={previewUrl}
            h={px}
            w={px}
            fit="contain"
            radius="sm"
            alt={effName ?? ''}
            style={{ flex: '0 0 auto', background: '#f4f4f4' }}
          />
        ) : (
          <ThemeIcon
            size={px}
            variant="light"
            color={COLOR_MAP[kind]}
            radius="md"
            style={{ flex: '0 0 auto' }}
          >
            <Icon size={Math.round(px * 0.55)} stroke={1.5} />
          </ThemeIcon>
        )}
        <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
          <Text size="sm" fw={600} truncate title={effName ?? ''}>
            {effName ?? '—'}
          </Text>
          {effMime && (
            <Text size="xs" c="dimmed" truncate title={effMime}>
              {effMime}
            </Text>
          )}
          {effSize != null && (
            <Text size="xs" c="dimmed">
              {formatBytes(effSize)}
            </Text>
          )}
          {canZoom && (
            <Text size="xs" c="dimmed" fs="italic">
              Click para ampliar
            </Text>
          )}
        </Stack>
      </Paper>

      {canZoom && (
        <Modal
          opened={zoomOpened}
          onClose={closeZoom}
          size="auto"
          centered
          withCloseButton
          title={effName}
        >
          <Image
            src={previewUrl!}
            fit="contain"
            alt={effName ?? ''}
            style={{ maxHeight: '80vh', maxWidth: '80vw' }}
          />
        </Modal>
      )}
    </>
  );
}
