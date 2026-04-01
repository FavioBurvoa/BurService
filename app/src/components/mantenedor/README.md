# Mantenedor Genérico

Componente reutilizable para crear CRUDs con grid, modal de edición/creación, búsqueda, selección múltiple y eliminación masiva.

## Características

✅ **Grid configurable** con selección múltiple
✅ **Modal único** para crear/editar
✅ **Búsqueda global** en todas las columnas
✅ **Combos dependientes** (ej: marca → modelo)
✅ **Validación** con Zod
✅ **React Query** para data fetching
✅ **Eliminación** individual y masiva
✅ **Resolución automática** de IDs → texto en combos
✅ **Estilos consistentes** con paleta del proyecto

## Uso Básico

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
    // ... más columnas
  ],
  combos: {
    tipos: { path: '/api/tipos', method: 'GET' },
  },
};

export default function MiPagina() {
  return <Mantenedor config={config} />;
}
```

## Configuración de Columnas

### Tipos de datos

- `string`: Texto
- `number`: Números
- `boolean`: Sí/No
- `date`: Fechas
- `enum`: Opciones de combo

### Tipos de editores

- `text`: Input de texto
- `textarea`: Área de texto
- `number`: Input numérico
- `switch`: Switch (boolean)
- `select`: Combo desplegable

### Ejemplo completo

```tsx
{
  key: 'modelo',
  header: 'Modelo',
  dataType: 'enum',
  required: true,
  usage: {
    grid: { visible: true },
    form: { visible: true, editable: true, colSpan: 1 },
    search: { enabled: true },
  },
  editor: {
    type: 'select',
    optionsKey: 'modelos',
    dependsOn: ['marca'],  // Se habilita solo si 'marca' tiene valor
    placeholder: 'Seleccione modelo',
  },
  formatter: (value, row, combos) => (
    <Badge>{resolveComboText(value, 'modelos', combos)}</Badge>
  ),
}
```

## Combos Dependientes

Para combos que dependen de otros (ej: modelo depende de marca):

1. **En la columna**: Agregar `dependsOn: ['marca']`
2. **En los datos del combo**: Incluir el campo de dependencia

```tsx
// API modelos debe retornar:
[
  { valor: 1, texto: 'Corolla', marca: 1 },
  { valor: 2, texto: 'Civic', marca: 2 },
]
```

El filtrado es **client-side** automático.

## API Endpoints

### GET (Datos)
```json
{
  "success": true,
  "message": "Datos obtenidos",
  "data": [{ id: 1, nombre: "..." }],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### POST (Guardar)
- Si el body contiene `id`, se interpreta como edición
- Si no tiene `id`, se crea nuevo

### DELETE (Eliminar)
- Recibe array de objetos completos: `[{id: 1, ...}, {id: 2, ...}]`
- Funciona igual para individual o masivo

### Combos
```json
{
  "success": true,
  "data": [
    { "valor": 1, "texto": "Opción 1" },
    { "valor": 2, "texto": "Opción 2", "campoExtra": "valor" }
  ]
}
```

## Validación

```tsx
import { z } from 'zod';

{
  key: 'email',
  header: 'Email',
  dataType: 'string',
  required: true,
  validator: z.string().email('Email inválido'),
  editor: { type: 'text' },
}
```

## Formatters Personalizados

```tsx
formatter: (value, row, combos) => {
  if (value === 'ACTIVO') {
    return <Badge color="green">{value}</Badge>;
  }
  return <Badge color="gray">{value}</Badge>;
}
```

## Archivos

```
/components/mantenedor/
├── types.ts          # Interfaces TypeScript
├── helpers.ts        # Funciones auxiliares
├── useMantenedor.ts  # Hook con React Query
├── Mantenedor.tsx    # Componente principal
└── README.md         # Esta documentación
```

## Ejemplo Completo

Ver: `/app/(auth)/vehiculos/lista/page.tsx`

## Mejoras Futuras

- ⏳ Paginación server-side
- ⏳ Filtros avanzados por columna
- ⏳ Export a Excel/CSV
- ⏳ Import masivo
- ⏳ Ordenamiento por columna
- ⏳ Validación con schemas Zod completos
