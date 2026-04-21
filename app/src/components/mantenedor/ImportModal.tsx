// ============================================================================
// IMPORT MODAL — flujo de import bulk para mantenedores simples
//
// Estados:
//   'select'  → file picker + link plantilla
//   'preview' → tabla con filas resueltas, errores inline, switch para omitir
//   'commit'  → progreso del loop de saves (batches de 10)
//   'summary' → resumen final (creadas / actualizadas / error / omitidas)
// ============================================================================

'use client';

import { useState } from 'react';
import {
  Modal, Stack, Text, Group, Button, FileInput, Anchor, Table, Switch, Badge,
  Paper, Progress, Alert, ScrollArea, Divider, Loader,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconUpload, IconDownload, IconAlertCircle, IconCheck, IconFileSpreadsheet,
} from '@tabler/icons-react';
import { colors } from '@/styles/theme';
import { clientFetch } from '@/lib/clientFetch';
import type {
  ResolvedRow,
  ImportRowResult,
  ImportSummary,
} from '@/lib/importResult';
import type { ApiResponse, ColumnConfig } from './types';

type Phase = 'select' | 'preview' | 'commit' | 'summary';

interface ImportModalProps<T extends Record<string, any>> {
  opened:         boolean;
  onClose:        () => void;
  title:          string;
  basePath:       string;
  columns:        ColumnConfig<T>[];
  contextField?:  string;
  contextValue?:  string | null;
  idField:        string;
  onFinished:     () => void;
}

export function ImportModal<T extends Record<string, any>>({
  opened, onClose, title, basePath, columns, contextField, contextValue, idField, onFinished,
}: ImportModalProps<T>) {
  const [phase, setPhase]                   = useState<Phase>('select');
  const [file, setFile]                     = useState<File | null>(null);
  const [resolved, setResolved]             = useState<ResolvedRow[]>([]);
  const [skipped, setSkipped]               = useState<Set<number>>(new Set());
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [progress, setProgress]             = useState({ done: 0, total: 0 });
  const [summary, setSummary]               = useState<ImportSummary | null>(null);

  const exportPath     = `${basePath}/export`;
  const previewPath    = `${basePath}/import/preview`;
  const templateHref   = contextField && contextValue
    ? `${exportPath}?empty=true&${contextField}=${contextValue}`
    : `${exportPath}?empty=true`;

  function reset() {
    setPhase('select');
    setFile(null);
    setResolved([]);
    setSkipped(new Set());
    setProgress({ done: 0, total: 0 });
    setSummary(null);
    setLoadingPreview(false);
  }

  function close() {
    reset();
    onClose();
  }

  function finish() {
    reset();
    onClose();
    onFinished();
  }

  async function handleUpload() {
    if (!file) return;
    setLoadingPreview(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (contextField && contextValue) fd.append(contextField, contextValue);

      const res = await clientFetch(previewPath, { method: 'POST', body: fd });
      const json = await res.json() as ApiResponse<ResolvedRow[]>;

      if (!json.success) {
        notifications.show({
          title:   'Error al procesar archivo',
          message: json.message || 'No se pudo leer el archivo',
          color:   'red',
          icon:    <IconAlertCircle size={18} />,
        });
        setLoadingPreview(false);
        return;
      }

      setResolved(Array.isArray(json.data) ? json.data : []);
      setPhase('preview');
    } catch (err) {
      notifications.show({
        title:   'Error',
        message: err instanceof Error ? err.message : 'Error desconocido',
        color:   'red',
      });
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleCommit() {
    const toCommit = resolved.filter((r) => !skipped.has(r.fila) && !r.errors);
    if (toCommit.length === 0) {
      notifications.show({
        title:   'Nada para importar',
        message: 'No hay filas válidas seleccionadas',
        color:   'yellow',
      });
      return;
    }

    setPhase('commit');
    setProgress({ done: 0, total: toCommit.length });
    const started = Date.now();

    const detail: ImportRowResult[] = [];
    const batchSize = 10;

    for (let i = 0; i < toCommit.length; i += batchSize) {
      const batch = toCommit.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((row) =>
          clientFetch(basePath, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(row.data),
          }).then((r) => r.json() as Promise<ApiResponse<Record<string, unknown>>>)
        ),
      );

      batch.forEach((row, idx) => {
        const identificador = String(row.data.codigo ?? row.data.descripcion ?? row.data.rut ?? row.fila);
        const result = results[idx];

        if (result.status === 'rejected') {
          detail.push({
            fila: row.fila,
            status: 'error',
            action: row.action,
            identificador,
            mensaje: String(result.reason),
          });
          return;
        }

        const resp = result.value;
        if (!resp.success) {
          detail.push({
            fila: row.fila,
            status: 'error',
            action: row.action,
            identificador,
            mensaje: resp.message,
            campos: resp.errors,
          });
          return;
        }

        const returnedId = Number(
          (resp.data as Record<string, unknown> | null)?.[idField] ?? row.data.id ?? 0,
        );
        detail.push({
          fila:          row.fila,
          status:        row.action === 'update' ? 'actualizado' : 'creado',
          action:        row.action,
          identificador,
          id:            returnedId || undefined,
        });
      });

      setProgress({ done: Math.min(i + batchSize, toCommit.length), total: toCommit.length });
    }

    // Agregar omitidas al detalle
    resolved
      .filter((r) => skipped.has(r.fila) || r.errors)
      .forEach((r) => {
        const identificador = String(r.data.codigo ?? r.data.descripcion ?? r.data.rut ?? r.fila);
        if (skipped.has(r.fila) && !r.errors) {
          detail.push({
            fila: r.fila, status: 'omitido', action: r.action, identificador,
          });
        } else if (r.errors) {
          detail.push({
            fila: r.fila, status: 'error', action: r.action, identificador,
            mensaje: 'Errores de validación en el archivo',
            campos: r.errors,
          });
        }
      });

    detail.sort((a, b) => a.fila - b.fila);

    const result: ImportSummary = {
      totalFilas:   resolved.length,
      creadas:      detail.filter((d) => d.status === 'creado').length,
      actualizadas: detail.filter((d) => d.status === 'actualizado').length,
      conError:     detail.filter((d) => d.status === 'error').length,
      omitidas:     detail.filter((d) => d.status === 'omitido').length,
      duracionMs:   Date.now() - started,
      detalle:      detail,
    };

    setSummary(result);
    setPhase('summary');
  }

  const filasConError    = resolved.filter((r) => r.errors).length;
  const filasOmitibles   = resolved.filter((r) => skipped.has(r.fila)).length;
  const filasValidas     = resolved.filter((r) => !r.errors && !skipped.has(r.fila)).length;
  const hayErroresNoOmitidos = resolved.some((r) => r.errors && !skipped.has(r.fila));

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={`Importar ${title}`}
      size="xl"
      closeOnClickOutside={phase === 'select' || phase === 'summary'}
      closeOnEscape={phase === 'select' || phase === 'summary'}
    >
      {phase === 'select' && (
        <Stack gap="md">
          <Alert icon={<IconFileSpreadsheet size={18} />} color="blue" variant="light">
            <Text size="sm" mb="xs">
              Sube un archivo <strong>xlsx</strong> con los registros a importar. Si un código ya existe,
              la fila se actualiza; si no, se crea.
            </Text>
            <Anchor href={templateHref} download size="sm">
              <Group gap={4} style={{ display: 'inline-flex' }}>
                <IconDownload size={14} /> Descargar plantilla vacía
              </Group>
            </Anchor>
          </Alert>

          <FileInput
            label="Archivo"
            placeholder="Selecciona un archivo .xlsx"
            accept=".xlsx"
            value={file}
            onChange={setFile}
            leftSection={<IconUpload size={16} />}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" color="gray" onClick={close}>Cancelar</Button>
            <Button
              onClick={handleUpload}
              disabled={!file}
              loading={loadingPreview}
              leftSection={<IconUpload size={16} />}
            >
              Cargar
            </Button>
          </Group>
        </Stack>
      )}

      {phase === 'preview' && (
        <Stack gap="md">
          <Paper p="md" radius="md" withBorder>
            <Group gap="lg">
              <Badge color="blue" variant="light" size="lg">Total: {resolved.length}</Badge>
              <Badge color="green" variant="light" size="lg">Válidas: {filasValidas}</Badge>
              {filasConError > 0 && <Badge color="red" variant="light" size="lg">Con error: {filasConError}</Badge>}
              {filasOmitibles > 0 && <Badge color="gray" variant="light" size="lg">Omitidas: {filasOmitibles}</Badge>}
            </Group>
          </Paper>

          {hayErroresNoOmitidos && (
            <Alert icon={<IconAlertCircle size={18} />} color="red" variant="light">
              Hay filas con errores. Omítelas con el switch de la izquierda, o corrige el archivo y vuelve a cargarlo.
            </Alert>
          )}

          <ScrollArea h={360}>
            <Table striped withTableBorder stickyHeader>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 50 }}>Omitir</Table.Th>
                  <Table.Th style={{ width: 50 }}>#</Table.Th>
                  <Table.Th style={{ width: 90 }}>Acción</Table.Th>
                  {columns.filter((c) => c.usage?.form?.visible !== false && c.key !== idField).map((c) => (
                    <Table.Th key={String(c.key)}>{c.header}</Table.Th>
                  ))}
                  <Table.Th>Errores</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {resolved.map((r) => {
                  const omit   = skipped.has(r.fila);
                  const cellBg = r.errors ? '#ffe8e8' : omit ? '#f1f3f5' : undefined;
                  return (
                    <Table.Tr key={r.fila} style={{ backgroundColor: cellBg }}>
                      <Table.Td>
                        <Switch
                          size="xs"
                          checked={omit}
                          onChange={(e) => {
                            setSkipped((prev) => {
                              const next = new Set(prev);
                              if (e.currentTarget.checked) next.add(r.fila); else next.delete(r.fila);
                              return next;
                            });
                          }}
                        />
                      </Table.Td>
                      <Table.Td>{r.fila}</Table.Td>
                      <Table.Td>
                        <Badge size="xs" color={r.action === 'update' ? 'yellow' : 'green'} variant="light">
                          {r.action === 'update' ? 'Actualizar' : 'Crear'}
                        </Badge>
                      </Table.Td>
                      {columns.filter((c) => c.usage?.form?.visible !== false && c.key !== idField).map((c) => {
                        const v = r.data[c.key];
                        const str = v === null || v === undefined ? '' : typeof v === 'boolean' ? (v ? 'Sí' : 'No') : String(v);
                        return <Table.Td key={String(c.key)}>{str}</Table.Td>;
                      })}
                      <Table.Td>
                        {r.errors?.map((e, i) => (
                          <Badge key={i} color="red" variant="light" size="xs" style={{ marginRight: 4 }}>
                            {e.field ? `${e.field}: ${e.detail}` : e.detail}
                          </Badge>
                        ))}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>

          <Group justify="space-between">
            <Button variant="subtle" color="gray" onClick={() => { setPhase('select'); setResolved([]); setSkipped(new Set()); }}>
              Volver
            </Button>
            <Group gap="sm">
              <Button variant="subtle" color="gray" onClick={close}>Cancelar</Button>
              <Button
                onClick={handleCommit}
                disabled={filasValidas === 0 || hayErroresNoOmitidos}
                leftSection={<IconCheck size={16} />}
              >
                Importar {filasValidas} {filasValidas === 1 ? 'fila' : 'filas'}
              </Button>
            </Group>
          </Group>
        </Stack>
      )}

      {phase === 'commit' && (
        <Stack gap="md" align="center" py="xl">
          <Loader size="md" />
          <Text size="sm">Importando... {progress.done} / {progress.total}</Text>
          <Progress value={(progress.done / Math.max(progress.total, 1)) * 100} w="100%" />
        </Stack>
      )}

      {phase === 'summary' && summary && (
        <Stack gap="md">
          <Paper p="md" radius="md" withBorder style={{ backgroundColor: colors.bgPrimary }}>
            <Group gap="lg" wrap="wrap">
              <Badge color="blue"   variant="light" size="lg">Total: {summary.totalFilas}</Badge>
              <Badge color="green"  variant="light" size="lg">Creadas: {summary.creadas}</Badge>
              <Badge color="yellow" variant="light" size="lg">Actualizadas: {summary.actualizadas}</Badge>
              {summary.conError > 0 && <Badge color="red"  variant="light" size="lg">Con error: {summary.conError}</Badge>}
              {summary.omitidas > 0 && <Badge color="gray" variant="light" size="lg">Omitidas: {summary.omitidas}</Badge>}
              <Text size="xs" c="dimmed">{(summary.duracionMs / 1000).toFixed(1)}s</Text>
            </Group>
          </Paper>

          <Divider label="Detalle" />
          <ScrollArea h={300}>
            <Table striped withTableBorder stickyHeader>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 50 }}>#</Table.Th>
                  <Table.Th>Identificador</Table.Th>
                  <Table.Th style={{ width: 120 }}>Estado</Table.Th>
                  <Table.Th>Mensaje</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {summary.detalle.map((d) => (
                  <Table.Tr key={d.fila}>
                    <Table.Td>{d.fila}</Table.Td>
                    <Table.Td>{d.identificador}</Table.Td>
                    <Table.Td>
                      <Badge
                        size="xs"
                        variant="light"
                        color={
                          d.status === 'creado'      ? 'green'  :
                          d.status === 'actualizado' ? 'yellow' :
                          d.status === 'error'       ? 'red'    : 'gray'
                        }
                      >
                        {d.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {d.mensaje ?? ''}
                      {d.campos?.map((e, i) => (
                        <Badge key={i} color="red" variant="light" size="xs" style={{ marginLeft: 4 }}>
                          {e.field ? `${e.field}: ${e.detail}` : e.detail}
                        </Badge>
                      ))}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>

          <Group justify="flex-end">
            <Button onClick={finish}>Cerrar</Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
