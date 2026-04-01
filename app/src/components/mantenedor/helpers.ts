// ============================================================================
// MANTENEDOR - FUNCIONES AUXILIARES
// ============================================================================

import type { ColumnConfig, ComboOption } from './types';

/**
 * Resuelve el texto de un combo basándose en el valor ID
 */
export function resolveComboText(
  value: any,
  optionsKey: string,
  combos?: Record<string, ComboOption[]>
): string {
  if (!combos || !optionsKey || value === null || value === undefined) {
    return String(value || '');
  }

  const options = combos[optionsKey];
  if (!options) return String(value);

  const option = options.find((opt) => opt.valor === value);
  return option?.texto || String(value);
}

/**
 * Resuelve texto de combo para valores múltiples (multiselect)
 */
export function resolveComboTextMulti(
  values: any,
  optionsKey: string,
  combos?: Record<string, ComboOption[]>
): string {
  if (!combos || !optionsKey || !Array.isArray(values) || values.length === 0) {
    return '';
  }

  const options = combos[optionsKey];
  if (!options) return String(values);

  return values
    .map((val: any) => {
      const option = options.find((opt) => String(opt.valor) === String(val));
      return option?.texto || String(val);
    })
    .join(', ');
}

/**
 * Filtra opciones de combo basándose en dependencias
 * Usa comparación flexible de tipos (string "1" == number 1)
 */
export function filterComboOptions(
  optionsKey: string,
  combos: Record<string, ComboOption[]>,
  dependencies: Record<string, any>
): ComboOption[] {
  const options = combos[optionsKey] || [];

  if (!dependencies || Object.keys(dependencies).length === 0) {
    return options;
  }

  return options.filter((option) => {
    return Object.entries(dependencies).every(([depKey, depValue]) => {
      const optionValue = option[depKey];
      // Comparación flexible: convertir ambos a string para comparar
      return String(optionValue) === String(depValue);
    });
  });
}

/**
 * Verifica si un campo debe estar habilitado basándose en sus dependencias
 */
export function isFieldEnabled(
  column: ColumnConfig,
  formValues: Record<string, any>
): boolean {
  if (!column.editor?.dependsOn || column.editor.dependsOn.length === 0) {
    return true;
  }

  return column.editor.dependsOn.every((depKey) => {
    const value = formValues[depKey];
    return value !== null && value !== undefined && value !== '';
  });
}

/**
 * Obtiene las dependencias de un campo con sus valores actuales
 */
export function getFieldDependencies(
  column: ColumnConfig,
  formValues: Record<string, any>
): Record<string, any> {
  if (!column.editor?.dependsOn) return {};

  const dependencies: Record<string, any> = {};

  column.editor.dependsOn.forEach((depKey) => {
    const value = formValues[depKey];
    if (value !== null && value !== undefined && value !== '') {
      dependencies[depKey] = value;
    }
  });

  return dependencies;
}

/**
 * Filtra filas basándose en término de búsqueda global
 */
export function filterRows<T extends Record<string, any>>(
  rows: T[],
  searchTerm: string,
  columns: ColumnConfig<T>[],
  combos?: Record<string, ComboOption[]>
): T[] {
  if (!searchTerm.trim()) return rows;

  const lowerSearch = searchTerm.toLowerCase();

  return rows.filter((row) => {
    return columns.some((column) => {
      if (column.usage?.grid?.visible === false) return false;

      const value = row[column.key];

      if (column.editor?.type === 'multiselect' && column.editor.optionsKey) {
        const text = resolveComboTextMulti(value, column.editor.optionsKey, combos);
        return text.toLowerCase().includes(lowerSearch);
      }

      if (column.editor?.type === 'select' && column.editor.optionsKey) {
        const text = resolveComboText(value, column.editor.optionsKey, combos);
        return text.toLowerCase().includes(lowerSearch);
      }

      if (value === null || value === undefined) return false;

      return String(value).toLowerCase().includes(lowerSearch);
    });
  });
}

/**
 * Obtiene columnas visibles para la grid
 */
export function getVisibleGridColumns<T>(columns: ColumnConfig<T>[]): ColumnConfig<T>[] {
  return columns.filter((col) => col.usage?.grid?.visible !== false);
}

/**
 * Obtiene columnas visibles para el formulario
 */
export function getVisibleFormColumns<T>(columns: ColumnConfig<T>[]): ColumnConfig<T>[] {
  return columns.filter((col) => col.usage?.form?.visible !== false);
}

/**
 * Construye valores iniciales del formulario
 */
export function buildFormInitialValues<T extends Record<string, any>>(
  columns: ColumnConfig<T>[],
  editData?: T | null
): Record<string, any> {
  const initialValues: Record<string, any> = {};

  columns.forEach((column) => {
    if (column.usage?.form?.visible === false) return;

    // Manejo especial para tipo 'file':
    // La columna virtual recibe el nombre del archivo existente (para validación),
    // y los campos backing (filenameKey, mimeTypeKey, base64Key) se inicializan
    // desde los datos existentes para que se envíen en el payload sin re-subir.
    if (column.dataType === 'file' && column.editor) {
      const fe = column.editor;
      const existingFilename = fe.filenameKey && editData ? (editData[fe.filenameKey] ?? '') : '';
      initialValues[String(column.key)] = existingFilename;
      if (fe.filenameKey) initialValues[fe.filenameKey] = editData?.[fe.filenameKey] ?? '';
      if (fe.mimeTypeKey) initialValues[fe.mimeTypeKey] = editData?.[fe.mimeTypeKey] ?? '';
      if (fe.base64Key)   initialValues[fe.base64Key]   = editData?.[fe.base64Key]   ?? '';
      return;
    }

    if (editData && editData[column.key] !== undefined) {
      if (column.editor?.type === 'multiselect') {
        // Convertir array de valores a array de strings
        const val = editData[column.key];
        initialValues[column.key] = Array.isArray(val)
          ? val.map((v: any) => String(v))
          : [];
      } else if (column.editor?.type === 'select') {
        // Convertir a string si es un select para que coincida con las opciones
        initialValues[column.key] = String(editData[column.key]);
      } else {
        const val = editData[column.key];
        // TextInput no acepta null — convertir string y date a ''
        initialValues[column.key] = (val === null && (column.dataType === 'string' || column.dataType === 'date')) ? '' : val;
      }
    } else if (column.defaultValue !== undefined) {
      initialValues[column.key] = column.defaultValue;
    } else if (column.editor?.type === 'multiselect') {
      initialValues[column.key] = [];
    } else {
      initialValues[column.key] = getDefaultValueForType(column.dataType);
    }
  });

  return initialValues;
}

/**
 * Obtiene valor por defecto según tipo de dato
 */
function getDefaultValueForType(dataType: string): any {
  switch (dataType) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'date':
      return '';
    case 'enum':
      return null; // null para selects
    case 'file':
      return ''; // nombre de archivo vacío
    default:
      return '';
  }
}

/**
 * Valida que todas las dependencias estén resueltas
 */
export function validateDependencies(
  columns: ColumnConfig[],
  formValues: Record<string, any>
): boolean {
  return columns.every((column) => {
    if (!column.editor?.dependsOn) return true;
    return isFieldEnabled(column, formValues);
  });
}
