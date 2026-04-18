# Mantenedor Generico

Componente reutilizable para crear CRUDs con grid, modal de edicion/creacion, busqueda, seleccion multiple y eliminacion masiva.

## Caracteristicas

- **Grid configurable** con seleccion multiple
- **Modal unico** para crear/editar
- **Busqueda global** en todas las columnas (incluye resolucion de combos)
- **Combos dependientes** N niveles (ej: marca -> modelo -> submodelo)
- **Validacion** con Zod + validaciones cruzadas entre campos
- **React Query** para data fetching con invalidacion automatica
- **Eliminacion** individual y masiva
- **Resolucion automatica** de IDs -> texto en combos
- **Estilos consistentes** con paleta del proyecto
- **Enter navigation** entre campos del formulario (configurable)
- **Select-all on focus** al enfocar inputs con contenido (configurable)
- **Auto-focus** en primer campo al abrir modal
- **Context selector** para filtrar por entidad padre (ej: empresa)
- **Dynamic config** para overrides de columna segun estado del form
- **Cross-field validators** para validaciones que dependen de multiples campos
- **Tipos de editor**: text, number, textarea, switch, select, multiselect, date, password, file, rut, patente

## Uso Basico

```tsx
import { Mantenedor } from '@/components/mantenedor/Mantenedor';
import type { MantenedorConfig } from '@/components/mantenedor/types';

const config: MantenedorConfig<MiTipo> = {
  title: 'Mi Entidad',
  idField: 'id',
  data: { path: '/api/mi-entidad', method: 'GET' },
  save: { path: '/api/mi-entidad', method: 'POST' },
  delete: { path: '/api/mi-entidad', method: 'DELETE' },
  columns: [
    {
      key: 'nombre',
      header: 'Nombre',
      dataType: 'string',
      required: true,
      editor: { type: 'text', placeholder: 'Ingrese nombre' },
    },
  ],
};

export default function MiPagina() {
  return <Mantenedor config={config} />;
}
```

## Configuracion de MantenedorConfig

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| title | string | requerido | Titulo del mantenedor |
| idField | string | 'id' | Nombre del campo PK |
| data | EndpointConfig | requerido | Endpoint GET para datos |
| save | EndpointConfig | requerido | Endpoint POST para guardar |
| delete | EndpointConfig | requerido | Endpoint DELETE |
| columns | ColumnConfig[] | requerido | Configuracion de columnas |
| combos | CombosConfig | undefined | Configuracion de combos |
| contextConfig | ContextConfig | undefined | Selector de entidad padre |
| enterNavigation | boolean | true | Enter avanza al siguiente campo |
| selectAllOnFocus | boolean | true | Selecciona texto al enfocar |
| crossFieldValidators | Record | undefined | Validaciones cruzadas |
| dynamicConfig | function | undefined | Overrides dinamicos por columna |

## Tipos de datos (dataType)

- `string` — Texto
- `number` — Numeros
- `boolean` — Si/No
- `date` — Fechas
- `enum` — Opciones de combo
- `file` — Archivos (base64)

## Tipos de editores (EditorType)

| Editor | Componente Mantine | Notas |
|--------|-------------------|-------|
| text | TextInput | Input de texto estandar |
| number | NumberInput | Input numerico con min/max |
| textarea | Textarea | Area de texto con rows configurable |
| switch | Switch | Toggle boolean |
| select | Select | Combo desplegable, soporta dependencias |
| multiselect | MultiSelect | Seleccion multiple |
| date | DateInput | Selector de fecha |
| password | PasswordInput | Input con toggle de visibilidad |
| file | FileInput | Upload con conversion a base64 |
| rut | RutInput | Input con formato chileno (12.345.678-9) |
| patente | PatenteInput | Input con formato chileno (AB-CD-12) |

## Combos dependientes

Para combos que dependen de otros (ej: modelo depende de marca):

1. **En la columna**: Agregar `dependsOn: ['marca']`
2. **En los datos del combo**: Incluir el campo de dependencia como propiedad

```tsx
// Configuracion de columna
{
  key: 'modelo',
  header: 'Modelo',
  dataType: 'enum',
  editor: {
    type: 'select',
    optionsKey: 'modelos',
    dependsOn: ['marca'],  // Se habilita solo si 'marca' tiene valor
  },
}

// API modelos debe retornar:
[
  { valor: 1, texto: 'Corolla', marca: 1 },
  { valor: 2, texto: 'Civic', marca: 2 },
]
```

El filtrado es **client-side** automatico via `filterComboOptions()`.

Cascadas de N niveles: cada nivel usa `dependsOn` apuntando al padre.
Los Selects dependientes se remontan via `selectKey` cuando cambia el padre.

## Context selector

Filtra el grid y pre-inyecta un campo en el formulario segun la entidad padre:

```tsx
contextConfig: {
  field: 'idEmpresa',          // campo a inyectar
  comboKey: 'empresas',        // combo que provee opciones
  label: 'Empresa',
  placeholder: 'Seleccione empresa',
}
```

## Dynamic config

Overrides dinamicos por columna segun el estado del formulario:

```tsx
dynamicConfig: (formValues, combos) => ({
  modelo: {
    required: !!formValues.marca,
    disabled: !formValues.marca,
  },
})
```

Retorna `Record<string, { required?, visible?, disabled? }>`.

## Cross-field validators

Validaciones que dependen de multiples campos:

```tsx
crossFieldValidators: {
  fechaVencimiento: (value, allValues) => {
    if (value && allValues.fechaRegistro && value < allValues.fechaRegistro) {
      return 'Debe ser posterior a fecha de registro';
    }
    return null;
  },
}
```

## Visibilidad de columnas (ColumnUsage)

```tsx
usage: {
  grid: { visible: true },           // visible en la tabla
  form: {
    visible: true,                    // visible en el modal
    editable: true,                   // editable (si false, solo lectura)
    editableOnCreate: true,           // editable solo al crear (disabled al editar)
    colSpan: 2,                       // ocupa 2 columnas en el form
  },
  search: { enabled: true },          // incluir en busqueda global
}
```

## Validacion

```tsx
import { z } from 'zod';

{
  key: 'email',
  header: 'Email',
  dataType: 'string',
  required: true,
  validator: z.string().email('Email invalido'),
  editor: {
    type: 'text',
    validation: {
      maxLength: 300,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMessage: 'Formato de email invalido',
    },
  },
}
```

## Formatters personalizados

```tsx
formatter: (value, row, combos) => {
  if (value) return <Badge color="green">Activo</Badge>;
  return <Badge color="gray">Inactivo</Badge>;
}
```

## Combos estaticos

```tsx
combos: {
  ambiente: {
    static: [
      { valor: 'certificacion', texto: 'Certificacion' },
      { valor: 'produccion', texto: 'Produccion' },
    ],
  },
}
```

## API Endpoints esperados

### GET (Datos)

```json
{
  "success": true,
  "message": "Datos obtenidos",
  "data": [{ "id": 1, "nombre": "..." }],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### POST (Guardar)

- Si el body contiene `id` -> update
- Si no tiene `id` -> create

### DELETE (Eliminar)

- Recibe array de objetos completos: `[{id: 1, ...}, {id: 2, ...}]`
- Funciona igual para individual o masivo

### Combos

```json
{
  "success": true,
  "data": [
    { "valor": 1, "texto": "Opcion 1" },
    { "valor": 2, "texto": "Opcion 2", "campoExtra": "valor" }
  ]
}
```

## Archivos

```text
components/mantenedor/
  types.ts          — Interfaces: MantenedorConfig, ColumnConfig, EditorConfig, etc.
  helpers.ts        — filterComboOptions, isFieldEnabled, buildFormInitialValues, etc.
  useMantenedor.tsx  — Hook con React Query (fetch, save, delete, combos)
  Mantenedor.tsx    — Componente principal (grid + modal + form)
  index.ts          — Re-exports
  README.md         — Esta documentacion
```

## Ejemplo completo

Ver: `src/app/(auth)/mantenedores/vehiculos/page.tsx`
