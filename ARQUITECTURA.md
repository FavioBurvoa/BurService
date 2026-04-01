# ARQUITECTURA.md — Decisiones y modelo del proyecto

Este archivo registra decisiones de diseño acordadas. Mantenerlo actualizado a medida que se toman nuevas decisiones. **No modificar sin consenso.**

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js App Router + Mantine UI v7 + @tanstack/react-query |
| Backend | Node.js + Fastify (o Express) |
| Base de datos | PostgreSQL (Docker, `init.sql`) |
| Notificaciones | @mantine/notifications |
| Iconos | @tabler/icons-react v3.36 |
| Estilos | Solo Mantine props + `src/styles/theme.ts` (sin Tailwind) |

---

## Modelo de base de datos — módulo Presupuestos

### Decisiones generales

| Decisión | Resolución | Motivo |
|----------|-----------|--------|
| PKs | `BIGINT GENERATED ALWAYS AS IDENTITY` | Estándar SQL moderno, más robusto que `BIGSERIAL` |
| Datos vehículo/cliente en presupuesto | Snapshot + soft FK | Integridad histórica del documento |
| ON DELETE vehiculo/cliente/contribuyente | `RESTRICT` | Evita borrado accidental de datos referenciados |
| Correlativo | Tabla `presupuesto_numeracion` con `ON CONFLICT DO UPDATE` | Atómico, sin race conditions |
| RUT almacenado | Sin puntos, con guión, mayúsculas (`12345678-9`) | Facilita comparaciones y filtrado |
| Patente almacenada | Sin separadores, mayúsculas (`ABCD12`) | Facilita búsquedas |
| Formato display RUT/patente | Segunda pasada vía `editor.normalize` en ColumnConfig | Configurable, no hardcodeado |
| `nombre_tipo_presupuesto` | Eliminado — no se guarda snapshot | La configuración de tipos no cambia |
| `marca`/`modelo` como texto | Eliminados — se guarda `id_modelo` | `modelos` ya contiene `id_marca`; el SP retorna ambos |
| `cliente_comuna` como texto | Eliminado — se guarda `cliente_id_comuna` | Combo de comunas ya existe; SP retorna `id_region` también |

### Estados de presupuesto

```text
BORRADOR → ENVIADO → FACTURADO
                   → ANULADO
```

`sw_facturar` y `sw_mismo_cliente` se almacenan en tabla pero están ocultos en la vista.

---

### Tabla: `presupuesto_numeracion`

Correlativo por empresa. Insert atómico con `ON CONFLICT DO UPDATE`.

```sql
id_empresa    BIGINT  PK → empresas (CASCADE)
ultimo_numero INTEGER NOT NULL DEFAULT 0
```

---

### Tabla: `presupuestos`

Documento principal. IDs de modelo/comuna permiten reconstruir descripciones sin snapshot de texto.

```sql
id                      BIGINT GENERATED ALWAYS AS IDENTITY PK
id_empresa              BIGINT NOT NULL → empresas (RESTRICT)
numero                  INTEGER NOT NULL
folio                   VARCHAR(20) nullable        -- número en papel, no folio DTE
fecha_registro          DATE NOT NULL DEFAULT CURRENT_DATE
fecha_presupuesto       DATE NOT NULL DEFAULT CURRENT_DATE
fecha_vencimiento       DATE nullable
fecha_recepcion         DATE nullable
fecha_entrega           DATE nullable
estado                  VARCHAR(20) DEFAULT 'BORRADOR'
                          CHECK ('BORRADOR','ENVIADO','FACTURADO','ANULADO')

id_tipo_presupuesto     BIGINT → tipos_presupuesto (RESTRICT)

-- Vehículo (snapshot patente + soft FK + FK modelo)
id_vehiculo             BIGINT → vehiculos (RESTRICT)
patente                 VARCHAR(10)                 -- snapshot de vehiculos.ppu
id_modelo               BIGINT → modelos (RESTRICT) -- SP retorna también id_marca
anio                    SMALLINT
color                   VARCHAR(50)

-- Cliente (snapshot + soft FK)
id_cliente              BIGINT → contribuyentes (RESTRICT)
cliente_rut             VARCHAR(20)
cliente_nombre          VARCHAR(300)
cliente_giro            VARCHAR(300)
cliente_id_comuna       BIGINT → comunas (RESTRICT) -- SP retorna también cliente_id_region
cliente_direccion       VARCHAR(300)
cliente_email           VARCHAR(300)
cliente_telefono        VARCHAR(20)

-- Contribuyente receptor (snapshot + soft FK)
id_contribuyente        BIGINT → contribuyentes (RESTRICT)
contribuyente_rut       VARCHAR(20)
contribuyente_nombre    VARCHAR(300)
contribuyente_giro      VARCHAR(300)
contribuyente_id_comuna BIGINT → comunas (RESTRICT) -- SP retorna también contribuyente_id_region
contribuyente_direccion VARCHAR(300)

-- Totales
neto                    NUMERIC(14,2) DEFAULT 0
exento                  NUMERIC(14,2) DEFAULT 0
porcentaje_iva          NUMERIC(5,2)  DEFAULT 19.00
iva                     NUMERIC(14,2) DEFAULT 0
bruto                   NUMERIC(14,2) DEFAULT 0

-- Flags (ocultos en vista)
sw_facturar             BOOLEAN DEFAULT FALSE
sw_mismo_cliente        BOOLEAN DEFAULT TRUE

created_at / updated_at TIMESTAMPTZ

UNIQUE (id_empresa, numero)
```

---

### Tabla: `presupuesto_detalles`

Líneas del presupuesto. Hereda configuración `verCantidad/verValor/verTotal` desde `tipos_presupuesto_detalles`.

```sql
id              BIGINT GENERATED ALWAYS AS IDENTITY PK
id_presupuesto  BIGINT NOT NULL → presupuestos (CASCADE)
id_tipo_detalle BIGINT → tipos_presupuesto_detalles (RESTRICT)
orden           SMALLINT NOT NULL DEFAULT 1
descripcion     TEXT NOT NULL
sw_exento       BOOLEAN NOT NULL DEFAULT FALSE
cantidad        NUMERIC(10,2) NOT NULL DEFAULT 1
valor           NUMERIC(14,2) NOT NULL DEFAULT 0
total           NUMERIC(14,2) NOT NULL DEFAULT 0
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

---

### Tabla: `presupuesto_subtotales`

Subtotales agrupados por código (calculados y persistidos al guardar).

```sql
id               BIGINT GENERATED ALWAYS AS IDENTITY PK
id_presupuesto   BIGINT NOT NULL → presupuestos (CASCADE)
orden            SMALLINT NOT NULL DEFAULT 1
codigo_subtotal  VARCHAR(20) NOT NULL
nombre_subtotal  VARCHAR(100) NOT NULL
monto            NUMERIC(14,2) NOT NULL DEFAULT 0

UNIQUE (id_presupuesto, codigo_subtotal)
```

---

## Lógica de negocio — SP presupuestos

### Firma estándar de todos los SPs

```sql
CREATE OR REPLACE FUNCTION sp_nombre(
  p_opcion INTEGER,
  p_data   JSONB DEFAULT '{}'   -- ⚠️ siempre JSONB, nunca JSON
) RETURNS JSON AS $$
```

> **Crítico:** postgres.js envía parámetros JSON con OID 3802 (JSONB). Si el SP declara `p_data JSON`, PostgreSQL no resuelve el overload y lanza `function sp_nombre(integer, jsonb) does not exist`. Todos los SPs del proyecto usan `JSONB` en el parámetro y `JSON` en el retorno — respetar siempre esta firma.

---

### SP opciones

| # | Descripción |
| --- | ----------- |
| 1 | Lista por empresa (filtros: estado, fecha_desde, fecha_hasta) |
| 2 | Get by id (incluye detalles, subtotales, id_marca, id_region cliente/contribuyente) |
| 3 | Crear (correlativo atómico + upsert vehículo/cliente) |
| 4 | Actualizar |
| 5 | Eliminar (solo estado BORRADOR) |
| 6 | Lookup por patente (retorna vehículo + id_marca + último cliente asociado) |
| 7 | Lookup por RUT (retorna contribuyente + id_region) |
| 8 | Config tipo presupuesto (detalles para armar el form) |

### Upsert vehículo (opcion 3 — crear)

- Normalizar patente: `UPPER(REGEXP_REPLACE(..., '[^A-Z0-9]', '', 'g'))`
- Buscar en `vehiculos` por `ppu = patente`
- Si existe → actualizar `id_modelo`, `anio`, `color` + obtener `id`
- Si no existe → obtener `id_marca` desde `modelos WHERE id = id_modelo` → INSERT vehiculo
- `id_marca` es NOT NULL en `vehiculos`; si `id_modelo` es NULL no se crea el vehículo

### Upsert cliente/contribuyente (opcion 3 — crear)

- Normalizar RUT: `UPPER(REPLACE(REPLACE(rut, '.', ''), ' ', ''))`
- Buscar en `contribuyentes` por `rut`
- Si existe → actualizar campos secundarios + obtener `id`
- Si no existe → crear registro + obtener `id`
- Cambio de patente o RUT en el form = otro registro, no actualiza el existente

### Campos derivados retornados por el SP (no almacenados)

| Campo almacenado | Campos derivados retornados |
| ---------------- | --------------------------- |
| `id_modelo` | `modelo` (descripción), `id_marca`, `marca` (descripción) |
| `cliente_id_comuna` | `cliente_id_region` |
| `contribuyente_id_comuna` | `contribuyente_id_region` |

---

## Patrones frontend

### DetalleCaso (grid de detalles)

| Caso | verCantidad | verValor | verTotal | Comportamiento |
|------|------------|---------|---------|---------------|
| 1 | false | false | false | Solo descripción; subtotal directo editable |
| 2 | false | true | false | Valor por línea; cantidad=1 implícita |
| 3 | true | true | true | cantidad × valor = total |

### Mantenedor genérico

- `contextConfig.field` es el nombre del query param (genérico, no hardcodeado)
- Reset de estado hijo al cambiar contexto padre: `key={valorContexto}` en React
- Combo invalidation tras save Y delete: `queryClient.invalidateQueries({ queryKey: ['combo'] })`
- UX transiciones: `LoadingOverlay` (isFetching && !isLoading) + skeleton rows (isLoading)

---

## Pendientes acordados

| # | Tarea | Estado |
|---|-------|--------|
| A | DB: tablas presupuesto + sp_presupuestos en init.sql | ✅ Completo |
| B | Node API: módulo presupuestos (schema + routes + registro) | ✅ Completo |
| C | Next.js: rutas proxy /api/presupuestos/* | ✅ Completo |
| D | PresupuestoForm: integración completa con rutas reales | ✅ Completo |
| E | Lista presupuestos: migrar a react-query + LoadingOverlay/Skeleton | ✅ Completo |
| — | Segunda pasada: formato display RUT/patente via editor.normalize | Diferido |

---

## Plan de implementación B-E (detalle técnico)

### Orden de ejecución

```text
1. api/src/modules/presupuestos/presupuestos.schema.ts  (crear)
2. api/src/modules/presupuestos/presupuestos.routes.ts  (crear)
3. api/src/app.ts                                       (modificar — registrar ruta)
4. app/src/components/transaccion/types.ts              (modificar — IDs en VehiculoForm/ClienteForm)
5. app/src/components/transaccion/useTransaccion.ts     (modificar — lookups y config con id_empresa)
6. app/src/components/transaccion/PresupuestoForm.tsx   (modificar — combos con IDs, modal API real)
7. app/src/app/api/presupuestos/route.ts                (reemplazar mock)
8. app/src/app/api/presupuestos/[id]/route.ts           (reemplazar mock)
9. app/src/app/api/presupuestos/lookup/patente/route.ts (reemplazar mock)
10. app/src/app/api/presupuestos/lookup/rut/route.ts    (reemplazar mock)
11. app/src/app/api/tipos-presupuesto/[id]/config/route.ts (reemplazar mock, agregar id_empresa)
12. app/src/app/(auth)/presupuestos/lista/page.tsx      (migrar a react-query)
```

### Decisiones de diseño clave

#### Aplanado/reconstrucción del payload

El SP recibe y devuelve columnas planas. El Node API hace la traducción:

- Save (POST/PUT): recibe `PresupuestoPayload` (nested) → aplana a columnas planas → llama SP
- Load (GET /:id): SP devuelve fila plana → reconstruye `PresupuestoPayload` nested → envía al frontend
- Lista (GET /): SP devuelve filas planas → mapea a `PresupuestoListItem[]` → envía

#### VehiculoForm — IDs en lugar de texto

```typescript
// ANTES
VehiculoForm { patente, marca: string, modelo: string, anio, color }

// DESPUÉS
VehiculoForm { patente, id_marca: number|null, id_modelo: number|null, anio, color }
```

Los textos `marca` y `modelo` para display en la vista colapsada se obtienen desde los arrays de combos en el form.

#### ClienteForm / ContribuyenteForm — id_comuna en lugar de texto

```typescript
// ANTES
ClienteForm { rut, nombre, giro, comuna: string, direccion, email, telefono }

// DESPUÉS
ClienteForm { rut, nombre, giro, id_comuna: number|null, id_region: number|null, direccion, email, telefono }
```

#### Modal "Agregar marca/modelo"

Al confirmar el modal, llama inmediatamente:

1. `POST /api/marcas` si la marca no existe → obtiene `id_marca`
2. `POST /api/modelos` con `{ id_marca, descripcion }` → obtiene `id_modelo`
3. Setea `vehiculo.id_marca` y `vehiculo.id_modelo` en el estado del form

#### porcentaje_iva desde empresa

`onTipoPresupuestoChange` llama `/api/tipos-presupuesto/${idTipo}/config?id_empresa=${id_empresa}`.
El proxy inyecta `porcentaje_iva` desde la empresa antes de responder.
El SP opcion 8 no cambia — el proxy hace un segundo `apiFetch` a `/empresas/:id` para obtener el IVA.

#### Estados corregidos en el form

```typescript
// PresupuestoForm.tsx — ESTADOS array
const ESTADOS = [
  { value: 'BORRADOR',   label: 'Borrador'   },
  { value: 'ENVIADO',    label: 'Enviado'    },
  { value: 'FACTURADO',  label: 'Facturado'  },
  { value: 'ANULADO',    label: 'Anulado'    },
];
```

#### tipos-presupuesto combo con id_empresa

```typescript
// PresupuestoForm.tsx — recarga tipos con empresa
fetch(`/api/combos/tipos-presupuesto?id_empresa=${encabezado.id_empresa}`)
```

### Contratos de interfaz Node API ↔ DB

#### POST /api/presupuestos — payload esperado por el router (antes de aplanar)

```typescript
{
  encabezado: EncabezadoForm,  // con id_marca, id_modelo, id_comuna (IDs)
  detalles:   DetalleLinea[],
  subtotales: SubtotalItem[],
}
```

**SP opcion 3 recibe** (aplanado por el router):

```text
id_empresa, folio, fecha_registro, fecha_presupuesto, ...(fechas),
estado, id_tipo_presupuesto,
patente, id_modelo, anio, color,
cliente_rut, cliente_nombre, cliente_giro, cliente_id_comuna, cliente_direccion,
  cliente_email, cliente_telefono,
contribuyente_rut, contribuyente_nombre, ...,
neto, exento, porcentaje_iva, iva, bruto,
sw_facturar, sw_mismo_cliente,
detalles: JSON array,    ← el router inserta los detalles en presupuesto_detalles
subtotales: JSON array   ← el router inserta los subtotales en presupuesto_subtotales
```

> Nota: el SP opcion 3 solo inserta la cabecera y retorna el id. El router Node inserta detalles y subtotales en una transacción separada usando el id devuelto.

**SP opcion 2 devuelve** (reconstruido por el router):

```typescript
{
  encabezado: EncabezadoForm,   // reconstruido desde columnas planas
  detalles:   DetalleLinea[],   // ya anidados por el SP
  subtotales: SubtotalItem[],   // subtotales.monto → subtotales.subtotal
}
```
