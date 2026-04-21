// ============================================================================
// MANTENEDOR GENÉRICO - COMPONENTE PRINCIPAL
// ============================================================================

'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Paper,
  TextInput,
  PasswordInput,
  FileInput,
  ActionIcon,
  Group,
  Text,
  Stack,
  Center,
  Modal,
  Button,
  Switch,
  Select,
  MultiSelect,
  Textarea,
  NumberInput,
  Collapse,
  Title,
  Badge,
  Tooltip,
  ThemeIcon,
  LoadingOverlay,
  Skeleton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  IconSearch,
  IconEdit,
  IconTrash,
  IconAlertCircle,
  IconPlus,
  IconChevronDown,
  IconChevronUp,
  IconDatabaseOff,
  IconBuilding,
  IconFile,
  IconFileExport,
  IconFileImport,
} from '@tabler/icons-react';
import { colors } from '@/styles/theme';
import { RutInput } from '@/components/ui/RutInput';
import { PatenteInput } from '@/components/ui/PatenteInput';
import { displayRut, displayPatente } from '@/lib/formatters';
import { enterNavHandler } from '@/lib/enterNav';
import { selectAllOnFocusHandler } from '@/lib/selectOnFocus';
import type { MantenedorConfig, RowSelection, ColumnOverrides } from './types';
import { useMantenedor, ValidationError } from './useMantenedor';
import { ImportModal } from './ImportModal';
import {
  filterRows,
  getVisibleGridColumns,
  getVisibleFormColumns,
  buildFormInitialValues,
  resolveComboText,
  resolveComboTextMulti,
  isFieldEnabled,
  filterComboOptions,
  getFieldDependencies,
} from './helpers';
import type { ColumnConfig } from './types';

/**
 * Convierte un File a string base64 (sin el prefijo data URL).
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) a formato legible (DD/MM/YYYY).
 */
function formatDate(value: string): string {
  if (!value) return '';
  const parts = value.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return value;
}

/**
 * Construye las validaciones del formulario basadas en la configuración de columnas.
 * Soporta overrides dinámicos para required/visible.
 */
function buildFormValidation<T>(
  columns: ColumnConfig<T>[],
  overrides: Record<string, ColumnOverrides> = {}
) {
  const validate: Record<string, (value: any) => string | null> = {};

  columns.forEach((column) => {
    const colOverride = overrides[String(column.key)] || {};
    const isVisible = colOverride.visible ?? (column.usage?.form?.visible !== false);
    if (!isVisible) return;

    const isRequired = colOverride.required ?? column.required;
    const validators: ((value: any) => string | null)[] = [];

    if (isRequired) {
      validators.push((value) => {
        if (value === null || value === undefined || value === '') {
          return `${column.header} es requerido`;
        }
        // Multiselect: array vacío
        if (Array.isArray(value) && value.length === 0) {
          return `${column.header} es requerido`;
        }
        return null;
      });
    }

    if (column.editor?.validation?.pattern) {
      const pattern = column.editor.validation.pattern;
      const message = column.editor.validation.patternMessage || `${column.header} tiene formato inválido`;
      validators.push((value) => {
        if (value && !pattern.test(String(value))) {
          return message;
        }
        return null;
      });
    }

    if (column.editor?.validation?.maxLength) {
      const maxLength = column.editor.validation.maxLength;
      validators.push((value) => {
        if (value && String(value).length > maxLength) {
          return `${column.header} no puede exceder ${maxLength} caracteres`;
        }
        return null;
      });
    }

    if (column.editor?.validation?.minLength) {
      const minLength = column.editor.validation.minLength;
      validators.push((value) => {
        if (value && String(value).length < minLength) {
          return `${column.header} debe tener al menos ${minLength} caracteres`;
        }
        return null;
      });
    }

    if (validators.length > 0) {
      validate[String(column.key)] = (value) => {
        for (const validator of validators) {
          const error = validator(value);
          if (error) return error;
        }
        return null;
      };
    }
  });

  return validate;
}

interface MantenedorProps<T extends Record<string, any>> {
  config: MantenedorConfig<T>;
  onContextChange?: (value: string | null) => void;
}

export function Mantenedor<T extends Record<string, any>>({ config, onContextChange }: MantenedorProps<T>) {
  const { title, columns, idField = 'id' } = config;

  // Contexto de entidad padre (ej: empresa seleccionada) — debe ir antes de useMantenedor
  const [selectedContext, setSelectedContext] = useState<string | null>(null);

  const { data, isLoading, isFetching, error, combos, saveMutation, deleteMutation } = useMantenedor(config, selectedContext);

  const [search, setSearch] = useState('');
  const [searchExpanded, { toggle: toggleSearch }] = useDisclosure(true);
  const [selectedRows, setSelectedRows] = useState<RowSelection>({});
  const [editData, setEditData] = useState<T | null>(null);
  const [deleteData, setDeleteData] = useState<T[]>([]);
  // Archivos seleccionados por columnas de tipo 'file' (clave = column.key)
  const [fileSelections, setFileSelections] = useState<Record<string, File | null>>({});

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [importModalOpened, { open: openImportModal, close: closeImportModal }] = useDisclosure(false);

  const queryClient = useQueryClient();

  // Export / Import helpers (bulkOps)
  const bulkBasePath = config.bulkOps?.basePath ?? config.data.path ?? '';
  const canExport = !!config.bulkOps?.export && !!bulkBasePath;
  const canImport = !!config.bulkOps?.import && !!bulkBasePath;
  const contextField = config.contextConfig?.field;
  const contextDisabled = !!config.contextConfig && !selectedContext;

  const handleExport = () => {
    const url = contextField && selectedContext
      ? `${bulkBasePath}/export?${contextField}=${selectedContext}`
      : `${bulkBasePath}/export`;
    window.location.href = url;
  };

  const handleImportFinished = () => {
    queryClient.invalidateQueries({ queryKey: ['mantenedor', config.data.path, selectedContext ?? null] });
  };

  const isMobile = useMediaQuery('(max-width: 48em)');

  const formRef = useRef<HTMLFormElement>(null);

  // Enfoca el primer campo editable al abrir el modal.
  // Se usa transitionProps.onEntered en el Modal para ejecutar esto DESPUÉS
  // de que Mantine FocusTrap haya terminado — evita que FocusTrap sobreescriba el foco.
  const focusFirstInput = useCallback(() => {
    const first = formRef.current?.querySelector<HTMLElement>(
      'input:not([disabled]):not([aria-disabled="true"]):not([type="hidden"]):not([type="checkbox"]):not([type="file"])',
    );
    first?.focus();
  }, []);

  const form = useForm({
    initialValues: buildFormInitialValues(columns, null),
    validate: (values) => {
      const currentOverrides = config.dynamicConfig?.(values, combos) || {};
      const validators = buildFormValidation(columns, currentOverrides);
      const errors: Record<string, string | null> = {};
      for (const [key, validator] of Object.entries(validators)) {
        const error = validator(values[key]);
        if (error) errors[key] = error;
      }
      // Validaciones cruzadas entre campos
      if (config.crossFieldValidators) {
        for (const [key, validator] of Object.entries(config.crossFieldValidators)) {
          const crossError = validator(values[key], values);
          if (crossError) errors[key] = crossError;
        }
      }
      return errors;
    },
  });

  const filteredData = useMemo(() => {
    if (config.contextConfig && !selectedContext) return [];
    return filterRows(data, search, columns, combos);
  }, [data, search, columns, combos, selectedContext]);

  // Overrides dinámicos basados en valores del formulario
  const overrides = useMemo<Record<string, ColumnOverrides>>(
    () => config.dynamicConfig?.(form.values, combos) || {},
    [config, form.values, combos]
  );

  const selectedCount = Object.values(selectedRows).filter(Boolean).length;
  const allSelected = filteredData.length > 0 && selectedCount === filteredData.length;

  const handleSelectAll = (checked: boolean) => {
    const newSelection: RowSelection = {};
    if (checked) {
      filteredData.forEach((row) => {
        newSelection[row[idField]] = true;
      });
    }
    setSelectedRows(newSelection);
  };

  const handleSelectRow = (rowId: any, checked: boolean) => {
    setSelectedRows((prev) => ({
      ...prev,
      [rowId]: checked,
    }));
  };

  const handleCreate = () => {
    setEditData(null);
    setFileSelections({});
    const initial = buildFormInitialValues(columns, null);
    // Inyectar el valor del contexto (ej: idEmpresa) si hay uno seleccionado
    if (config.contextConfig && selectedContext) {
      initial[config.contextConfig.field] = Number(selectedContext) || selectedContext;
    }
    form.setValues(initial);
    openModal();
  };

  const handleEdit = (row: T) => {
    setEditData(row);
    setFileSelections({});
    form.setValues(buildFormInitialValues(columns, row));
    openModal();
  };

  const handleDeleteSingle = (row: T) => {
    setDeleteData([row]);
    openDeleteModal();
  };

  const handleDeleteMultiple = () => {
    const rowsToDelete = filteredData.filter((row) => selectedRows[row[idField]]);
    setDeleteData(rowsToDelete);
    openDeleteModal();
  };

  const handleConfirmDelete = async () => {
    await deleteMutation.mutateAsync(deleteData);
    closeDeleteModal();
    setDeleteData([]);
    setSelectedRows({});
  };

  const handleSubmit = async (values: Record<string, any>) => {
    // Filtrar claves virtuales (empiezan con '_') — no se envían a la API
    const payload: Record<string, any> = Object.fromEntries(
      Object.entries(values).filter(([key]) => !key.startsWith('_'))
    );

    if (editData && editData[idField]) {
      payload[idField] = editData[idField];
    }

    try {
      await saveMutation.mutateAsync(payload as T);
    } catch (err) {
      if (err instanceof ValidationError) {
        // Mapear errores del backend al form — el label ya se muestra arriba del input
        const formErrors: Record<string, string> = {};
        for (const fe of err.fieldErrors) {
          if (!fe.field || !fe.detail) continue;
          const key = fe.field.split('.')[0];
          formErrors[key] = fe.detail;
        }
        form.setErrors(formErrors);
      }
      // Modal queda abierto; el usuario corrige y reintenta
      return;
    }

    setFileSelections({});
    closeModal();
    form.reset();
  };

  const visibleGridColumns = getVisibleGridColumns(columns);
  const visibleFormColumns = getVisibleFormColumns(columns);

  const isSaving = saveMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <Stack gap="lg">
      {/* Header con título y acciones */}
      <Paper
        shadow="sm"
        p="xl"
        radius="lg"
        style={{
          backgroundColor: colors.bgPrimary,
          border: `1px solid ${colors.border}`,
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <div>
            <Group gap="sm" mb={4}>
              <div
                style={{
                  width: 4,
                  height: 28,
                  borderRadius: 2,
                  backgroundColor: colors.primary,
                }}
              />
              <Title
                order={2}
                style={{
                  fontSize: '1.5rem',
                  color: colors.textPrimary,
                }}
              >
                {title}
              </Title>
            </Group>
            <Text size="sm" style={{ color: colors.textSecondary, paddingLeft: 16 }}>
              {filteredData.length} {filteredData.length === 1 ? 'registro' : 'registros'}
              {selectedCount > 0 && (
                <Badge component="span" variant="light" color="blue" size="sm" ml="xs">
                  {selectedCount} seleccionado{selectedCount > 1 ? 's' : ''}
                </Badge>
              )}
            </Text>
          </div>

          <Group gap="sm" align="flex-end">
            {/* Selector de contexto (ej: empresa) */}
            {config.contextConfig && (
              <Select
                label={
                  <Group gap={4}>
                    <ThemeIcon size="xs" variant="transparent" color="blue">
                      <IconBuilding size={12} />
                    </ThemeIcon>
                    <Text size="xs" fw={600}>{config.contextConfig.label}</Text>
                  </Group>
                }
                placeholder={config.contextConfig.placeholder ?? `Seleccione ${config.contextConfig.label.toLowerCase()}...`}
                data={(combos[config.contextConfig.comboKey] || []).map((opt) => ({
                  value: String(opt.valor),
                  label: opt.texto,
                }))}
                value={selectedContext}
                onChange={(value) => {
                  setSelectedContext(value);
                  onContextChange?.(value);
                }}
                searchable
                clearable
                style={{ minWidth: 260 }}
                size="sm"
              />
            )}
            {selectedCount > 0 && (
              <Button
                leftSection={<IconTrash size={16} />}
                onClick={handleDeleteMultiple}
                color="red"
                variant="light"
                size="sm"
              >
                Eliminar ({selectedCount})
              </Button>
            )}
            {canExport && (
              <Button
                leftSection={<IconFileExport size={16} />}
                onClick={handleExport}
                variant="light"
                color="teal"
                size="sm"
                disabled={contextDisabled}
              >
                Exportar
              </Button>
            )}
            {canImport && (
              <Button
                leftSection={<IconFileImport size={16} />}
                onClick={openImportModal}
                variant="light"
                color="indigo"
                size="sm"
                disabled={contextDisabled}
              >
                Importar
              </Button>
            )}
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={handleCreate}
              size="sm"
              disabled={!!config.contextConfig && !selectedContext}
            >
              Nuevo
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Búsqueda colapsable */}
      <Paper
        shadow="xs"
        p="md"
        radius="lg"
        style={{
          backgroundColor: colors.bgPrimary,
          border: `1px solid ${colors.border}`,
        }}
      >
        <Group
          justify="space-between"
          mb={searchExpanded ? 'md' : 0}
          style={{ cursor: 'pointer' }}
          onClick={toggleSearch}
        >
          <Group gap="xs">
            <IconSearch size={16} style={{ color: colors.textSecondary }} />
            <Text fw={600} size="sm" style={{ color: colors.textPrimary }}>
              Búsqueda
            </Text>
            {search && !searchExpanded && (
              <Badge variant="light" color="blue" size="sm">
                {search}
              </Badge>
            )}
          </Group>
          <ActionIcon variant="subtle" size="sm" onClick={(e) => { e.stopPropagation(); toggleSearch(); }}>
            {searchExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </ActionIcon>
        </Group>

        <Collapse in={searchExpanded}>
          <TextInput
            placeholder="Buscar en todos los campos..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            onClick={(e) => e.stopPropagation()}
          />
        </Collapse>
      </Paper>

      {/* Error banner */}
      {error && (
        <Paper
          p="md"
          radius="lg"
          style={{ border: `1px solid ${colors.error}40`, backgroundColor: colors.errorLight }}
        >
          <Group gap="sm">
            <IconAlertCircle size={20} style={{ color: colors.error }} />
            <div>
              <Text fw={600} size="sm" style={{ color: colors.textPrimary }}>Error al cargar datos</Text>
              <Text size="xs" style={{ color: colors.textSecondary }}>{(error as Error).message}</Text>
            </div>
            <Button variant="light" color="red" size="xs" ml="auto" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </Group>
        </Paper>
      )}

      {/* Tabla */}
      <Paper
        shadow="sm"
        radius="lg"
        style={{
          overflow: 'hidden',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.bgPrimary,
          position: 'relative',
        }}
      >
        <LoadingOverlay
          visible={isFetching && !isLoading}
          zIndex={10}
          overlayProps={{ blur: 1, backgroundOpacity: 0.25 }}
          loaderProps={{ size: 'sm' }}
        />
        <div style={{ overflowX: 'auto' }}>
          <Table
            highlightOnHover
            verticalSpacing="sm"
            horizontalSpacing="md"
            styles={{
              thead: {
                backgroundColor: colors.tableHeader,
                borderBottom: `2px solid ${colors.primary}`,
              },
              th: {
                color: colors.tableHeaderText,
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '0.875rem 1rem',
              },
              td: {
                padding: '0.75rem 1rem',
                color: colors.tableText,
                fontSize: '0.875rem',
                borderBottom: `1px solid ${colors.borderLight}`,
              },
              tr: {
                transition: 'background-color 100ms ease',
              },
            }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 48, padding: '0.875rem 0.75rem' }}>
                  <Switch
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.currentTarget.checked)}
                    size="xs"
                    aria-label="Seleccionar todos"
                  />
                </Table.Th>
                {visibleGridColumns.map((column) => (
                  <Table.Th key={String(column.key)}>{column.header}</Table.Th>
                ))}
                <Table.Th
                  style={{
                    textAlign: 'right',
                    width: 100,
                    position: 'sticky',
                    right: 0,
                    backgroundColor: colors.tableHeader,
                    zIndex: 1,
                  }}
                >
                  Acciones
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Table.Tr key={i}>
                    <Table.Td><Skeleton height={14} radius="sm" /></Table.Td>
                    {visibleGridColumns.map((col) => (
                      <Table.Td key={String(col.key)}>
                        <Skeleton height={14} radius="sm" />
                      </Table.Td>
                    ))}
                    <Table.Td><Skeleton height={14} radius="sm" /></Table.Td>
                  </Table.Tr>
                ))
              ) : filteredData.length === 0 ? (
                <Table.Tr>
                  <Table.Td
                    colSpan={visibleGridColumns.length + 2}
                    style={{ textAlign: 'center', padding: '3rem 1rem' }}
                  >
                    <Stack align="center" gap="xs">
                      <IconDatabaseOff
                        size={40}
                        style={{ color: colors.textMuted }}
                      />
                      <Text fw={500} size="sm" style={{ color: colors.textPrimary }}>
                        {search ? 'Sin resultados' : 'Sin registros'}
                      </Text>
                      <Text size="xs" style={{ color: colors.textSecondary }}>
                        {config.contextConfig && !selectedContext
                          ? `Seleccione una ${config.contextConfig.label.toLowerCase()} para ver los registros`
                          : search
                            ? 'Intenta con otro término de búsqueda'
                            : 'Comienza creando tu primer registro'}
                      </Text>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredData.map((row) => (
                  <Table.Tr key={row[idField]}>
                    <Table.Td style={{ padding: '0.75rem' }}>
                      <Switch
                        checked={!!selectedRows[row[idField]]}
                        onChange={(e) => handleSelectRow(row[idField], e.currentTarget.checked)}
                        size="xs"
                        aria-label={`Seleccionar registro ${row[idField]}`}
                      />
                    </Table.Td>
                    {visibleGridColumns.map((column) => (
                      <Table.Td key={String(column.key)}>
                        {column.formatter
                          ? column.formatter(row[column.key], row, combos)
                          : column.editor?.type === 'rut'
                            ? displayRut(String(row[column.key] ?? ''))
                            : column.editor?.type === 'patente'
                              ? displayPatente(String(row[column.key] ?? ''))
                              : column.editor?.type === 'multiselect' && column.editor.optionsKey
                            ? resolveComboTextMulti(row[column.key], column.editor.optionsKey, combos)
                            : column.editor?.type === 'select' && column.editor.optionsKey
                              ? resolveComboText(row[column.key], column.editor.optionsKey, combos)
                              : column.dataType === 'boolean'
                                ? row[column.key] ? 'Sí' : 'No'
                                : column.dataType === 'date'
                                  ? formatDate(String(row[column.key] ?? ''))
                                  : column.dataType === 'file'
                                    ? (
                                      <Group gap={4}>
                                        <IconFile size={14} style={{ color: colors.textSecondary }} />
                                        <Text size="sm">{String(row[column.editor?.filenameKey ?? column.key] ?? '')}</Text>
                                      </Group>
                                    )
                                    : String(row[column.key] ?? '')}
                      </Table.Td>
                    ))}
                    <Table.Td
                      style={{
                        position: 'sticky',
                        right: 0,
                        backgroundColor: colors.bgPrimary,
                        zIndex: 1,
                      }}
                    >
                      <Group justify="flex-end" gap={4}>
                        <Tooltip label="Editar" position="top" withArrow>
                          <ActionIcon
                            variant="light"
                            color="blue"
                            size="md"
                            onClick={() => handleEdit(row)}
                            aria-label="Editar"
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Eliminar" position="top" withArrow>
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="md"
                            onClick={() => handleDeleteSingle(row)}
                            aria-label="Eliminar"
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </div>
      </Paper>

      {/* Modal Crear/Editar */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={editData ? `Editar ${title}` : `Nuevo ${title}`}
        centered={!isMobile}
        size="lg"
        fullScreen={isMobile}
        closeOnClickOutside={!isSaving}
        closeOnEscape={!isSaving}
        transitionProps={{ onEntered: focusFirstInput }}
      >
        <form
          ref={formRef}
          onSubmit={form.onSubmit(handleSubmit)}
          onKeyDown={config.enterNavigation !== false ? enterNavHandler : undefined}
          onFocus={config.selectAllOnFocus !== false ? selectAllOnFocusHandler : undefined}
        >
          <Stack gap="lg">
            <div
              className="mantenedor-form-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
              }}
            >
              {visibleFormColumns.map((column) => {
                const colKey = String(column.key);
                const colOverride = overrides[colKey] || {};

                // Visibilidad dinámica
                const isDynamicallyHidden = colOverride.visible === false;
                if (isDynamicallyHidden) return null;

                const isEditable = column.usage?.form?.editable !== false;
                const isEditableOnCreate = column.usage?.form?.editableOnCreate === true;

                const isDisabledByEdit = editData && !isEditable;
                const isDisabledByEditOnCreate = editData && isEditableOnCreate;
                const isDynamicallyDisabled = colOverride.disabled === true;
                const isDisabled = isDisabledByEdit || isDisabledByEditOnCreate || isDynamicallyDisabled || isSaving;

                const isEnabled = isFieldEnabled(column, form.values);
                const dependencies = getFieldDependencies(column, form.values);

                const isRequired = colOverride.required ?? column.required;

                const colSpan = column.usage?.form?.colSpan || 1;
                const gridColumn = colSpan === 2 ? 'span 2' : 'span 1';

                const commonProps = {
                  label: column.header,
                  required: isRequired,
                  disabled: isDisabled || !isEnabled,
                  style: { gridColumn },
                };

                if (column.editor?.type === 'select') {
                  const options = column.editor.optionsKey
                    ? filterComboOptions(column.editor.optionsKey, combos, dependencies)
                    : [];

                  const dependentFields = columns.filter(
                    (col) => col.editor?.dependsOn?.includes(colKey)
                  );

                  const formInputProps = form.getInputProps(colKey);

                  const dependencyValues = Object.values(dependencies).join('-');
                  const selectKey = `${colKey}-${dependencyValues}`;

                  return (
                    <Select
                      key={selectKey}
                      {...commonProps}
                      placeholder={column.editor.placeholder || 'Seleccione...'}
                      data={options.map((opt) => ({
                        value: String(opt.valor),
                        label: opt.texto,
                      }))}
                      searchable
                      clearable
                      value={formInputProps.value || null}
                      error={formInputProps.error}
                      onChange={(value) => {
                        formInputProps.onChange(value);
                        dependentFields.forEach((depField) => {
                          form.setFieldValue(String(depField.key), null);
                        });
                      }}
                    />
                  );
                }

                if (column.editor?.type === 'multiselect') {
                  const options = column.editor.optionsKey
                    ? filterComboOptions(column.editor.optionsKey, combos, dependencies)
                    : [];

                  const formInputProps = form.getInputProps(colKey);

                  return (
                    <MultiSelect
                      key={colKey}
                      {...commonProps}
                      placeholder={column.editor.placeholder || 'Seleccione...'}
                      data={options.map((opt) => ({
                        value: String(opt.valor),
                        label: opt.texto,
                      }))}
                      searchable
                      clearable
                      value={formInputProps.value || []}
                      error={formInputProps.error}
                      onChange={formInputProps.onChange}
                    />
                  );
                }

                if (column.editor?.type === 'switch') {
                  return (
                    <Switch
                      key={colKey}
                      {...commonProps}
                      {...form.getInputProps(colKey, { type: 'checkbox' })}
                      style={{ ...commonProps.style, paddingTop: '1.5rem' }}
                    />
                  );
                }

                if (column.editor?.type === 'number') {
                  return (
                    <NumberInput
                      key={colKey}
                      {...commonProps}
                      placeholder={column.editor.placeholder}
                      min={column.editor.min}
                      max={column.editor.max}
                      {...form.getInputProps(colKey)}
                    />
                  );
                }

                if (column.editor?.type === 'textarea') {
                  return (
                    <Textarea
                      key={colKey}
                      {...commonProps}
                      placeholder={column.editor.placeholder}
                      rows={column.editor.rows || 3}
                      {...form.getInputProps(colKey)}
                    />
                  );
                }

                if (column.editor?.type === 'password') {
                  return (
                    <PasswordInput
                      key={colKey}
                      {...commonProps}
                      placeholder={column.editor.placeholder}
                      {...form.getInputProps(colKey)}
                    />
                  );
                }

                if (column.editor?.type === 'date') {
                  return (
                    <TextInput
                      key={colKey}
                      type="date"
                      {...commonProps}
                      {...form.getInputProps(colKey)}
                    />
                  );
                }

                if (column.dataType === 'file' && column.editor?.type === 'file') {
                  const fe = column.editor;
                  const existingFilename = form.values[fe.filenameKey ?? ''] as string;
                  return (
                    <FileInput
                      key={colKey}
                      {...commonProps}
                      accept={fe.accept?.join(',')}
                      placeholder={
                        existingFilename && !fileSelections[colKey]
                          ? `Archivo actual: ${existingFilename}`
                          : (fe.placeholder ?? 'Seleccionar archivo...')
                      }
                      description={
                        existingFilename && !fileSelections[colKey]
                          ? 'Deja vacío para conservar el archivo actual'
                          : undefined
                      }
                      leftSection={<IconFile size={16} />}
                      value={fileSelections[colKey] ?? null}
                      error={form.errors[colKey]}
                      onChange={async (file) => {
                        setFileSelections((prev) => ({ ...prev, [colKey]: file }));
                        if (file) {
                          const base64 = await fileToBase64(file);
                          form.setFieldValue(colKey, file.name);
                          if (fe.filenameKey) form.setFieldValue(fe.filenameKey, file.name);
                          if (fe.mimeTypeKey) form.setFieldValue(fe.mimeTypeKey, file.type);
                          if (fe.base64Key) form.setFieldValue(fe.base64Key, base64);
                        }
                      }}
                    />
                  );
                }

                if (column.editor?.type === 'rut') {
                  return (
                    <RutInput
                      key={colKey}
                      {...commonProps}
                      placeholder={column.editor.placeholder}
                      value={String(form.values[colKey] ?? '')}
                      onChange={(raw) => form.setFieldValue(colKey, raw)}
                      onBlur={(normalized) => form.setFieldValue(colKey, normalized)}
                      error={form.errors[colKey]}
                    />
                  );
                }

                if (column.editor?.type === 'patente') {
                  return (
                    <PatenteInput
                      key={colKey}
                      {...commonProps}
                      placeholder={column.editor.placeholder}
                      value={String(form.values[colKey] ?? '')}
                      onChange={(raw) => form.setFieldValue(colKey, raw)}
                      onBlur={(normalized) => form.setFieldValue(colKey, normalized)}
                      error={form.errors[colKey]}
                    />
                  );
                }

                return (
                  <TextInput
                    key={colKey}
                    {...commonProps}
                    placeholder={column.editor?.placeholder}
                    {...form.getInputProps(colKey)}
                  />
                );
              })}
            </div>

            <Group justify="flex-end" mt="md" gap="sm">
              <Button
                variant="subtle"
                color="gray"
                onClick={closeModal}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={isSaving}>
                {editData ? 'Guardar cambios' : 'Crear'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title={
          <Group gap="sm">
            <IconAlertCircle size={22} style={{ color: colors.error }} />
            <Text fw={700} size="lg">
              Confirmar Eliminación
            </Text>
          </Group>
        }
        centered
        size="sm"
        closeOnClickOutside={!isDeleting}
        closeOnEscape={!isDeleting}
      >
        <Stack gap="md">
          <Paper
            p="md"
            radius="md"
            style={{
              backgroundColor: colors.errorLight,
              border: `1px solid ${colors.error}20`,
            }}
          >
            <Text size="sm" style={{ color: colors.textPrimary }}>
              ¿Está seguro que desea eliminar{' '}
              <Text component="span" fw={700} style={{ color: colors.error }}>
                {deleteData.length === 1 ? 'este registro' : `estos ${deleteData.length} registros`}
              </Text>
              ? Esta acción no se puede deshacer.
            </Text>
          </Paper>

          <Group justify="flex-end" gap="sm">
            <Button
              variant="subtle"
              color="gray"
              onClick={closeDeleteModal}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              color="red"
              onClick={handleConfirmDelete}
              loading={isDeleting}
              leftSection={<IconTrash size={16} />}
            >
              Eliminar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal Importar */}
      {canImport && (
        <ImportModal<T>
          opened={importModalOpened}
          onClose={closeImportModal}
          title={title}
          basePath={bulkBasePath}
          columns={columns}
          contextField={contextField}
          contextValue={selectedContext}
          idField={idField}
          onFinished={handleImportFinished}
        />
      )}
    </Stack>
  );
}
