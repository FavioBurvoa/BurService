# db/ — Schema y datos de Saga Ops

Carpeta independiente de `api/` con todo el SQL de la base de datos. Permite que el CI deploy de DB sea autónomo del deploy del API.

## Archivos

| Archivo | Cuándo se ejecuta | Cómo |
|---|---|---|
| `schema.sql` | **Cada deploy de `db/`** (CI automático) | `docker compose --profile migrate run --rm db-migrate` |
| `seed.sql` | **Solo bootstrap inicial** (manual) | `docker compose --profile seed run --rm db-seed` |

## Reglas de idempotencia para `schema.sql`

Todo lo que vaya acá DEBE ser ejecutable múltiples veces sin error. Usar:

| Necesidad | Forma idempotente |
|---|---|
| Crear tabla | `CREATE TABLE IF NOT EXISTS ...` |
| Crear índice | `CREATE INDEX IF NOT EXISTS ...` |
| Crear/actualizar función SP | `CREATE OR REPLACE FUNCTION sp_...` |
| Crear/actualizar trigger | `CREATE OR REPLACE TRIGGER trg_...` |
| Agregar columna | `ALTER TABLE x ADD COLUMN IF NOT EXISTS ...` (PG 9.6+) |
| Modificar columna | `DO $$ BEGIN ... ALTER TABLE ... ; EXCEPTION WHEN duplicate_column THEN NULL; END $$` |

### Cambios destructivos NO son idempotentes

- `DROP COLUMN`, `RENAME`, cambios de tipo: son operaciones de migración. Hoy se manejan **manualmente** vía `psql` antes de mergear el cambio.
- Si en el futuro crece la complejidad, considerar herramienta de migraciones (`Atlas`, `pg-migrate`, `Liquibase`).

## Reglas para `seed.sql`

- **Siempre** terminar cada `INSERT` con `ON CONFLICT (...) DO NOTHING` (o `DO UPDATE` si querés re-aplicar valores).
- Solo datos catálogo permanente (marcas, regiones, tipos DTE) y datos de ejemplo de desarrollo.
- **NO** poner aquí datos de producción (clientes reales, presupuestos): esos llegan vía la app, no por seed.

## Flujo en server nuevo

```bash
# 1. Levantar postgres (parte de infra)
docker compose -f docker-compose.infra.yml up -d postgres

# 2. Aplicar schema
docker compose --profile migrate run --rm db-migrate

# 3. Cargar catálogo inicial (1 sola vez)
docker compose --profile seed run --rm db-seed
```

Pasos 2-3 se documentan en [`DEPLOY.md`](../DEPLOY.md) como parte del bootstrap.

## Flujo en deploys siguientes

CI detecta cambios en `db/schema.sql` → ejecuta automáticamente paso 2.
**No** ejecuta seed (debería ser excepcional re-correrlo).

## Por qué desacoplar de `api/`

- API code y DB schema tienen **lifecycles independientes**: el schema cambia raramente, el código de la app diariamente.
- CI granular: cambios en `app/` no rebuild API, cambios en `db/` no rebuild app.
- DBA / DevOps puede iterar en `db/` sin conocer el código del API.
- Failure isolation: si el SQL falla, el API queda con schema viejo (recoverable), no se cae todo.
