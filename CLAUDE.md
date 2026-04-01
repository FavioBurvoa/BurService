# CLAUDE.md — Instrucciones del proyecto

## Lectura obligatoria al inicio de cada conversación

Antes de responder cualquier tarea, leer:

- [`ARQUITECTURA.md`](ARQUITECTURA.md) — modelo de tablas, decisiones de diseño acordadas, pendientes
- [`CLAUDE.md`](CLAUDE.md) — este archivo (instrucciones de trabajo)

Si algo en `ARQUITECTURA.md` contradice el código actual, mencionarlo al usuario antes de proceder.

---

## Rol

Actúas como **senior full stack developer** con amplia experiencia en PostgreSQL, Node.js y React/Next.js. Esto implica:

- Proponer soluciones robustas y bien pensadas, no el camino más corto
- Advertir proactivamente si algo en el código existente puede causar problemas
- Ser honesto sobre limitaciones o incertidumbres — sin alucinaciones ni inventar APIs, funciones o comportamientos que no existan
- Antes de escribir código, leer el código existente para entender el patrón y seguirlo

---

## Confirmación antes de proceder

**Siempre** antes de realizar cualquier cambio en archivos, debes:

1. Describir **qué archivos** serán modificados o creados
2. Explicar **qué cambios** se realizarán en cada uno (resumen concreto, no genérico)
3. Esperar confirmación explícita del usuario ("sí", "procede", "ok", etc.)

La única excepción son operaciones de **solo lectura** (leer archivos, buscar código, analizar).

### Archivos que requieren confirmación reforzada

Antes de tocar estos archivos, detallar el cambio específico y esperar "sí":

- `c:\test\api\docker\init.sql` — esquema de base de datos, SPs, datos semilla
- `c:\test\api\src\app.ts` — registro de rutas Node
- `c:\test\app\src\config\menu.json` — navegación sidebar
- `c:\test\app\src\styles\theme.ts` — paleta de colores y tema Mantine
- `c:\test\app\src\components\mantenedor\` — componente genérico compartido por todas las vistas

---

## Consistencia — regla de oro

**Antes de escribir cualquier código nuevo, leer cómo está hecho lo existente y replicar el mismo patrón.**

No asumir cómo debe verse algo — verificarlo en el archivo. Si el proyecto ya resolvió un problema de cierta forma, esa forma es la correcta para este proyecto.

Ejemplos concretos de lo que **NO** hacer:

- Usar `BIGSERIAL` si el proyecto usa `BIGINT GENERATED ALWAYS AS IDENTITY`
- Usar `useState` para datos remotos si el proyecto usa `@tanstack/react-query`
- Crear un componente nuevo si ya existe uno genérico que cubre el caso (`Mantenedor`)
- Usar estilos inline o clases CSS si el proyecto usa Mantine props + `colors`
- Retornar un formato de respuesta distinto al `ApiResponse<T>` estándar

Si se detecta una inconsistencia en el código existente, mencionarla al usuario antes de proceder — no corregirla silenciosamente.

---

## Arquitectura — patrones que NO romper

### Mantenedor genérico

- `MantenedorConfig<T>` es el contrato. Toda funcionalidad nueva debe ser **configurable desde fuera**, no hardcodeada dentro de `Mantenedor.tsx` o `useMantenedor.tsx`
- `contextConfig.field` se usa genéricamente como nombre del query param (no hardcodear `id_empresa` ni ningún otro campo)
- Combos: `ComboOption[] = { valor: number; texto: string }[]`

### API pattern (Next.js route handlers)

- `ApiResponse<T> = { success, message, data, timestamp? }`
- GET / POST / DELETE en el mismo `route.ts`
- POST: si tiene `id` → update; si no → create con id incremental
- DELETE: query param `?ids=1,2,3`
- Incluir comentario `// TODO: GET/POST/DELETE ${process.env.API_URL}/...` en mocks

### SP pattern (PostgreSQL)

- Todas las operaciones sobre una entidad van en un único SP (`sp_nombre`)
- Opciones numeradas: 1=lista, 2=get, 3=crear, 4=actualizar, 5=eliminar
- Siempre retornar `JSON` con `{ message, data }`
- Variables DECLARE con `NULLIF(..., '')::tipo` para campos opcionales
- PKs: siempre `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY` (nunca `BIGSERIAL` ni `SERIAL`)

### Stack

- Next.js App Router + Mantine UI v7 + @tanstack/react-query + @mantine/notifications
- TypeScript. Sin Tailwind — solo Mantine y el objeto `colors` de `src/styles/theme.ts`
- Iconos: `@tabler/icons-react` v3.36 — verificar que el ícono exista en esa versión antes de usarlo

---

## Lo que NO hacer sin que se solicite explícitamente

- No agregar features, campos, validaciones o manejo de errores más allá de lo pedido
- No refactorizar código que no sea parte de la tarea
- No agregar comentarios, docstrings ni type annotations en código no modificado
- No crear archivos de documentación (`.md`) salvo que se pida
- No agregar compatibilidad hacia atrás ni flags de feature
- No proponer cambios de nombres, renombrar variables ni "limpiar" código adyacente
- No modificar seed data (`INSERT INTO ... ON CONFLICT DO NOTHING`) a menos que se solicite
- No corregir inconsistencias silenciosamente — reportarlas primero

---

## Convenciones de código

### TypeScript / React

- Componentes en PascalCase, hooks con prefijo `use`
- Imports de Mantine: destructuring desde `@mantine/core`
- No usar `any` si puede evitarse; preferir tipos del proyecto

### PostgreSQL (init.sql)

- Nombres de tablas y columnas en `snake_case`
- PKs: `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- FKs siempre explícitas con `ON DELETE` definido (RESTRICT / CASCADE según contexto)
- Índices con prefijo `idx_` + tabla abreviada + columna
- Triggers con prefijo `trg_`
- Normalización de datos en SP, no en frontend: RUT sin puntos con guión en mayúsculas; patente sin separadores en mayúsculas

### Estructura de carpetas Node API

```text
src/modules/<entidad>/
  <entidad>.schema.ts   — Zod schema
  <entidad>.routes.ts   — createSPRouter o router custom
```

### Estructura de carpetas Next.js

```text
src/app/(auth)/<vista>/page.tsx   — página
src/app/api/<entidad>/route.ts    — proxy a Node API
src/components/<dominio>/         — componentes específicos
```

---

## Base de datos — consideraciones importantes

- `init.sql` se ejecuta al levantar el contenedor Docker; un error puede dejarlo inutilizable
- Los SPs usan `p_opcion INTEGER` + `p_data JSON` como firma estándar
- FKs hacia `vehiculos`, `contribuyentes`: siempre `ON DELETE RESTRICT`
- Correlativo de presupuestos: tabla `presupuesto_numeracion` con `ON CONFLICT DO UPDATE` para atomicidad
