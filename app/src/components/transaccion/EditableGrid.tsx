// ============================================================================
// EDITABLE GRID
// Grid tipo spreadsheet con edición inline y navegación por teclado
// Tab        → siguiente columna | Shift+Tab → columna anterior
// Enter      → siguiente fila   | ArrowDown  → fila siguiente (desde borde)
// ArrowUp    → fila anterior    (desde borde de texto)
// Esc        → cancelar edición
// ============================================================================

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Table, ActionIcon, Group, Text, Switch, Tooltip } from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { colors } from '@/styles/theme';
import { formatCLP, parseCLP } from '@/lib/formatters';

// ============================================================================
// TIPOS
// ============================================================================

export interface EditableColumn {
  key: string;
  header: string;
  type: 'text' | 'currency' | 'number' | 'switch' | 'readonly';
  width?: number | string;
  flex?: boolean;
  editable?: boolean;
  /** Calcula el valor de esta columna a partir de la fila (columnas calculadas) */
  computed?: (row: Record<string, any>) => any;
}

interface EditableGridProps {
  columns: EditableColumn[];
  rows: Record<string, any>[];
  maxRows?: number;
  onChange: (rows: Record<string, any>[]) => void;
  getNewRow: () => Record<string, any>;
  emptyMessage?: string;
  disabled?: boolean;
}

// ============================================================================
// HELPERS DE FORMATO
// ============================================================================

function formatDisplay(col: EditableColumn, value: any): string {
  if (value === null || value === undefined) return '';
  if (col.type === 'currency') return formatCLP(value);
  return String(value);
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function EditableGrid({
  columns,
  rows,
  maxRows,
  onChange,
  getNewRow,
  emptyMessage = 'Sin líneas — presione + para agregar',
  disabled = false,
}: EditableGridProps) {
  const [activeCell, setActiveCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
  const [draft, setDraft] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingFocusRef = useRef<{ rowIdx: number; colKey: string } | null>(null);

  const editableCols = columns.filter((c) => c.editable !== false && c.type !== 'readonly' && c.type !== 'switch');
  // Flag para evitar doble-commit cuando Tab/Enter ya procesó la navegación
  const isNavigatingRef = useRef(false);

  // Auto-focus input when active cell changes
  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [activeCell?.rowIdx, activeCell?.colKey]);

  const activateCell = useCallback((rowIdx: number, colKey: string, value: any) => {
    if (disabled) return;
    const col = columns.find((c) => c.key === colKey);
    if (!col || col.editable === false || col.type === 'readonly') return;
    setActiveCell({ rowIdx, colKey });
    // Show raw number for currency
    if (col.type === 'currency') {
      setDraft(value !== null && value !== undefined ? String(value) : '');
    } else {
      setDraft(value !== null && value !== undefined ? String(value) : '');
    }
  }, [columns, disabled]);

  // Focus pending cell after row addition (state async)
  useEffect(() => {
    if (pendingFocusRef.current && rows.length > 0) {
      const { rowIdx, colKey } = pendingFocusRef.current;
      if (rowIdx < rows.length) {
        activateCell(rowIdx, colKey, rows[rowIdx]?.[colKey]);
        pendingFocusRef.current = null;
      }
    }
  }, [rows.length, activateCell]);

  /** Calcula las filas actualizadas sin efectos secundarios (sin llamar onChange) */
  const computeCommit = useCallback((rowIdx: number, colKey: string, draftValue: string): Record<string, any>[] => {
    const col = columns.find((c) => c.key === colKey);
    if (!col) return rows;
    let parsed: any = draftValue;
    if (col.type === 'currency') parsed = parseCLP(draftValue);
    else if (col.type === 'number') {
      const n = parseFloat(draftValue);
      parsed = isNaN(n) ? null : n;
    }
    return rows.map((row, idx) => {
      if (idx !== rowIdx) return row;
      const updated = { ...row, [colKey]: parsed };
      columns.forEach((c) => { if (c.computed) updated[c.key] = c.computed(updated); });
      return updated;
    });
  }, [columns, rows]);

  const commitDraft = useCallback((rowIdx: number, colKey: string, draftValue: string) => {
    const col = columns.find((c) => c.key === colKey);
    if (!col) return;

    let parsed: any = draftValue;
    if (col.type === 'currency') parsed = parseCLP(draftValue);
    else if (col.type === 'number') {
      const n = parseFloat(draftValue);
      parsed = isNaN(n) ? null : n;
    }

    const newRows = rows.map((row, idx) => {
      if (idx !== rowIdx) return row;
      const updated = { ...row, [colKey]: parsed };
      // Recalculate computed columns
      columns.forEach((c) => {
        if (c.computed) updated[c.key] = c.computed(updated);
      });
      return updated;
    });
    onChange(newRows);
  }, [columns, rows, onChange]);

  /** Agrega una fila nueva sobre baseRows (ya commiteadas) para evitar stale closure */
  const handleAddRow = useCallback((baseRows: Record<string, any>[]) => {
    if (maxRows && baseRows.length >= maxRows) return;
    const newRow = getNewRow();
    pendingFocusRef.current = { rowIdx: baseRows.length, colKey: editableCols[0]?.key ?? '' };
    onChange([...baseRows, newRow]);
  }, [maxRows, getNewRow, editableCols, onChange]);

  const handleDeleteRow = useCallback((rowIdx: number) => {
    const newRows = rows.filter((_, i) => i !== rowIdx);
    onChange(newRows);
    setActiveCell(null);
  }, [rows, onChange]);

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIdx: number,
    colKey: string
  ) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      isNavigatingRef.current = true;
      const committed = computeCommit(rowIdx, colKey, draft);
      setActiveCell(null);
      const colIdx = editableCols.findIndex((c) => c.key === colKey);
      if (colIdx < editableCols.length - 1) {
        const nextCol = editableCols[colIdx + 1];
        onChange(committed);
        activateCell(rowIdx, nextCol.key, committed[rowIdx]?.[nextCol.key]);
      } else if (rowIdx < committed.length - 1) {
        onChange(committed);
        activateCell(rowIdx + 1, editableCols[0].key, committed[rowIdx + 1]?.[editableCols[0].key]);
      } else {
        handleAddRow(committed);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      isNavigatingRef.current = true;
      const committed = computeCommit(rowIdx, colKey, draft);
      setActiveCell(null);
      const nextRowIdx = rowIdx + 1;
      if (nextRowIdx < committed.length) {
        onChange(committed);
        activateCell(nextRowIdx, colKey, committed[nextRowIdx]?.[colKey]);
      } else {
        handleAddRow(committed);
      }
    } else if (e.key === 'ArrowDown') {
      const input = e.currentTarget;
      const atEnd = input.selectionStart === input.value.length;
      const allSelected = input.selectionStart === 0 && input.selectionEnd === input.value.length;
      if (atEnd || input.value === '' || allSelected) {
        e.preventDefault();
        isNavigatingRef.current = true;
        const committed = computeCommit(rowIdx, colKey, draft);
        setActiveCell(null);
        const nextRowIdx = rowIdx + 1;
        if (nextRowIdx < committed.length) {
          onChange(committed);
          activateCell(nextRowIdx, colKey, committed[nextRowIdx]?.[colKey]);
        } else {
          handleAddRow(committed);
        }
      }
    } else if (e.key === 'ArrowUp') {
      const input = e.currentTarget;
      const atStart = input.selectionStart === 0;
      const allSelected = input.selectionStart === 0 && input.selectionEnd === input.value.length;
      if (atStart || input.value === '' || allSelected) {
        e.preventDefault();
        isNavigatingRef.current = true;
        const committed = computeCommit(rowIdx, colKey, draft);
        setActiveCell(null);
        if (rowIdx > 0) {
          onChange(committed);
          activateCell(rowIdx - 1, colKey, committed[rowIdx - 1]?.[colKey]);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setActiveCell(null);
    }
  }, [computeCommit, draft, editableCols, activateCell, onChange, handleAddRow]);

  const handleBlur = useCallback((rowIdx: number, colKey: string) => {
    // Si Tab/Enter ya procesó la navegación, omitir para evitar doble-commit
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }
    if (activeCell?.rowIdx === rowIdx && activeCell?.colKey === colKey) {
      commitDraft(rowIdx, colKey, draft);
      setActiveCell(null);
    }
  }, [activeCell, commitDraft, draft]);

  const handleSwitchChange = useCallback((rowIdx: number, colKey: string, checked: boolean) => {
    const newRows = rows.map((row, idx) => {
      if (idx !== rowIdx) return row;
      const updated = { ...row, [colKey]: checked };
      columns.forEach((c) => { if (c.computed) updated[c.key] = c.computed(updated); });
      return updated;
    });
    onChange(newRows);
  }, [rows, columns, onChange]);

  const canAdd = !disabled && (!maxRows || rows.length < maxRows);

  return (
    <div style={{ overflowX: 'auto' }}>
      <Table
        highlightOnHover={!disabled}
        verticalSpacing={4}
        styles={{
          thead: { backgroundColor: colors.tableHeader },
          th: { color: colors.tableHeaderText, fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 10px' },
          td: { padding: '2px 4px', fontSize: '0.875rem', color: colors.tableText, borderBottom: `1px solid ${colors.borderLight}` },
        }}
      >
        <Table.Thead>
          <Table.Tr>
            {columns.map((col) => (
              <Table.Th
                key={col.key}
                style={{
                  width: col.width,
                  minWidth: col.type === 'switch' ? 80 : undefined,
                  textAlign: col.type === 'currency' || col.type === 'number' ? 'right' : 'left',
                }}
              >
                {col.header}
              </Table.Th>
            ))}
            <Table.Th style={{ width: 40 }} />
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {rows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '1.5rem', color: colors.textMuted }}>
                <Text size="sm">{emptyMessage}</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            rows.map((row, rowIdx) => (
              <Table.Tr key={row._tempId}>
                {columns.map((col) => {
                  const isActive = activeCell?.rowIdx === rowIdx && activeCell?.colKey === col.key;
                  const isEditable = col.editable !== false && col.type !== 'readonly' && !disabled;
                  const value = col.computed ? col.computed(row) : row[col.key];

                  // Switch column
                  if (col.type === 'switch') {
                    return (
                      <Table.Td key={col.key} style={{ textAlign: 'center' }}>
                        <Switch
                          size="xs"
                          checked={!!value}
                          onChange={(e) => handleSwitchChange(rowIdx, col.key, e.currentTarget.checked)}
                          disabled={disabled}
                        />
                      </Table.Td>
                    );
                  }

                  // Readonly / computed
                  if (!isEditable) {
                    return (
                      <Table.Td key={col.key} style={{ textAlign: col.type === 'currency' || col.type === 'number' ? 'right' : 'left', color: colors.textSecondary, fontStyle: 'italic' }}>
                        {formatDisplay(col, value)}
                      </Table.Td>
                    );
                  }

                  // Editable cell
                  return (
                    <Table.Td
                      key={col.key}
                      style={{ padding: isActive ? '2px 4px' : '2px 4px', cursor: 'text' }}
                      onClick={() => !isActive && activateCell(rowIdx, col.key, value)}
                    >
                      {isActive ? (
                        <input
                          ref={inputRef}
                          value={draft}
                          onChange={(e) => setDraft(e.currentTarget.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIdx, col.key)}
                          onBlur={() => handleBlur(rowIdx, col.key)}
                          style={{
                            width: '100%',
                            border: `1.5px solid ${colors.primary}`,
                            borderRadius: 4,
                            padding: '3px 8px',
                            fontSize: '0.875rem',
                            outline: 'none',
                            textAlign: col.type === 'currency' || col.type === 'number' ? 'right' : 'left',
                            background: 'white',
                            boxSizing: 'border-box',
                            minWidth: col.type === 'text' ? 120 : 80,
                          }}
                        />
                      ) : (
                        <div style={{
                          padding: '3px 8px',
                          minHeight: 26,
                          borderRadius: 4,
                          border: '1.5px solid transparent',
                          textAlign: col.type === 'currency' || col.type === 'number' ? 'right' : 'left',
                          cursor: 'text',
                          transition: 'border-color 100ms',
                        }}
                          onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.borderColor = colors.border; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
                        >
                          {formatDisplay(col, value) || <span style={{ color: colors.textMuted, fontStyle: 'italic', fontSize: '0.8rem' }}>—</span>}
                        </div>
                      )}
                    </Table.Td>
                  );
                })}

                {/* Delete */}
                <Table.Td style={{ width: 40, textAlign: 'center' }}>
                  <Tooltip label="Eliminar fila" position="left" withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => handleDeleteRow(rowIdx)}
                      disabled={disabled}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      {/* Footer: add row */}
      {canAdd && (
        <Group justify="flex-start" p="xs" style={{ borderTop: `1px solid ${colors.borderLight}` }}>
          <ActionIcon
            variant="subtle"
            color="blue"
            size="sm"
            onClick={() => handleAddRow(rows)}
          >
            <IconPlus size={14} />
          </ActionIcon>
          <Text
            size="xs"
            style={{ color: colors.textMuted, cursor: 'pointer' }}
            onClick={() => handleAddRow(rows)}
          >
            Agregar línea {maxRows ? `(${rows.length}/${maxRows})` : ''}
          </Text>
        </Group>
      )}
      {maxRows && rows.length >= maxRows && (
        <Text size="xs" p="xs" style={{ color: colors.textMuted }}>
          Máximo {maxRows} líneas alcanzado
        </Text>
      )}
    </div>
  );
}
