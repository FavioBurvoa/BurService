// ============================================================================
// MANTENEDOR - TIPOS Y CONFIGURACIÓN
// ============================================================================

import type { z } from 'zod';

/**
 * Respuesta estándar de la API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: ApiError[];
  timestamp?: string;
}

export interface ApiError {
  field?: string;
  code?: string;
  detail?: string;
}

/**
 * Tipos de datos soportados
 */
export type DataType = 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'file';

/**
 * Tipos de editores para formularios
 */
export type EditorType = 'text' | 'number' | 'switch' | 'select' | 'multiselect' | 'textarea' | 'date' | 'password' | 'file';

/**
 * Configuración de uso de columna en diferentes contextos
 */
export interface ColumnUsage {
  grid?: {
    visible?: boolean;
  };
  form?: {
    visible?: boolean;
    editable?: boolean;
    editableOnCreate?: boolean; // Solo editable al crear, deshabilitado al editar
    colSpan?: number;
  };
  search?: {
    enabled?: boolean;
  };
}

/**
 * Configuración de validación de campo
 */
export interface ValidationConfig {
  pattern?: RegExp;
  patternMessage?: string;
  maxLength?: number;
  minLength?: number;
}

/**
 * Configuración del editor de campo
 */
export interface EditorConfig {
  type: EditorType;
  optionsKey?: string;
  dependsOn?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  rows?: number;
  validation?: ValidationConfig;
  // Propiedades exclusivas para tipo 'file'
  accept?: string[];       // Extensiones permitidas, ej: ['.p12','.pfx']
  filenameKey?: string;   // Campo donde se guarda el nombre del archivo
  mimeTypeKey?: string;   // Campo donde se guarda el MIME type
  base64Key?: string;     // Campo donde se guarda el contenido en base64
}

/**
 * Configuración de columna
 */
export interface ColumnConfig<T = any> {
  key: string;
  header: string;
  dataType: DataType;
  usage?: ColumnUsage;
  editor?: EditorConfig;
  formatter?: (value: any, row: T, combos?: Record<string, ComboOption[]>) => React.ReactNode;
  validator?: z.ZodType<any>;
  required?: boolean;
  defaultValue?: any;
}

/**
 * Configuración de endpoint
 */
export interface EndpointConfig {
  path?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Datos estáticos — si se provee, no se hace fetch */
  static?: ComboOption[];
}

/**
 * Opciones de combo
 */
export interface ComboOption {
  valor: any;
  texto: string;
  [key: string]: any;
}

/**
 * Configuración de combos
 */
export type CombosConfig = Record<string, EndpointConfig>;

/**
 * Overrides dinámicos de columna (retornados por dynamicConfig)
 */
export interface ColumnOverrides {
  required?: boolean;
  visible?: boolean;
  disabled?: boolean;
}

/**
 * Configuración del selector de contexto (entidad padre).
 * Permite filtrar el grid y pre-inyectar un campo en el formulario
 * según la entidad padre seleccionada (ej: empresa).
 */
export interface ContextConfig {
  field: string;       // Campo a inyectar/filtrar, ej: 'idEmpresa'
  comboKey: string;    // Clave del combo que provee las opciones, ej: 'empresas'
  label: string;       // Etiqueta del selector, ej: 'Empresa'
  placeholder?: string;
}

/**
 * Configuración completa del Mantenedor
 */
export interface MantenedorConfig<T = any> {
  title: string;
  data: EndpointConfig;
  save: EndpointConfig;
  delete: EndpointConfig;
  columns: ColumnConfig<T>[];
  combos?: CombosConfig;
  idField?: string;
  /**
   * Selector de contexto: muestra un select en el header para filtrar
   * los registros y pre-cargar un campo en el formulario.
   */
  contextConfig?: ContextConfig;
  /**
   * Validaciones cruzadas entre campos.
   * Reciben el valor del campo y todos los valores del formulario.
   */
  crossFieldValidators?: Record<
    string,
    (value: any, allValues: Record<string, any>) => string | null
  >;
  /**
   * Función declarativa que retorna overrides dinámicos por columna.
   * Se evalúa en cada render — debe ser pura (sin side effects).
   */
  dynamicConfig?: (
    formValues: Record<string, any>,
    combos: Record<string, ComboOption[]>
  ) => Record<string, ColumnOverrides>;
}

/**
 * Estado de fila seleccionada
 */
export interface RowSelection {
  [key: string]: boolean;
}
