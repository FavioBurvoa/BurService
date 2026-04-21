-- ============================================================================
-- init.sql — BUR-SERVICE
-- Generado desde db/00_init.sql → db/04_vehiculos.sql
-- Ejecutar en orden: función genérica → tablas → SPs → seed
-- ============================================================================

-- ============================================================================
-- 00: Función genérica para trigger updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 01: marcas
-- ============================================================================

CREATE TABLE IF NOT EXISTS marcas (
  id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo      VARCHAR(10)  NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  activo      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_marcas_codigo UNIQUE (codigo)
);

CREATE OR REPLACE TRIGGER trg_marcas_updated_at
  BEFORE UPDATE ON marcas
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE FUNCTION sp_marcas(
  p_opcion INTEGER,
  p_data   JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_id          BIGINT  := (p_data->>'id')::BIGINT;
  v_codigo      TEXT    := UPPER(NULLIF(TRIM(p_data->>'codigo'), ''));
  v_descripcion TEXT    := NULLIF(TRIM(p_data->>'descripcion'), '');
  v_activo      BOOLEAN := (p_data->>'activo')::BOOLEAN;
  v_id_nuevo    BIGINT;
  v_result      JSON;
BEGIN

  IF p_opcion = 1 THEN
    SELECT json_build_object(
      'message', 'Marcas obtenidas correctamente',
      'data',    COALESCE(json_agg(m ORDER BY m.descripcion), '[]'::json)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, activo, created_at, updated_at
      FROM marcas
    ) m;
    RETURN v_result;

  ELSIF p_opcion = 2 THEN
    SELECT json_build_object(
      'message', 'Marca obtenida correctamente',
      'data',    row_to_json(m.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, activo, created_at, updated_at
      FROM marcas WHERE id = v_id
    ) m;
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Marca con id % no encontrada', v_id;
    END IF;
    RETURN v_result;

  ELSIF p_opcion = 3 THEN
    INSERT INTO marcas (codigo, descripcion, activo)
    VALUES (v_codigo, v_descripcion, COALESCE(v_activo, TRUE))
    RETURNING id INTO v_id_nuevo;
    SELECT json_build_object(
      'message', 'Marca creada correctamente',
      'data',    row_to_json(m.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, activo, created_at, updated_at
      FROM marcas WHERE id = v_id_nuevo
    ) m;
    RETURN v_result;

  ELSIF p_opcion = 4 THEN
    UPDATE marcas SET
      codigo      = COALESCE(v_codigo,      codigo),
      descripcion = COALESCE(v_descripcion, descripcion),
      activo      = COALESCE(v_activo,      activo)
    WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Marca con id % no encontrada', v_id;
    END IF;
    SELECT json_build_object(
      'message', 'Marca actualizada correctamente',
      'data',    row_to_json(m.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, activo, created_at, updated_at
      FROM marcas WHERE id = v_id
    ) m;
    RETURN v_result;

  ELSIF p_opcion = 5 THEN
    DELETE FROM marcas WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Marca con id % no encontrada', v_id;
    END IF;
    RETURN json_build_object(
      'message', 'Marca eliminada correctamente',
      'data',    json_build_object('id', v_id)
    );

  ELSIF p_opcion = 7 THEN
    -- Resolver: recibe { rows: [...] } con filas crudas del archivo.
    -- Por cada fila: valida, busca match por codigo (UNIQUE) y retorna
    -- el modelo completo listo para guardar, con action = insert|update.
    DECLARE
      v_row      JSONB;
      v_idx      INTEGER := 0;
      v_out      JSONB   := '[]'::JSONB;
      v_errors   JSONB;
      v_existing BIGINT;
      v_f_codigo      TEXT;
      v_f_descripcion TEXT;
      v_f_activo      BOOLEAN;
      v_activo_raw    TEXT;
    BEGIN
      FOR v_row IN SELECT * FROM jsonb_array_elements(COALESCE(p_data->'rows', '[]'::jsonb))
      LOOP
        v_idx := v_idx + 1;
        v_errors := '[]'::JSONB;

        v_f_codigo      := UPPER(NULLIF(TRIM(v_row->>'codigo'), ''));
        v_f_descripcion := NULLIF(TRIM(v_row->>'descripcion'), '');
        v_activo_raw    := UPPER(TRIM(COALESCE(v_row->>'activo', '')));
        v_f_activo      := CASE
          WHEN v_activo_raw IN ('TRUE','T','1','VERDADERO','SI','SÍ','Y','YES') THEN TRUE
          WHEN v_activo_raw IN ('FALSE','F','0','FALSO','NO','N')               THEN FALSE
          ELSE TRUE
        END;

        IF v_f_codigo IS NULL THEN
          v_errors := v_errors || jsonb_build_object('field', 'codigo', 'detail', 'Código requerido');
        ELSIF LENGTH(v_f_codigo) > 10 THEN
          v_errors := v_errors || jsonb_build_object('field', 'codigo', 'detail', 'Código máx. 10 caracteres');
        END IF;

        IF v_f_descripcion IS NULL THEN
          v_errors := v_errors || jsonb_build_object('field', 'descripcion', 'detail', 'Descripción requerida');
        ELSIF LENGTH(v_f_descripcion) > 200 THEN
          v_errors := v_errors || jsonb_build_object('field', 'descripcion', 'detail', 'Descripción máx. 200 caracteres');
        END IF;

        v_existing := NULL;
        IF v_f_codigo IS NOT NULL THEN
          SELECT id INTO v_existing FROM marcas WHERE UPPER(codigo) = v_f_codigo;
        END IF;

        v_out := v_out || jsonb_build_object(
          'fila',   v_idx,
          'action', CASE WHEN v_existing IS NOT NULL THEN 'update' ELSE 'insert' END,
          'data',   jsonb_strip_nulls(jsonb_build_object(
            'id',          v_existing,
            'codigo',      v_f_codigo,
            'descripcion', v_f_descripcion,
            'activo',      v_f_activo
          )),
          'errors', CASE WHEN jsonb_array_length(v_errors) > 0 THEN v_errors ELSE NULL END
        );
      END LOOP;

      RETURN json_build_object(
        'message', 'Resolución completada',
        'data',    v_out
      );
    END;

  ELSE
    RAISE EXCEPTION 'Opción inválida: %', p_opcion;
  END IF;

END;
$$ LANGUAGE plpgsql;

INSERT INTO marcas (codigo, descripcion, activo) VALUES
  ('TOY', 'Toyota',    TRUE),
  ('HON', 'Honda',     TRUE),
  ('FOR', 'Ford',      TRUE),
  ('CHE', 'Chevrolet', TRUE),
  ('NIS', 'Nissan',    FALSE)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- 02: tipos_vehiculo
-- ============================================================================

CREATE TABLE IF NOT EXISTS tipos_vehiculo (
  id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo      VARCHAR(10)  NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  activo      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tipos_vehiculo_codigo UNIQUE (codigo)
);

CREATE OR REPLACE TRIGGER trg_tipos_vehiculo_updated_at
  BEFORE UPDATE ON tipos_vehiculo
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE FUNCTION sp_tipos_vehiculo(
  p_opcion INTEGER,
  p_data   JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_id          BIGINT  := (p_data->>'id')::BIGINT;
  v_codigo      TEXT    := NULLIF(TRIM(p_data->>'codigo'),      '');
  v_descripcion TEXT    := NULLIF(TRIM(p_data->>'descripcion'), '');
  v_activo      BOOLEAN := (p_data->>'activo')::BOOLEAN;
  v_id_nuevo    BIGINT;
  v_result      JSON;
BEGIN

  IF p_opcion = 1 THEN
    SELECT json_build_object(
      'message', 'Tipos de vehículo obtenidos correctamente',
      'data',    COALESCE(json_agg(t ORDER BY t.descripcion), '[]'::json)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, activo, created_at, updated_at
      FROM tipos_vehiculo
    ) t;
    RETURN v_result;

  ELSIF p_opcion = 2 THEN
    SELECT json_build_object(
      'message', 'Tipo de vehículo obtenido correctamente',
      'data',    row_to_json(t.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, activo, created_at, updated_at
      FROM tipos_vehiculo WHERE id = v_id
    ) t;
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Tipo de vehículo con id % no encontrado', v_id;
    END IF;
    RETURN v_result;

  ELSIF p_opcion = 3 THEN
    INSERT INTO tipos_vehiculo (codigo, descripcion, activo)
    VALUES (v_codigo, v_descripcion, COALESCE(v_activo, TRUE))
    RETURNING id INTO v_id_nuevo;
    SELECT json_build_object(
      'message', 'Tipo de vehículo creado correctamente',
      'data',    row_to_json(t.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, activo, created_at, updated_at
      FROM tipos_vehiculo WHERE id = v_id_nuevo
    ) t;
    RETURN v_result;

  ELSIF p_opcion = 4 THEN
    UPDATE tipos_vehiculo SET
      codigo      = COALESCE(v_codigo,      codigo),
      descripcion = COALESCE(v_descripcion, descripcion),
      activo      = COALESCE(v_activo,      activo)
    WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Tipo de vehículo con id % no encontrado', v_id;
    END IF;
    SELECT json_build_object(
      'message', 'Tipo de vehículo actualizado correctamente',
      'data',    row_to_json(t.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, activo, created_at, updated_at
      FROM tipos_vehiculo WHERE id = v_id
    ) t;
    RETURN v_result;

  ELSIF p_opcion = 5 THEN
    DELETE FROM tipos_vehiculo WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Tipo de vehículo con id % no encontrado', v_id;
    END IF;
    RETURN json_build_object(
      'message', 'Tipo de vehículo eliminado correctamente',
      'data',    json_build_object('id', v_id)
    );

  ELSE
    RAISE EXCEPTION 'Opción inválida: %', p_opcion;
  END IF;

END;
$$ LANGUAGE plpgsql;

INSERT INTO tipos_vehiculo (codigo, descripcion, activo) VALUES
  ('SED', 'Sedán',       TRUE),
  ('SUV', 'SUV',         TRUE),
  ('PIC', 'Pickup',      TRUE),
  ('HAT', 'Hatchback',   TRUE),
  ('VAN', 'Van',         TRUE),
  ('MOT', 'Motocicleta', FALSE)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- 03: modelos  (FK → marcas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS modelos (
  id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo      VARCHAR(10)  NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  id_marca    BIGINT       NOT NULL REFERENCES marcas(id) ON DELETE RESTRICT,
  activo      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_modelos_codigo_marca UNIQUE (codigo, id_marca)
);

CREATE INDEX IF NOT EXISTS idx_modelos_id_marca ON modelos(id_marca);

CREATE OR REPLACE TRIGGER trg_modelos_updated_at
  BEFORE UPDATE ON modelos
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE FUNCTION sp_modelos(
  p_opcion INTEGER,
  p_data   JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_id          BIGINT  := (p_data->>'id')::BIGINT;
  v_codigo      TEXT    := NULLIF(TRIM(p_data->>'codigo'),      '');
  v_descripcion TEXT    := NULLIF(TRIM(p_data->>'descripcion'), '');
  v_id_marca    BIGINT  := NULLIF((p_data->>'id_marca')::BIGINT, 0);
  v_activo      BOOLEAN := (p_data->>'activo')::BOOLEAN;
  v_id_nuevo    BIGINT;
  v_result      JSON;
BEGIN

  IF p_opcion = 1 THEN
    SELECT json_build_object(
      'message', 'Modelos obtenidos correctamente',
      'data',    COALESCE(json_agg(m ORDER BY m.descripcion), '[]'::json)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, id_marca, activo, created_at, updated_at
      FROM modelos
      WHERE (v_id_marca IS NULL OR id_marca = v_id_marca)
    ) m;
    RETURN v_result;

  ELSIF p_opcion = 2 THEN
    SELECT json_build_object(
      'message', 'Modelo obtenido correctamente',
      'data',    row_to_json(m.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, id_marca, activo, created_at, updated_at
      FROM modelos WHERE id = v_id
    ) m;
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Modelo con id % no encontrado', v_id;
    END IF;
    RETURN v_result;

  ELSIF p_opcion = 3 THEN
    INSERT INTO modelos (codigo, descripcion, id_marca, activo)
    VALUES (v_codigo, v_descripcion, v_id_marca, COALESCE(v_activo, TRUE))
    RETURNING id INTO v_id_nuevo;
    SELECT json_build_object(
      'message', 'Modelo creado correctamente',
      'data',    row_to_json(m.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, id_marca, activo, created_at, updated_at
      FROM modelos WHERE id = v_id_nuevo
    ) m;
    RETURN v_result;

  ELSIF p_opcion = 4 THEN
    UPDATE modelos SET
      codigo      = COALESCE(v_codigo,      codigo),
      descripcion = COALESCE(v_descripcion, descripcion),
      id_marca    = COALESCE(v_id_marca,    id_marca),
      activo      = COALESCE(v_activo,      activo)
    WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Modelo con id % no encontrado', v_id;
    END IF;
    SELECT json_build_object(
      'message', 'Modelo actualizado correctamente',
      'data',    row_to_json(m.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, id_marca, activo, created_at, updated_at
      FROM modelos WHERE id = v_id
    ) m;
    RETURN v_result;

  ELSIF p_opcion = 5 THEN
    DELETE FROM modelos WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Modelo con id % no encontrado', v_id;
    END IF;
    RETURN json_build_object(
      'message', 'Modelo eliminado correctamente',
      'data',    json_build_object('id', v_id)
    );

  ELSE
    RAISE EXCEPTION 'Opción inválida: %', p_opcion;
  END IF;

END;
$$ LANGUAGE plpgsql;

INSERT INTO modelos (codigo, descripcion, id_marca, activo)
SELECT 'COR', 'Corolla',   id, TRUE  FROM marcas WHERE codigo = 'TOY' ON CONFLICT (codigo, id_marca) DO NOTHING;
INSERT INTO modelos (codigo, descripcion, id_marca, activo)
SELECT 'RAV', 'RAV4',      id, TRUE  FROM marcas WHERE codigo = 'TOY' ON CONFLICT (codigo, id_marca) DO NOTHING;
INSERT INTO modelos (codigo, descripcion, id_marca, activo)
SELECT 'HIL', 'Hilux',     id, TRUE  FROM marcas WHERE codigo = 'TOY' ON CONFLICT (codigo, id_marca) DO NOTHING;
INSERT INTO modelos (codigo, descripcion, id_marca, activo)
SELECT 'CIV', 'Civic',     id, TRUE  FROM marcas WHERE codigo = 'HON' ON CONFLICT (codigo, id_marca) DO NOTHING;
INSERT INTO modelos (codigo, descripcion, id_marca, activo)
SELECT 'CRV', 'CR-V',      id, TRUE  FROM marcas WHERE codigo = 'HON' ON CONFLICT (codigo, id_marca) DO NOTHING;
INSERT INTO modelos (codigo, descripcion, id_marca, activo)
SELECT 'F15', 'F-150',     id, TRUE  FROM marcas WHERE codigo = 'FOR' ON CONFLICT (codigo, id_marca) DO NOTHING;
INSERT INTO modelos (codigo, descripcion, id_marca, activo)
SELECT 'MUS', 'Mustang',   id, FALSE FROM marcas WHERE codigo = 'FOR' ON CONFLICT (codigo, id_marca) DO NOTHING;
INSERT INTO modelos (codigo, descripcion, id_marca, activo)
SELECT 'SIL', 'Silverado', id, TRUE  FROM marcas WHERE codigo = 'CHE' ON CONFLICT (codigo, id_marca) DO NOTHING;
INSERT INTO modelos (codigo, descripcion, id_marca, activo)
SELECT 'CAM', 'Camaro',    id, TRUE  FROM marcas WHERE codigo = 'CHE' ON CONFLICT (codigo, id_marca) DO NOTHING;
INSERT INTO modelos (codigo, descripcion, id_marca, activo)
SELECT 'ALT', 'Altima',    id, TRUE  FROM marcas WHERE codigo = 'NIS' ON CONFLICT (codigo, id_marca) DO NOTHING;

-- ============================================================================
-- 04: vehiculos  (FK → marcas, modelos, tipos_vehiculo)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehiculos (
  id               BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ppu              VARCHAR(10) NOT NULL,
  id_marca         BIGINT      NOT NULL REFERENCES marcas(id)         ON DELETE RESTRICT,
  id_modelo        BIGINT      NOT NULL REFERENCES modelos(id)        ON DELETE RESTRICT,
  anio             SMALLINT,
  color            VARCHAR(50),
  id_tipo_vehiculo BIGINT               REFERENCES tipos_vehiculo(id) ON DELETE RESTRICT,
  activo           BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_vehiculos_ppu UNIQUE (ppu)
);

CREATE INDEX IF NOT EXISTS idx_vehiculos_id_marca         ON vehiculos(id_marca);
CREATE INDEX IF NOT EXISTS idx_vehiculos_id_modelo        ON vehiculos(id_modelo);
CREATE INDEX IF NOT EXISTS idx_vehiculos_id_tipo_vehiculo ON vehiculos(id_tipo_vehiculo);

CREATE OR REPLACE TRIGGER trg_vehiculos_updated_at
  BEFORE UPDATE ON vehiculos
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE FUNCTION sp_vehiculos(
  p_opcion INTEGER,
  p_data   JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_id               BIGINT   := (p_data->>'id')::BIGINT;
  v_ppu              TEXT     := NULLIF(TRIM(p_data->>'ppu'), '');
  v_id_marca         BIGINT   := NULLIF((p_data->>'id_marca')::BIGINT,   0);
  v_id_modelo        BIGINT   := NULLIF((p_data->>'id_modelo')::BIGINT,  0);
  v_anio             SMALLINT := (p_data->>'anio')::SMALLINT;
  v_color            TEXT     := NULLIF(TRIM(p_data->>'color'), '');
  v_id_tipo_vehiculo BIGINT   := NULLIF((p_data->>'id_tipo_vehiculo')::BIGINT, 0);
  v_activo           BOOLEAN  := (p_data->>'activo')::BOOLEAN;
  v_id_nuevo         BIGINT;
  v_result           JSON;
BEGIN

  IF p_opcion = 1 THEN
    SELECT json_build_object(
      'message', 'Vehículos obtenidos correctamente',
      'data',    COALESCE(json_agg(v ORDER BY v.ppu), '[]'::json)
    ) INTO v_result
    FROM (
      SELECT id, ppu, id_marca, id_modelo, anio, color,
             id_tipo_vehiculo, activo, created_at, updated_at
      FROM vehiculos
    ) v;
    RETURN v_result;

  ELSIF p_opcion = 2 THEN
    SELECT json_build_object(
      'message', 'Vehículo obtenido correctamente',
      'data',    row_to_json(v.*)
    ) INTO v_result
    FROM (
      SELECT id, ppu, id_marca, id_modelo, anio, color,
             id_tipo_vehiculo, activo, created_at, updated_at
      FROM vehiculos WHERE id = v_id
    ) v;
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Vehículo con id % no encontrado', v_id;
    END IF;
    RETURN v_result;

  ELSIF p_opcion = 3 THEN
    INSERT INTO vehiculos (ppu, id_marca, id_modelo, anio, color, id_tipo_vehiculo, activo)
    VALUES (v_ppu, v_id_marca, v_id_modelo, v_anio, v_color, v_id_tipo_vehiculo,
            COALESCE(v_activo, TRUE))
    RETURNING id INTO v_id_nuevo;
    SELECT json_build_object(
      'message', 'Vehículo creado correctamente',
      'data',    row_to_json(v.*)
    ) INTO v_result
    FROM (
      SELECT id, ppu, id_marca, id_modelo, anio, color,
             id_tipo_vehiculo, activo, created_at, updated_at
      FROM vehiculos WHERE id = v_id_nuevo
    ) v;
    RETURN v_result;

  -- ppu NUNCA se actualiza
  ELSIF p_opcion = 4 THEN
    UPDATE vehiculos SET
      id_marca         = COALESCE(v_id_marca,  id_marca),
      id_modelo        = COALESCE(v_id_modelo, id_modelo),
      anio             = CASE WHEN p_data ? 'anio'
                              THEN v_anio             ELSE anio             END,
      color            = CASE WHEN p_data ? 'color'
                              THEN v_color            ELSE color            END,
      id_tipo_vehiculo = CASE WHEN p_data ? 'id_tipo_vehiculo'
                              THEN v_id_tipo_vehiculo ELSE id_tipo_vehiculo END,
      activo           = COALESCE(v_activo, activo)
    WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Vehículo con id % no encontrado', v_id;
    END IF;
    SELECT json_build_object(
      'message', 'Vehículo actualizado correctamente',
      'data',    row_to_json(v.*)
    ) INTO v_result
    FROM (
      SELECT id, ppu, id_marca, id_modelo, anio, color,
             id_tipo_vehiculo, activo, created_at, updated_at
      FROM vehiculos WHERE id = v_id
    ) v;
    RETURN v_result;

  ELSIF p_opcion = 5 THEN
    DELETE FROM vehiculos WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Vehículo con id % no encontrado', v_id;
    END IF;
    RETURN json_build_object(
      'message', 'Vehículo eliminado correctamente',
      'data',    json_build_object('id', v_id)
    );

  ELSE
    RAISE EXCEPTION 'Opción inválida: %', p_opcion;
  END IF;

END;
$$ LANGUAGE plpgsql;

INSERT INTO vehiculos (ppu, id_marca, id_modelo, anio, color, id_tipo_vehiculo, activo)
SELECT 'ABCD12', ma.id, mo.id, 2020, 'Rojo',   tv.id, TRUE
FROM   marcas ma, modelos mo, tipos_vehiculo tv
WHERE  ma.codigo = 'TOY' AND mo.codigo = 'COR' AND mo.id_marca = ma.id AND tv.codigo = 'SED'
ON CONFLICT (ppu) DO NOTHING;

INSERT INTO vehiculos (ppu, id_marca, id_modelo, anio, color, id_tipo_vehiculo, activo)
SELECT 'EFGH34', ma.id, mo.id, 2021, 'Azul',   tv.id, TRUE
FROM   marcas ma, modelos mo, tipos_vehiculo tv
WHERE  ma.codigo = 'HON' AND mo.codigo = 'CIV' AND mo.id_marca = ma.id AND tv.codigo = 'SUV'
ON CONFLICT (ppu) DO NOTHING;

INSERT INTO vehiculos (ppu, id_marca, id_modelo, anio, color, id_tipo_vehiculo, activo)
SELECT 'IJKL56', ma.id, mo.id, 2019, 'Negro',  tv.id, FALSE
FROM   marcas ma, modelos mo, tipos_vehiculo tv
WHERE  ma.codigo = 'TOY' AND mo.codigo = 'RAV' AND mo.id_marca = ma.id AND tv.codigo = 'SUV'
ON CONFLICT (ppu) DO NOTHING;

INSERT INTO vehiculos (ppu, id_marca, id_modelo, anio, color, id_tipo_vehiculo, activo)
SELECT 'MNOP78', ma.id, mo.id, NULL, 'Blanco', NULL, TRUE
FROM   marcas ma, modelos mo
WHERE  ma.codigo = 'FOR' AND mo.codigo = 'F15' AND mo.id_marca = ma.id
ON CONFLICT (ppu) DO NOTHING;

-- ============================================================================
-- 05: regiones  (global — sin FK)
-- ============================================================================

CREATE TABLE IF NOT EXISTS regiones (
  id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo      VARCHAR(10)  NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  orden       SMALLINT     NOT NULL DEFAULT 0,
  codigo_sii  VARCHAR(10),
  activo      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_regiones_codigo UNIQUE (codigo)
);

CREATE OR REPLACE TRIGGER trg_regiones_updated_at
  BEFORE UPDATE ON regiones
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE FUNCTION sp_regiones(
  p_opcion INTEGER,
  p_data   JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_id          BIGINT   := (p_data->>'id')::BIGINT;
  v_codigo      TEXT     := NULLIF(TRIM(p_data->>'codigo'),      '');
  v_descripcion TEXT     := NULLIF(TRIM(p_data->>'descripcion'), '');
  v_orden       SMALLINT := (p_data->>'orden')::SMALLINT;
  v_codigo_sii  TEXT     := NULLIF(TRIM(p_data->>'codigo_sii'),  '');
  v_activo      BOOLEAN  := (p_data->>'activo')::BOOLEAN;
  v_id_nuevo    BIGINT;
  v_result      JSON;
BEGIN

  IF p_opcion = 1 THEN
    SELECT json_build_object(
      'message', 'Regiones obtenidas correctamente',
      'data',    COALESCE(json_agg(r ORDER BY r.orden), '[]'::json)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, orden, codigo_sii, activo, created_at, updated_at
      FROM regiones
    ) r;
    RETURN v_result;

  ELSIF p_opcion = 2 THEN
    SELECT json_build_object(
      'message', 'Región obtenida correctamente',
      'data',    row_to_json(r.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, orden, codigo_sii, activo, created_at, updated_at
      FROM regiones WHERE id = v_id
    ) r;
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Región con id % no encontrada', v_id;
    END IF;
    RETURN v_result;

  ELSIF p_opcion = 3 THEN
    INSERT INTO regiones (codigo, descripcion, orden, codigo_sii, activo)
    VALUES (v_codigo, v_descripcion, COALESCE(v_orden, 0), v_codigo_sii, COALESCE(v_activo, TRUE))
    RETURNING id INTO v_id_nuevo;
    SELECT json_build_object(
      'message', 'Región creada correctamente',
      'data',    row_to_json(r.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, orden, codigo_sii, activo, created_at, updated_at
      FROM regiones WHERE id = v_id_nuevo
    ) r;
    RETURN v_result;

  ELSIF p_opcion = 4 THEN
    UPDATE regiones SET
      codigo      = COALESCE(v_codigo,      codigo),
      descripcion = COALESCE(v_descripcion, descripcion),
      orden       = COALESCE(v_orden,       orden),
      codigo_sii  = CASE WHEN p_data ? 'codigo_sii' THEN v_codigo_sii ELSE codigo_sii END,
      activo      = COALESCE(v_activo,      activo)
    WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Región con id % no encontrada', v_id;
    END IF;
    SELECT json_build_object(
      'message', 'Región actualizada correctamente',
      'data',    row_to_json(r.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, orden, codigo_sii, activo, created_at, updated_at
      FROM regiones WHERE id = v_id
    ) r;
    RETURN v_result;

  ELSIF p_opcion = 5 THEN
    DELETE FROM regiones WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Región con id % no encontrada', v_id;
    END IF;
    RETURN json_build_object(
      'message', 'Región eliminada correctamente',
      'data',    json_build_object('id', v_id)
    );

  ELSE
    RAISE EXCEPTION 'Opción inválida: %', p_opcion;
  END IF;

END;
$$ LANGUAGE plpgsql;

INSERT INTO regiones (codigo, descripcion, orden, codigo_sii, activo) VALUES
  ('XV',   'Arica y Parinacota',                   1,  '15', TRUE),
  ('I',    'Tarapacá',                              2,  '01', TRUE),
  ('II',   'Antofagasta',                           3,  '02', TRUE),
  ('III',  'Atacama',                               4,  '03', TRUE),
  ('IV',   'Coquimbo',                              5,  '04', TRUE),
  ('V',    'Valparaíso',                            6,  '05', TRUE),
  ('RM',   'Metropolitana de Santiago',             7,  '13', TRUE),
  ('VI',   'Libertador General B. O''Higgins',      8,  '06', TRUE),
  ('VII',  'Maule',                                 9,  '07', TRUE),
  ('XVI',  'Ñuble',                                 10, '16', TRUE),
  ('VIII', 'Biobío',                                11, '08', TRUE),
  ('IX',   'La Araucanía',                          12, '09', TRUE),
  ('XIV',  'Los Ríos',                              13, '14', TRUE),
  ('X',    'Los Lagos',                             14, '10', TRUE),
  ('XI',   'Aysén del General C. Ibáñez',           15, '11', TRUE),
  ('XII',  'Magallanes y la Antártica Chilena',     16, '12', TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- 06: tipos_contribuyente  (global — sin FK)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tipos_contribuyente (
  id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo      VARCHAR(10)  NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  sw_factura  BOOLEAN      NOT NULL DEFAULT FALSE,
  activo      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tipos_contribuyente_codigo UNIQUE (codigo)
);

CREATE OR REPLACE TRIGGER trg_tipos_contribuyente_updated_at
  BEFORE UPDATE ON tipos_contribuyente
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE FUNCTION sp_tipos_contribuyente(
  p_opcion INTEGER,
  p_data   JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_id          BIGINT  := (p_data->>'id')::BIGINT;
  v_codigo      TEXT    := NULLIF(TRIM(p_data->>'codigo'),      '');
  v_descripcion TEXT    := NULLIF(TRIM(p_data->>'descripcion'), '');
  v_sw_factura  BOOLEAN := (p_data->>'sw_factura')::BOOLEAN;
  v_activo      BOOLEAN := (p_data->>'activo')::BOOLEAN;
  v_id_nuevo    BIGINT;
  v_result      JSON;
BEGIN

  IF p_opcion = 1 THEN
    SELECT json_build_object(
      'message', 'Tipos de contribuyente obtenidos correctamente',
      'data',    COALESCE(json_agg(t ORDER BY t.descripcion), '[]'::json)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, sw_factura, activo, created_at, updated_at
      FROM tipos_contribuyente
    ) t;
    RETURN v_result;

  ELSIF p_opcion = 2 THEN
    SELECT json_build_object(
      'message', 'Tipo de contribuyente obtenido correctamente',
      'data',    row_to_json(t.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, sw_factura, activo, created_at, updated_at
      FROM tipos_contribuyente WHERE id = v_id
    ) t;
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Tipo de contribuyente con id % no encontrado', v_id;
    END IF;
    RETURN v_result;

  ELSIF p_opcion = 3 THEN
    INSERT INTO tipos_contribuyente (codigo, descripcion, sw_factura, activo)
    VALUES (v_codigo, v_descripcion, COALESCE(v_sw_factura, FALSE), COALESCE(v_activo, TRUE))
    RETURNING id INTO v_id_nuevo;
    SELECT json_build_object(
      'message', 'Tipo de contribuyente creado correctamente',
      'data',    row_to_json(t.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, sw_factura, activo, created_at, updated_at
      FROM tipos_contribuyente WHERE id = v_id_nuevo
    ) t;
    RETURN v_result;

  ELSIF p_opcion = 4 THEN
    UPDATE tipos_contribuyente SET
      codigo      = COALESCE(v_codigo,      codigo),
      descripcion = COALESCE(v_descripcion, descripcion),
      sw_factura  = COALESCE(v_sw_factura,  sw_factura),
      activo      = COALESCE(v_activo,      activo)
    WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Tipo de contribuyente con id % no encontrado', v_id;
    END IF;
    SELECT json_build_object(
      'message', 'Tipo de contribuyente actualizado correctamente',
      'data',    row_to_json(t.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, sw_factura, activo, created_at, updated_at
      FROM tipos_contribuyente WHERE id = v_id
    ) t;
    RETURN v_result;

  ELSIF p_opcion = 5 THEN
    DELETE FROM tipos_contribuyente WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Tipo de contribuyente con id % no encontrado', v_id;
    END IF;
    RETURN json_build_object(
      'message', 'Tipo de contribuyente eliminado correctamente',
      'data',    json_build_object('id', v_id)
    );

  ELSE
    RAISE EXCEPTION 'Opción inválida: %', p_opcion;
  END IF;

END;
$$ LANGUAGE plpgsql;

INSERT INTO tipos_contribuyente (codigo, descripcion, sw_factura, activo) VALUES
  ('EMP', 'Empresa',         TRUE,  TRUE),
  ('PNP', 'Persona Natural', FALSE, TRUE),
  ('CSP', 'Sin Personalidad',FALSE, TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- 07: tipos_dte  (global — catálogo SII)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tipos_dte (
  id             BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo         INTEGER      NOT NULL,
  descripcion    VARCHAR(200) NOT NULL,
  sw_afecto      BOOLEAN      NOT NULL DEFAULT FALSE,
  sw_exento      BOOLEAN      NOT NULL DEFAULT FALSE,
  sw_electronico BOOLEAN      NOT NULL DEFAULT TRUE,
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tipos_dte_codigo UNIQUE (codigo)
);

CREATE OR REPLACE TRIGGER trg_tipos_dte_updated_at
  BEFORE UPDATE ON tipos_dte
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE FUNCTION sp_tipos_dte(
  p_opcion INTEGER,
  p_data   JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_id             BIGINT  := (p_data->>'id')::BIGINT;
  v_codigo         INTEGER := (p_data->>'codigo')::INTEGER;
  v_descripcion    TEXT    := NULLIF(TRIM(p_data->>'descripcion'),    '');
  v_sw_afecto      BOOLEAN := (p_data->>'sw_afecto')::BOOLEAN;
  v_sw_exento      BOOLEAN := (p_data->>'sw_exento')::BOOLEAN;
  v_sw_electronico BOOLEAN := (p_data->>'sw_electronico')::BOOLEAN;
  v_activo         BOOLEAN := (p_data->>'activo')::BOOLEAN;
  v_id_nuevo       BIGINT;
  v_result         JSON;
BEGIN

  IF p_opcion = 1 THEN
    SELECT json_build_object(
      'message', 'Tipos DTE obtenidos correctamente',
      'data',    COALESCE(json_agg(t ORDER BY t.codigo), '[]'::json)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, sw_afecto, sw_exento, sw_electronico,
             activo, created_at, updated_at
      FROM tipos_dte
    ) t;
    RETURN v_result;

  ELSIF p_opcion = 2 THEN
    SELECT json_build_object(
      'message', 'Tipo DTE obtenido correctamente',
      'data',    row_to_json(t.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, sw_afecto, sw_exento, sw_electronico,
             activo, created_at, updated_at
      FROM tipos_dte WHERE id = v_id
    ) t;
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Tipo DTE con id % no encontrado', v_id;
    END IF;
    RETURN v_result;

  ELSIF p_opcion = 3 THEN
    INSERT INTO tipos_dte (codigo, descripcion, sw_afecto, sw_exento, sw_electronico, activo)
    VALUES (v_codigo, v_descripcion,
            COALESCE(v_sw_afecto, FALSE), COALESCE(v_sw_exento, FALSE),
            COALESCE(v_sw_electronico, TRUE), COALESCE(v_activo, TRUE))
    RETURNING id INTO v_id_nuevo;
    SELECT json_build_object(
      'message', 'Tipo DTE creado correctamente',
      'data',    row_to_json(t.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, sw_afecto, sw_exento, sw_electronico,
             activo, created_at, updated_at
      FROM tipos_dte WHERE id = v_id_nuevo
    ) t;
    RETURN v_result;

  ELSIF p_opcion = 4 THEN
    UPDATE tipos_dte SET
      codigo         = COALESCE(v_codigo,         codigo),
      descripcion    = COALESCE(v_descripcion,    descripcion),
      sw_afecto      = COALESCE(v_sw_afecto,      sw_afecto),
      sw_exento      = COALESCE(v_sw_exento,      sw_exento),
      sw_electronico = COALESCE(v_sw_electronico, sw_electronico),
      activo         = COALESCE(v_activo,         activo)
    WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Tipo DTE con id % no encontrado', v_id;
    END IF;
    SELECT json_build_object(
      'message', 'Tipo DTE actualizado correctamente',
      'data',    row_to_json(t.*)
    ) INTO v_result
    FROM (
      SELECT id, codigo, descripcion, sw_afecto, sw_exento, sw_electronico,
             activo, created_at, updated_at
      FROM tipos_dte WHERE id = v_id
    ) t;
    RETURN v_result;

  ELSIF p_opcion = 5 THEN
    DELETE FROM tipos_dte WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Tipo DTE con id % no encontrado', v_id;
    END IF;
    RETURN json_build_object(
      'message', 'Tipo DTE eliminado correctamente',
      'data',    json_build_object('id', v_id)
    );

  ELSE
    RAISE EXCEPTION 'Opción inválida: %', p_opcion;
  END IF;

END;
$$ LANGUAGE plpgsql;

INSERT INTO tipos_dte (codigo, descripcion, sw_afecto, sw_exento, sw_electronico, activo) VALUES
  (33, 'Factura Electrónica',                    TRUE,  FALSE, TRUE, TRUE),
  (34, 'Factura No Afecta o Exenta Electrónica', FALSE, TRUE,  TRUE, TRUE),
  (39, 'Boleta Electrónica',                     TRUE,  FALSE, TRUE, TRUE),
  (41, 'Boleta No Afecta o Exenta Electrónica',  FALSE, TRUE,  TRUE, TRUE),
  (52, 'Guía de Despacho Electrónica',           FALSE, FALSE, TRUE, TRUE),
  (56, 'Nota de Débito Electrónica',             FALSE, FALSE, TRUE, TRUE),
  (61, 'Nota de Crédito Electrónica',            FALSE, FALSE, TRUE, TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- 08: comunas  (FK → regiones)
-- ============================================================================

CREATE TABLE IF NOT EXISTS comunas (
  id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_region   BIGINT       NOT NULL REFERENCES regiones(id) ON DELETE RESTRICT,
  codigo      VARCHAR(10)  NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  orden       SMALLINT     NOT NULL DEFAULT 0,
  codigo_sii  VARCHAR(10),
  activo      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_comunas_codigo UNIQUE (codigo)
);

CREATE INDEX IF NOT EXISTS idx_comunas_id_region ON comunas(id_region);

CREATE OR REPLACE TRIGGER trg_comunas_updated_at
  BEFORE UPDATE ON comunas
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE FUNCTION sp_comunas(
  p_opcion INTEGER,
  p_data   JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_id          BIGINT   := (p_data->>'id')::BIGINT;
  v_id_region   BIGINT   := NULLIF((p_data->>'id_region')::BIGINT, 0);
  v_codigo      TEXT     := NULLIF(TRIM(p_data->>'codigo'),      '');
  v_descripcion TEXT     := NULLIF(TRIM(p_data->>'descripcion'), '');
  v_orden       SMALLINT := (p_data->>'orden')::SMALLINT;
  v_codigo_sii  TEXT     := NULLIF(TRIM(p_data->>'codigo_sii'),  '');
  v_activo      BOOLEAN  := (p_data->>'activo')::BOOLEAN;
  v_id_nuevo    BIGINT;
  v_result      JSON;
BEGIN

  IF p_opcion = 1 THEN
    SELECT json_build_object(
      'message', 'Comunas obtenidas correctamente',
      'data',    COALESCE(json_agg(c ORDER BY c.descripcion), '[]'::json)
    ) INTO v_result
    FROM (
      SELECT id, id_region, codigo, descripcion, orden, codigo_sii,
             activo, created_at, updated_at
      FROM comunas
      WHERE (v_id_region IS NULL OR id_region = v_id_region)
    ) c;
    RETURN v_result;

  ELSIF p_opcion = 2 THEN
    SELECT json_build_object(
      'message', 'Comuna obtenida correctamente',
      'data',    row_to_json(c.*)
    ) INTO v_result
    FROM (
      SELECT id, id_region, codigo, descripcion, orden, codigo_sii,
             activo, created_at, updated_at
      FROM comunas WHERE id = v_id
    ) c;
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Comuna con id % no encontrada', v_id;
    END IF;
    RETURN v_result;

  ELSIF p_opcion = 3 THEN
    INSERT INTO comunas (id_region, codigo, descripcion, orden, codigo_sii, activo)
    VALUES (v_id_region, v_codigo, v_descripcion, COALESCE(v_orden, 0),
            v_codigo_sii, COALESCE(v_activo, TRUE))
    RETURNING id INTO v_id_nuevo;
    SELECT json_build_object(
      'message', 'Comuna creada correctamente',
      'data',    row_to_json(c.*)
    ) INTO v_result
    FROM (
      SELECT id, id_region, codigo, descripcion, orden, codigo_sii,
             activo, created_at, updated_at
      FROM comunas WHERE id = v_id_nuevo
    ) c;
    RETURN v_result;

  ELSIF p_opcion = 4 THEN
    UPDATE comunas SET
      id_region   = COALESCE(v_id_region,   id_region),
      codigo      = COALESCE(v_codigo,      codigo),
      descripcion = COALESCE(v_descripcion, descripcion),
      orden       = COALESCE(v_orden,       orden),
      codigo_sii  = CASE WHEN p_data ? 'codigo_sii' THEN v_codigo_sii ELSE codigo_sii END,
      activo      = COALESCE(v_activo,      activo)
    WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Comuna con id % no encontrada', v_id;
    END IF;
    SELECT json_build_object(
      'message', 'Comuna actualizada correctamente',
      'data',    row_to_json(c.*)
    ) INTO v_result
    FROM (
      SELECT id, id_region, codigo, descripcion, orden, codigo_sii,
             activo, created_at, updated_at
      FROM comunas WHERE id = v_id
    ) c;
    RETURN v_result;

  ELSIF p_opcion = 5 THEN
    DELETE FROM comunas WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Comuna con id % no encontrada', v_id;
    END IF;
    RETURN json_build_object(
      'message', 'Comuna eliminada correctamente',
      'data',    json_build_object('id', v_id)
    );

  ELSE
    RAISE EXCEPTION 'Opción inválida: %', p_opcion;
  END IF;

END;
$$ LANGUAGE plpgsql;

INSERT INTO comunas (id_region, codigo, descripcion, orden, codigo_sii, activo)
SELECT r.id, 'SCL',  'Santiago',    1, '13101', TRUE FROM regiones r WHERE r.codigo = 'RM' ON CONFLICT (codigo) DO NOTHING;
INSERT INTO comunas (id_region, codigo, descripcion, orden, codigo_sii, activo)
SELECT r.id, 'PROV', 'Providencia', 2, '13123', TRUE FROM regiones r WHERE r.codigo = 'RM' ON CONFLICT (codigo) DO NOTHING;
INSERT INTO comunas (id_region, codigo, descripcion, orden, codigo_sii, activo)
SELECT r.id, 'LAS',  'Las Condes',  3, '13114', TRUE FROM regiones r WHERE r.codigo = 'RM' ON CONFLICT (codigo) DO NOTHING;
INSERT INTO comunas (id_region, codigo, descripcion, orden, codigo_sii, activo)
SELECT r.id, 'VIT',  'Vitacura',    4, '13132', TRUE FROM regiones r WHERE r.codigo = 'RM' ON CONFLICT (codigo) DO NOTHING;
INSERT INTO comunas (id_region, codigo, descripcion, orden, codigo_sii, activo)
SELECT r.id, 'NUN',  'Ñuñoa',       5, '13120', TRUE FROM regiones r WHERE r.codigo = 'RM' ON CONFLICT (codigo) DO NOTHING;
INSERT INTO comunas (id_region, codigo, descripcion, orden, codigo_sii, activo)
SELECT r.id, 'MAI',  'Maipú',       6, '13119', TRUE FROM regiones r WHERE r.codigo = 'RM' ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- 09: contribuyentes  (FK → comunas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contribuyentes (
  id         BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rut        VARCHAR(20)  NOT NULL,
  nombre     VARCHAR(300) NOT NULL,
  apellidos  VARCHAR(300) NOT NULL DEFAULT '',
  giro       VARCHAR(300),
  id_comuna  BIGINT                REFERENCES comunas(id) ON DELETE RESTRICT,
  direccion  VARCHAR(300),
  email      VARCHAR(300),
  telefono   VARCHAR(20),
  telefono2  VARCHAR(20),
  activo     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_contribuyentes_rut UNIQUE (rut)
);

CREATE INDEX IF NOT EXISTS idx_contribuyentes_id_comuna ON contribuyentes(id_comuna);

CREATE OR REPLACE TRIGGER trg_contribuyentes_updated_at
  BEFORE UPDATE ON contribuyentes
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================================
-- 10: contribuyente_tipos  (tabla intermedia)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contribuyente_tipos (
  id_contribuyente      BIGINT NOT NULL REFERENCES contribuyentes(id)     ON DELETE CASCADE,
  id_tipo_contribuyente BIGINT NOT NULL REFERENCES tipos_contribuyente(id) ON DELETE RESTRICT,
  PRIMARY KEY (id_contribuyente, id_tipo_contribuyente)
);

CREATE INDEX IF NOT EXISTS idx_contribuyente_tipos_tipo ON contribuyente_tipos(id_tipo_contribuyente);

CREATE OR REPLACE FUNCTION sp_contribuyentes(
  p_opcion INTEGER,
  p_data   JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_id        BIGINT  := (p_data->>'id')::BIGINT;
  v_rut       TEXT    := NULLIF(TRIM(p_data->>'rut'),       '');
  v_nombre    TEXT    := NULLIF(TRIM(p_data->>'nombre'),    '');
  v_apellidos TEXT    := NULLIF(TRIM(p_data->>'apellidos'), '');
  v_giro      TEXT    := NULLIF(TRIM(p_data->>'giro'),      '');
  v_id_comuna BIGINT  := NULLIF((p_data->>'id_comuna')::BIGINT, 0);
  v_direccion TEXT    := NULLIF(TRIM(p_data->>'direccion'), '');
  v_email     TEXT    := NULLIF(TRIM(p_data->>'email'),     '');
  v_telefono  TEXT    := NULLIF(TRIM(p_data->>'telefono'),  '');
  v_telefono2 TEXT    := NULLIF(TRIM(p_data->>'telefono2'), '');
  v_activo    BOOLEAN := (p_data->>'activo')::BOOLEAN;
  v_tipos     JSONB   := COALESCE(p_data->'id_tipo_contribuyente', '[]'::jsonb);
  v_id_nuevo  BIGINT;
  v_result    JSON;
BEGIN

  IF p_opcion = 1 THEN
    SELECT json_build_object(
      'message', 'Contribuyentes obtenidos correctamente',
      'data',    COALESCE(json_agg(c ORDER BY c.nombre), '[]'::json)
    ) INTO v_result
    FROM (
      SELECT c.id, c.rut, c.nombre, c.apellidos, c.giro,
             c.id_comuna, com.id_region,
             c.direccion, c.email, c.telefono, c.telefono2,
             c.activo, c.created_at, c.updated_at,
             COALESCE(
               (SELECT json_agg(ct.id_tipo_contribuyente ORDER BY ct.id_tipo_contribuyente)
                FROM contribuyente_tipos ct WHERE ct.id_contribuyente = c.id),
               '[]'::json
             ) AS id_tipo_contribuyente
      FROM contribuyentes c
      LEFT JOIN comunas com ON c.id_comuna = com.id
    ) c;
    RETURN v_result;

  ELSIF p_opcion = 2 THEN
    SELECT json_build_object(
      'message', 'Contribuyente obtenido correctamente',
      'data',    row_to_json(c.*)
    ) INTO v_result
    FROM (
      SELECT c.id, c.rut, c.nombre, c.apellidos, c.giro,
             c.id_comuna, com.id_region,
             c.direccion, c.email, c.telefono, c.telefono2,
             c.activo, c.created_at, c.updated_at,
             COALESCE(
               (SELECT json_agg(ct.id_tipo_contribuyente ORDER BY ct.id_tipo_contribuyente)
                FROM contribuyente_tipos ct WHERE ct.id_contribuyente = c.id),
               '[]'::json
             ) AS id_tipo_contribuyente
      FROM contribuyentes c
      LEFT JOIN comunas com ON c.id_comuna = com.id
      WHERE c.id = v_id
    ) c;
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Contribuyente con id % no encontrado', v_id;
    END IF;
    RETURN v_result;

  ELSIF p_opcion = 3 THEN
    INSERT INTO contribuyentes
      (rut, nombre, apellidos, giro, id_comuna, direccion, email, telefono, telefono2, activo)
    VALUES
      (v_rut, v_nombre, COALESCE(v_apellidos, ''), v_giro, v_id_comuna,
       v_direccion, v_email, v_telefono, v_telefono2, COALESCE(v_activo, TRUE))
    RETURNING id INTO v_id_nuevo;
    INSERT INTO contribuyente_tipos (id_contribuyente, id_tipo_contribuyente)
    SELECT v_id_nuevo, (elem#>>'{}')::BIGINT
    FROM jsonb_array_elements(v_tipos) AS elem
    ON CONFLICT DO NOTHING;
    SELECT json_build_object(
      'message', 'Contribuyente creado correctamente',
      'data',    row_to_json(c.*)
    ) INTO v_result
    FROM (
      SELECT c.id, c.rut, c.nombre, c.apellidos, c.giro,
             c.id_comuna, com.id_region,
             c.direccion, c.email, c.telefono, c.telefono2,
             c.activo, c.created_at, c.updated_at,
             COALESCE(
               (SELECT json_agg(ct.id_tipo_contribuyente ORDER BY ct.id_tipo_contribuyente)
                FROM contribuyente_tipos ct WHERE ct.id_contribuyente = c.id),
               '[]'::json
             ) AS id_tipo_contribuyente
      FROM contribuyentes c
      LEFT JOIN comunas com ON c.id_comuna = com.id
      WHERE c.id = v_id_nuevo
    ) c;
    RETURN v_result;

  ELSIF p_opcion = 4 THEN
    UPDATE contribuyentes SET
      rut       = COALESCE(v_rut,       rut),
      nombre    = COALESCE(v_nombre,    nombre),
      apellidos = COALESCE(v_apellidos, apellidos),
      giro      = CASE WHEN p_data ? 'giro'      THEN v_giro      ELSE giro      END,
      id_comuna = CASE WHEN p_data ? 'id_comuna' THEN v_id_comuna ELSE id_comuna END,
      direccion = CASE WHEN p_data ? 'direccion' THEN v_direccion ELSE direccion END,
      email     = CASE WHEN p_data ? 'email'     THEN v_email     ELSE email     END,
      telefono  = CASE WHEN p_data ? 'telefono'  THEN v_telefono  ELSE telefono  END,
      telefono2 = CASE WHEN p_data ? 'telefono2' THEN v_telefono2 ELSE telefono2 END,
      activo    = COALESCE(v_activo, activo)
    WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Contribuyente con id % no encontrado', v_id;
    END IF;
    IF p_data ? 'id_tipo_contribuyente' THEN
      DELETE FROM contribuyente_tipos WHERE id_contribuyente = v_id;
      INSERT INTO contribuyente_tipos (id_contribuyente, id_tipo_contribuyente)
      SELECT v_id, (elem#>>'{}')::BIGINT
      FROM jsonb_array_elements(v_tipos) AS elem
      ON CONFLICT DO NOTHING;
    END IF;
    SELECT json_build_object(
      'message', 'Contribuyente actualizado correctamente',
      'data',    row_to_json(c.*)
    ) INTO v_result
    FROM (
      SELECT c.id, c.rut, c.nombre, c.apellidos, c.giro,
             c.id_comuna, com.id_region,
             c.direccion, c.email, c.telefono, c.telefono2,
             c.activo, c.created_at, c.updated_at,
             COALESCE(
               (SELECT json_agg(ct.id_tipo_contribuyente ORDER BY ct.id_tipo_contribuyente)
                FROM contribuyente_tipos ct WHERE ct.id_contribuyente = c.id),
               '[]'::json
             ) AS id_tipo_contribuyente
      FROM contribuyentes c
      LEFT JOIN comunas com ON c.id_comuna = com.id
      WHERE c.id = v_id
    ) c;
    RETURN v_result;

  ELSIF p_opcion = 5 THEN
    DELETE FROM contribuyentes WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Contribuyente con id % no encontrado', v_id;
    END IF;
    RETURN json_build_object(
      'message', 'Contribuyente eliminado correctamente',
      'data',    json_build_object('id', v_id)
    );

  ELSE
    RAISE EXCEPTION 'Opción inválida: %', p_opcion;
  END IF;

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11: empresas  (FK → comunas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS empresas (
  id                    BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo                VARCHAR(20)  NOT NULL,
  rut                   VARCHAR(20)  NOT NULL,
  razon_social          VARCHAR(300) NOT NULL,
  nombre_fantasia       VARCHAR(300),
  giro                  VARCHAR(300),
  act_eco               VARCHAR(50),
  id_comuna             BIGINT                REFERENCES comunas(id) ON DELETE RESTRICT,
  direccion             VARCHAR(300),
  direccion_referencia  VARCHAR(300),
  email                 VARCHAR(300),
  telefono              VARCHAR(20),
  numero_resolucion_sii INTEGER,
  fecha_resolucion_sii  DATE,
  porcentaje_iva        NUMERIC(5,2) NOT NULL DEFAULT 19.00,
  ambiente              SMALLINT     NOT NULL DEFAULT 1 CHECK (ambiente IN (1, 2)),
  activo                BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_empresas_codigo UNIQUE (codigo),
  CONSTRAINT uq_empresas_rut    UNIQUE (rut)
);

CREATE INDEX IF NOT EXISTS idx_empresas_id_comuna ON empresas(id_comuna);

--ALTER TABLE empresas ADD COLUMN IF NOT EXISTS direccion_referencia VARCHAR(300);

CREATE OR REPLACE TRIGGER trg_empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE FUNCTION sp_empresas(
  p_opcion INTEGER,
  p_data   JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_id                BIGINT   := (p_data->>'id')::BIGINT;
  v_codigo            TEXT     := NULLIF(TRIM(p_data->>'codigo'),          '');
  v_rut               TEXT     := NULLIF(TRIM(p_data->>'rut'),             '');
  v_razon_social      TEXT     := NULLIF(TRIM(p_data->>'razon_social'),    '');
  v_nombre_fantasia   TEXT     := NULLIF(TRIM(p_data->>'nombre_fantasia'), '');
  v_giro              TEXT     := NULLIF(TRIM(p_data->>'giro'),            '');
  v_act_eco           TEXT     := NULLIF(TRIM(p_data->>'act_eco'),         '');
  v_id_comuna         BIGINT   := NULLIF((p_data->>'id_comuna')::BIGINT,   0);
  v_direccion         TEXT     := NULLIF(TRIM(p_data->>'direccion'),            '');
  v_dir_referencia    TEXT     := NULLIF(TRIM(p_data->>'direccion_referencia'), '');
  v_email             TEXT     := NULLIF(TRIM(p_data->>'email'),                '');
  v_telefono          TEXT     := NULLIF(TRIM(p_data->>'telefono'),        '');
  v_porcentaje_iva    NUMERIC  := NULLIF(p_data->>'porcentaje_iva', '')::NUMERIC;
  v_numero_resolucion_sii INTEGER := NULLIF((p_data->>'numero_resolucion_sii')::INTEGER, 0);
  v_fecha_resolucion_sii  DATE    := NULLIF(p_data->>'fecha_resolucion_sii', '')::DATE;
  v_ambiente          SMALLINT := (p_data->>'ambiente')::SMALLINT;
  v_activo            BOOLEAN  := (p_data->>'activo')::BOOLEAN;
  v_id_nuevo          BIGINT;
  v_result            JSON;
BEGIN

  IF p_opcion = 1 THEN
    SELECT json_build_object(
      'message', 'Empresas obtenidas correctamente',
      'data',    COALESCE(json_agg(e ORDER BY e.razon_social), '[]'::json)
    ) INTO v_result
    FROM (
      SELECT e.id, e.codigo, e.rut, e.razon_social, e.nombre_fantasia,
             e.giro, e.act_eco, e.id_comuna, com.id_region,
             e.direccion, e.direccion_referencia, e.email, e.telefono,
             e.numero_resolucion_sii, e.fecha_resolucion_sii,
             e.porcentaje_iva, e.ambiente, e.activo, e.created_at, e.updated_at
      FROM empresas e
      LEFT JOIN comunas com ON e.id_comuna = com.id
    ) e;
    RETURN v_result;

  ELSIF p_opcion = 2 THEN
    SELECT json_build_object(
      'message', 'Empresa obtenida correctamente',
      'data',    row_to_json(e.*)
    ) INTO v_result
    FROM (
      SELECT e.id, e.codigo, e.rut, e.razon_social, e.nombre_fantasia,
             e.giro, e.act_eco, e.id_comuna, com.id_region,
             e.direccion, e.direccion_referencia, e.email, e.telefono,
             e.numero_resolucion_sii, e.fecha_resolucion_sii,
             e.porcentaje_iva, e.ambiente, e.activo, e.created_at, e.updated_at
      FROM empresas e
      LEFT JOIN comunas com ON e.id_comuna = com.id
      WHERE e.id = v_id
    ) e;
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Empresa con id % no encontrada', v_id;
    END IF;
    RETURN v_result;

  ELSIF p_opcion = 3 THEN
    INSERT INTO empresas
      (codigo, rut, razon_social, nombre_fantasia, giro, act_eco,
       id_comuna, direccion, direccion_referencia, email, telefono,
       numero_resolucion_sii, fecha_resolucion_sii, porcentaje_iva,
       ambiente, activo)
    VALUES
      (v_codigo, v_rut, v_razon_social, v_nombre_fantasia, v_giro, v_act_eco,
       v_id_comuna, v_direccion, v_dir_referencia, v_email, v_telefono,
       v_numero_resolucion_sii, v_fecha_resolucion_sii,
       COALESCE(v_porcentaje_iva, 19.00),
       COALESCE(v_ambiente, 1), COALESCE(v_activo, TRUE))
    RETURNING id INTO v_id_nuevo;
    SELECT json_build_object(
      'message', 'Empresa creada correctamente',
      'data',    row_to_json(e.*)
    ) INTO v_result
    FROM (
      SELECT e.id, e.codigo, e.rut, e.razon_social, e.nombre_fantasia,
             e.giro, e.act_eco, e.id_comuna, com.id_region,
             e.direccion, e.direccion_referencia, e.email, e.telefono,
             e.numero_resolucion_sii, e.fecha_resolucion_sii,
             e.porcentaje_iva, e.ambiente, e.activo, e.created_at, e.updated_at
      FROM empresas e
      LEFT JOIN comunas com ON e.id_comuna = com.id
      WHERE e.id = v_id_nuevo
    ) e;
    RETURN v_result;

  ELSIF p_opcion = 4 THEN
    UPDATE empresas SET
      codigo                = COALESCE(v_codigo,          codigo),
      rut                   = COALESCE(v_rut,             rut),
      razon_social          = COALESCE(v_razon_social,    razon_social),
      nombre_fantasia       = CASE WHEN p_data ? 'nombre_fantasia'        THEN v_nombre_fantasia       ELSE nombre_fantasia       END,
      giro                  = COALESCE(v_giro,            giro),
      act_eco               = COALESCE(v_act_eco,         act_eco),
      id_comuna             = CASE WHEN p_data ? 'id_comuna'              THEN v_id_comuna             ELSE id_comuna             END,
      direccion             = COALESCE(v_direccion,        direccion),
      direccion_referencia  = CASE WHEN p_data ? 'direccion_referencia' THEN v_dir_referencia ELSE direccion_referencia END,
      email                 = CASE WHEN p_data ? 'email'                THEN v_email          ELSE email                END,
      telefono              = CASE WHEN p_data ? 'telefono'               THEN v_telefono              ELSE telefono              END,
      numero_resolucion_sii = CASE WHEN p_data ? 'numero_resolucion_sii'  THEN v_numero_resolucion_sii ELSE numero_resolucion_sii END,
      fecha_resolucion_sii  = CASE WHEN p_data ? 'fecha_resolucion_sii'   THEN v_fecha_resolucion_sii  ELSE fecha_resolucion_sii  END,
      porcentaje_iva        = COALESCE(v_porcentaje_iva,  porcentaje_iva),
      ambiente              = COALESCE(v_ambiente,        ambiente),
      activo                = COALESCE(v_activo,          activo)
    WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Empresa con id % no encontrada', v_id;
    END IF;
    SELECT json_build_object(
      'message', 'Empresa actualizada correctamente',
      'data',    row_to_json(e.*)
    ) INTO v_result
    FROM (
      SELECT e.id, e.codigo, e.rut, e.razon_social, e.nombre_fantasia,
             e.giro, e.act_eco, e.id_comuna, com.id_region,
             e.direccion, e.direccion_referencia, e.email, e.telefono,
             e.numero_resolucion_sii, e.fecha_resolucion_sii,
             e.porcentaje_iva, e.ambiente, e.activo, e.created_at, e.updated_at
      FROM empresas e
      LEFT JOIN comunas com ON e.id_comuna = com.id
      WHERE e.id = v_id
    ) e;
    RETURN v_result;

  ELSIF p_opcion = 5 THEN
    DELETE FROM empresas WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Empresa con id % no encontrada', v_id;
    END IF;
    RETURN json_build_object(
      'message', 'Empresa eliminada correctamente',
      'data',    json_build_object('id', v_id)
    );

  ELSE
    RAISE EXCEPTION 'Opción inválida: %', p_opcion;
  END IF;

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12: certificados_dte  (FK → empresas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS certificados_dte (
  id                BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_empresa        BIGINT       NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  descripcion       VARCHAR(300) NOT NULL DEFAULT '',
  nombre_archivo    VARCHAR(300) NOT NULL,
  mime_type         VARCHAR(100) NOT NULL,
  certificado       TEXT         NOT NULL,
  password          VARCHAR(200),
  rut_certificado   VARCHAR(20),
  fecha_vencimiento DATE,
  ambiente          SMALLINT     NOT NULL DEFAULT 1 CHECK (ambiente IN (1, 2)),
  activo            BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificados_dte_id_empresa ON certificados_dte(id_empresa);

CREATE OR REPLACE TRIGGER trg_certificados_dte_updated_at
  BEFORE UPDATE ON certificados_dte
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE FUNCTION sp_certificados_dte(
  p_opcion INTEGER,
  p_data   JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_id              BIGINT   := (p_data->>'id')::BIGINT;
  v_id_empresa      BIGINT   := NULLIF((p_data->>'id_empresa')::BIGINT,  0);
  v_descripcion     TEXT     := NULLIF(TRIM(p_data->>'descripcion'),     '');
  v_nombre_archivo  TEXT     := NULLIF(TRIM(p_data->>'nombre_archivo'),  '');
  v_mime_type       TEXT     := NULLIF(TRIM(p_data->>'mime_type'),       '');
  v_certificado     TEXT     := NULLIF(p_data->>'certificado',           '');
  v_password        TEXT     := NULLIF(p_data->>'password',              '');
  v_rut_certificado TEXT     := NULLIF(TRIM(p_data->>'rut_certificado'), '');
  v_fecha_venc      DATE     := (p_data->>'fecha_vencimiento')::DATE;
  v_ambiente        SMALLINT := (p_data->>'ambiente')::SMALLINT;
  v_activo          BOOLEAN  := (p_data->>'activo')::BOOLEAN;
  v_id_nuevo        BIGINT;
  v_result          JSON;
BEGIN

  IF p_opcion = 1 THEN
    SELECT json_build_object(
      'message', 'Certificados DTE obtenidos correctamente',
      'data',    COALESCE(json_agg(c ORDER BY c.descripcion), '[]'::json)
    ) INTO v_result
    FROM (
      SELECT id, id_empresa, descripcion, nombre_archivo, mime_type, certificado,
             password, rut_certificado, fecha_vencimiento, ambiente, activo,
             created_at, updated_at
      FROM certificados_dte
      WHERE id_empresa = v_id_empresa
    ) c;
    RETURN v_result;

  ELSIF p_opcion = 2 THEN
    SELECT json_build_object(
      'message', 'Certificado DTE obtenido correctamente',
      'data',    row_to_json(c.*)
    ) INTO v_result
    FROM (
      SELECT id, id_empresa, descripcion, nombre_archivo, mime_type, certificado,
             password, rut_certificado, fecha_vencimiento, ambiente, activo,
             created_at, updated_at
      FROM certificados_dte WHERE id = v_id
    ) c;
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Certificado DTE con id % no encontrado', v_id;
    END IF;
    RETURN v_result;

  ELSIF p_opcion = 3 THEN
    INSERT INTO certificados_dte
      (id_empresa, descripcion, nombre_archivo, mime_type, certificado,
       password, rut_certificado, fecha_vencimiento, ambiente, activo)
    VALUES
      (v_id_empresa, COALESCE(v_descripcion, ''), v_nombre_archivo, v_mime_type,
       v_certificado, v_password, v_rut_certificado, v_fecha_venc,
       COALESCE(v_ambiente, 1), COALESCE(v_activo, TRUE))
    RETURNING id INTO v_id_nuevo;
    SELECT json_build_object(
      'message', 'Certificado DTE creado correctamente',
      'data',    row_to_json(c.*)
    ) INTO v_result
    FROM (
      SELECT id, id_empresa, descripcion, nombre_archivo, mime_type, certificado,
             password, rut_certificado, fecha_vencimiento, ambiente, activo,
             created_at, updated_at
      FROM certificados_dte WHERE id = v_id_nuevo
    ) c;
    RETURN v_result;

  ELSIF p_opcion = 4 THEN
    UPDATE certificados_dte SET
      id_empresa        = COALESCE(v_id_empresa,      id_empresa),
      descripcion       = COALESCE(v_descripcion,     descripcion),
      nombre_archivo    = COALESCE(v_nombre_archivo,  nombre_archivo),
      mime_type         = COALESCE(v_mime_type,        mime_type),
      certificado       = COALESCE(v_certificado,      certificado),
      password          = COALESCE(v_password,         password),
      rut_certificado   = COALESCE(v_rut_certificado,  rut_certificado),
      fecha_vencimiento = CASE WHEN p_data ? 'fecha_vencimiento' THEN v_fecha_venc ELSE fecha_vencimiento END,
      ambiente          = COALESCE(v_ambiente,         ambiente),
      activo            = COALESCE(v_activo,           activo)
    WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Certificado DTE con id % no encontrado', v_id;
    END IF;
    SELECT json_build_object(
      'message', 'Certificado DTE actualizado correctamente',
      'data',    row_to_json(c.*)
    ) INTO v_result
    FROM (
      SELECT id, id_empresa, descripcion, nombre_archivo, mime_type, certificado,
             password, rut_certificado, fecha_vencimiento, ambiente, activo,
             created_at, updated_at
      FROM certificados_dte WHERE id = v_id
    ) c;
    RETURN v_result;

  ELSIF p_opcion = 5 THEN
    DELETE FROM certificados_dte WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Certificado DTE con id % no encontrado', v_id;
    END IF;
    RETURN json_build_object(
      'message', 'Certificado DTE eliminado correctamente',
      'data',    json_build_object('id', v_id)
    );

  ELSE
    RAISE EXCEPTION 'Opción inválida: %', p_opcion;
  END IF;

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13: folios_caf  (FK → empresas, tipos_dte)
-- ============================================================================

CREATE TABLE IF NOT EXISTS folios_caf (
  id                BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_empresa        BIGINT       NOT NULL REFERENCES empresas(id)  ON DELETE RESTRICT,
  id_tipo_dte       BIGINT       NOT NULL REFERENCES tipos_dte(id) ON DELETE RESTRICT,
  folio_desde       INTEGER      NOT NULL,
  folio_hasta       INTEGER      NOT NULL,
  nombre_archivo    VARCHAR(300) NOT NULL,
  mime_type         VARCHAR(100) NOT NULL,
  archivo_caf       TEXT         NOT NULL,
  fecha_vencimiento DATE,
  ambiente          SMALLINT     NOT NULL DEFAULT 1 CHECK (ambiente IN (1, 2)),
  activo            BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folios_caf_id_empresa  ON folios_caf(id_empresa);
CREATE INDEX IF NOT EXISTS idx_folios_caf_id_tipo_dte ON folios_caf(id_tipo_dte);

CREATE OR REPLACE TRIGGER trg_folios_caf_updated_at
  BEFORE UPDATE ON folios_caf
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE FUNCTION sp_folios_caf(
  p_opcion INTEGER,
  p_data   JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_id             BIGINT  := (p_data->>'id')::BIGINT;
  v_id_empresa     BIGINT  := NULLIF((p_data->>'id_empresa')::BIGINT,  0);
  v_id_tipo_dte    BIGINT  := NULLIF((p_data->>'id_tipo_dte')::BIGINT, 0);
  v_folio_desde    INTEGER := (p_data->>'folio_desde')::INTEGER;
  v_folio_hasta    INTEGER := (p_data->>'folio_hasta')::INTEGER;
  v_nombre_archivo TEXT    := NULLIF(TRIM(p_data->>'nombre_archivo'),  '');
  v_mime_type      TEXT    := NULLIF(TRIM(p_data->>'mime_type'),       '');
  v_archivo_caf    TEXT    := NULLIF(p_data->>'archivo_caf',           '');
  v_fecha_venc     DATE    := (p_data->>'fecha_vencimiento')::DATE;
  v_ambiente       SMALLINT := (p_data->>'ambiente')::SMALLINT;
  v_activo         BOOLEAN := (p_data->>'activo')::BOOLEAN;
  v_id_nuevo       BIGINT;
  v_result         JSON;
BEGIN

  IF p_opcion = 1 THEN
    SELECT json_build_object(
      'message', 'Folios CAF obtenidos correctamente',
      'data',    COALESCE(json_agg(f ORDER BY f.id_tipo_dte, f.folio_desde), '[]'::json)
    ) INTO v_result
    FROM (
      SELECT id, id_empresa, id_tipo_dte, folio_desde, folio_hasta,
             nombre_archivo, mime_type, archivo_caf, fecha_vencimiento,
             ambiente, activo, created_at, updated_at
      FROM folios_caf
      WHERE id_empresa = v_id_empresa
    ) f;
    RETURN v_result;

  ELSIF p_opcion = 2 THEN
    SELECT json_build_object(
      'message', 'Folio CAF obtenido correctamente',
      'data',    row_to_json(f.*)
    ) INTO v_result
    FROM (
      SELECT id, id_empresa, id_tipo_dte, folio_desde, folio_hasta,
             nombre_archivo, mime_type, archivo_caf, fecha_vencimiento,
             ambiente, activo, created_at, updated_at
      FROM folios_caf WHERE id = v_id
    ) f;
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Folio CAF con id % no encontrado', v_id;
    END IF;
    RETURN v_result;

  ELSIF p_opcion = 3 THEN
    INSERT INTO folios_caf
      (id_empresa, id_tipo_dte, folio_desde, folio_hasta,
       nombre_archivo, mime_type, archivo_caf, fecha_vencimiento, ambiente, activo)
    VALUES
      (v_id_empresa, v_id_tipo_dte, v_folio_desde, v_folio_hasta,
       v_nombre_archivo, v_mime_type, v_archivo_caf, v_fecha_venc, COALESCE(v_ambiente, 1),
       COALESCE(v_activo, TRUE))
    RETURNING id INTO v_id_nuevo;
    SELECT json_build_object(
      'message', 'Folio CAF creado correctamente',
      'data',    row_to_json(f.*)
    ) INTO v_result
    FROM (
      SELECT id, id_empresa, id_tipo_dte, folio_desde, folio_hasta,
             nombre_archivo, mime_type, archivo_caf, fecha_vencimiento,
             ambiente, activo, created_at, updated_at
      FROM folios_caf WHERE id = v_id_nuevo
    ) f;
    RETURN v_result;

  ELSIF p_opcion = 4 THEN
    UPDATE folios_caf SET
      id_empresa        = COALESCE(v_id_empresa,    id_empresa),
      id_tipo_dte       = COALESCE(v_id_tipo_dte,   id_tipo_dte),
      folio_desde       = COALESCE(v_folio_desde,   folio_desde),
      folio_hasta       = COALESCE(v_folio_hasta,   folio_hasta),
      nombre_archivo    = COALESCE(v_nombre_archivo, nombre_archivo),
      mime_type         = COALESCE(v_mime_type,      mime_type),
      archivo_caf       = COALESCE(v_archivo_caf,   archivo_caf),
      fecha_vencimiento = CASE WHEN p_data ? 'fecha_vencimiento' THEN v_fecha_venc ELSE fecha_vencimiento END,
      ambiente          = COALESCE(v_ambiente,       ambiente),
      activo            = COALESCE(v_activo,         activo)
    WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Folio CAF con id % no encontrado', v_id;
    END IF;
    SELECT json_build_object(
      'message', 'Folio CAF actualizado correctamente',
      'data',    row_to_json(f.*)
    ) INTO v_result
    FROM (
      SELECT id, id_empresa, id_tipo_dte, folio_desde, folio_hasta,
             nombre_archivo, mime_type, archivo_caf, fecha_vencimiento,
             ambiente, activo, created_at, updated_at
      FROM folios_caf WHERE id = v_id
    ) f;
    RETURN v_result;

  ELSIF p_opcion = 5 THEN
    DELETE FROM folios_caf WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Folio CAF con id % no encontrado', v_id;
    END IF;
    RETURN json_build_object(
      'message', 'Folio CAF eliminado correctamente',
      'data',    json_build_object('id', v_id)
    );

  ELSE
    RAISE EXCEPTION 'Opción inválida: %', p_opcion;
  END IF;

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 14: tipos_presupuesto  (FK → tipos_dte, opcional)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tipos_presupuesto (
  id                BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_empresa        BIGINT       NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  codigo            VARCHAR(20)  NOT NULL,
  descripcion       VARCHAR(200) NOT NULL,
  encabezado_linea1 VARCHAR(150),
  encabezado_linea2 VARCHAR(150),
  logo_ancho        SMALLINT,
  logo_alto         SMALLINT,
  dias_validez      SMALLINT     NOT NULL DEFAULT 15,
  id_tipo_dte       BIGINT                REFERENCES tipos_dte(id) ON DELETE RESTRICT,
  activo            BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tipos_presupuesto_empresa_codigo UNIQUE (id_empresa, codigo)
);

CREATE INDEX IF NOT EXISTS idx_tipos_presupuesto_id_empresa ON tipos_presupuesto(id_empresa);

--ALTER TABLE tipos_presupuesto ADD COLUMN IF NOT EXISTS encabezado_linea1 VARCHAR(150);
--ALTER TABLE tipos_presupuesto ADD COLUMN IF NOT EXISTS encabezado_linea2 VARCHAR(150);
--ALTER TABLE tipos_presupuesto ADD COLUMN IF NOT EXISTS logo_ancho        SMALLINT;
--ALTER TABLE tipos_presupuesto ADD COLUMN IF NOT EXISTS logo_alto         SMALLINT;
--ALTER TABLE tipos_presupuesto ADD COLUMN IF NOT EXISTS dias_validez      SMALLINT NOT NULL DEFAULT 15;

CREATE OR REPLACE TRIGGER trg_tipos_presupuesto_updated_at
  BEFORE UPDATE ON tipos_presupuesto
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE FUNCTION sp_tipos_presupuesto(
  p_opcion INTEGER,
  p_data   JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_id               BIGINT   := (p_data->>'id')::BIGINT;
  v_id_empresa       BIGINT   := NULLIF((p_data->>'id_empresa')::BIGINT, 0);
  v_codigo           TEXT     := NULLIF(TRIM(p_data->>'codigo'),           '');
  v_descripcion      TEXT     := NULLIF(TRIM(p_data->>'descripcion'),      '');
  v_id_tipo_dte      BIGINT   := NULLIF((p_data->>'id_tipo_dte')::BIGINT,  0);
  v_enc_linea1       TEXT     := NULLIF(TRIM(p_data->>'encabezado_linea1'), '');
  v_enc_linea2       TEXT     := NULLIF(TRIM(p_data->>'encabezado_linea2'), '');
  v_logo_ancho       SMALLINT := NULLIF((p_data->>'logo_ancho')::SMALLINT,  0);
  v_logo_alto        SMALLINT := NULLIF((p_data->>'logo_alto')::SMALLINT,   0);
  v_dias_validez     SMALLINT := NULLIF((p_data->>'dias_validez')::SMALLINT, 0);
  v_activo           BOOLEAN  := (p_data->>'activo')::BOOLEAN;
  v_id_nuevo         BIGINT;
  v_result      JSON;
BEGIN

  IF p_opcion = 1 THEN
    SELECT json_build_object(
      'message', 'Tipos de presupuesto obtenidos correctamente',
      'data',    COALESCE(json_agg(t ORDER BY t.descripcion), '[]'::json)
    ) INTO v_result
    FROM (
      SELECT id, id_empresa, codigo, descripcion, id_tipo_dte,
             encabezado_linea1, encabezado_linea2, logo_ancho, logo_alto, dias_validez,
             activo, created_at, updated_at
      FROM tipos_presupuesto
      WHERE id_empresa = v_id_empresa
    ) t;
    RETURN v_result;

  ELSIF p_opcion = 2 THEN
    SELECT json_build_object(
      'message', 'Tipo de presupuesto obtenido correctamente',
      'data',    row_to_json(t.*)
    ) INTO v_result
    FROM (
      SELECT id, id_empresa, codigo, descripcion, id_tipo_dte,
             encabezado_linea1, encabezado_linea2, logo_ancho, logo_alto, dias_validez,
             activo, created_at, updated_at
      FROM tipos_presupuesto WHERE id = v_id
    ) t;
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Tipo de presupuesto con id % no encontrado', v_id;
    END IF;
    RETURN v_result;

  ELSIF p_opcion = 3 THEN
    INSERT INTO tipos_presupuesto
      (id_empresa, codigo, descripcion, id_tipo_dte,
       encabezado_linea1, encabezado_linea2, logo_ancho, logo_alto, dias_validez, activo)
    VALUES
      (v_id_empresa, v_codigo, v_descripcion, v_id_tipo_dte,
       v_enc_linea1, v_enc_linea2, v_logo_ancho, v_logo_alto,
       COALESCE(v_dias_validez, 15), COALESCE(v_activo, TRUE))
    RETURNING id INTO v_id_nuevo;
    SELECT json_build_object(
      'message', 'Tipo de presupuesto creado correctamente',
      'data',    row_to_json(t.*)
    ) INTO v_result
    FROM (
      SELECT id, id_empresa, codigo, descripcion, id_tipo_dte,
             encabezado_linea1, encabezado_linea2, logo_ancho, logo_alto, dias_validez,
             activo, created_at, updated_at
      FROM tipos_presupuesto WHERE id = v_id_nuevo
    ) t;
    RETURN v_result;

  ELSIF p_opcion = 4 THEN
    UPDATE tipos_presupuesto SET
      codigo             = COALESCE(v_codigo,       codigo),
      descripcion        = COALESCE(v_descripcion,  descripcion),
      id_tipo_dte        = CASE WHEN p_data ? 'id_tipo_dte'        THEN v_id_tipo_dte  ELSE id_tipo_dte        END,
      encabezado_linea1  = CASE WHEN p_data ? 'encabezado_linea1' THEN v_enc_linea1   ELSE encabezado_linea1  END,
      encabezado_linea2  = CASE WHEN p_data ? 'encabezado_linea2' THEN v_enc_linea2   ELSE encabezado_linea2  END,
      logo_ancho         = CASE WHEN p_data ? 'logo_ancho'        THEN v_logo_ancho   ELSE logo_ancho         END,
      logo_alto          = CASE WHEN p_data ? 'logo_alto'         THEN v_logo_alto    ELSE logo_alto          END,
      dias_validez       = COALESCE(v_dias_validez, dias_validez),
      activo             = COALESCE(v_activo,       activo)
    WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Tipo de presupuesto con id % no encontrado', v_id;
    END IF;
    SELECT json_build_object(
      'message', 'Tipo de presupuesto actualizado correctamente',
      'data',    row_to_json(t.*)
    ) INTO v_result
    FROM (
      SELECT id, id_empresa, codigo, descripcion, id_tipo_dte,
             encabezado_linea1, encabezado_linea2, logo_ancho, logo_alto, dias_validez,
             activo, created_at, updated_at
      FROM tipos_presupuesto WHERE id = v_id
    ) t;
    RETURN v_result;

  ELSIF p_opcion = 5 THEN
    DELETE FROM tipos_presupuesto WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Tipo de presupuesto con id % no encontrado', v_id;
    END IF;
    RETURN json_build_object(
      'message', 'Tipo de presupuesto eliminado correctamente',
      'data',    json_build_object('id', v_id)
    );

  ELSE
    RAISE EXCEPTION 'Opción inválida: %', p_opcion;
  END IF;

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 15: empresa_logo  (FK → empresas)
--     Almacena logos de empresa por tipo (ej: 'presupuesto').
--     archivo: base64 puro del binario de imagen.
-- ============================================================================

CREATE TABLE IF NOT EXISTS empresa_logo (
  id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_empresa  BIGINT       NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  tipo        VARCHAR(20)  NOT NULL DEFAULT 'presupuesto',
  nombre_archivo VARCHAR(300) NOT NULL,
  mime_type   VARCHAR(20)  NOT NULL CHECK (mime_type IN ('image/png', 'image/jpeg')),
  archivo     TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_empresa_logo_empresa_tipo UNIQUE (id_empresa, tipo)
);

CREATE INDEX IF NOT EXISTS idx_empresa_logo_id_empresa ON empresa_logo(id_empresa);

CREATE OR REPLACE TRIGGER trg_empresa_logo_updated_at
  BEFORE UPDATE ON empresa_logo
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE FUNCTION sp_empresa_logo(
  p_opcion INTEGER,
  p_data   JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_id           BIGINT   := (p_data->>'id')::BIGINT;
  v_id_empresa   BIGINT   := NULLIF((p_data->>'id_empresa')::BIGINT, 0);
  v_tipo         TEXT     := NULLIF(TRIM(p_data->>'tipo'),          '');
  v_nombre_arch  TEXT     := NULLIF(TRIM(p_data->>'nombre_archivo'), '');
  v_mime_type    TEXT     := NULLIF(TRIM(p_data->>'mime_type'),      '');
  v_archivo      TEXT     := NULLIF(p_data->>'archivo',              '');
  v_id_nuevo     BIGINT;
  v_result       JSON;
BEGIN

  IF p_opcion = 1 THEN
    SELECT json_build_object(
      'message', 'Logos obtenidos correctamente',
      'data',    COALESCE(json_agg(l ORDER BY l.tipo), '[]'::json)
    ) INTO v_result
    FROM (
      SELECT id, id_empresa, tipo, nombre_archivo, mime_type, archivo, created_at, updated_at
      FROM empresa_logo
      WHERE id_empresa = v_id_empresa
    ) l;
    RETURN v_result;

  ELSIF p_opcion = 2 THEN
    SELECT json_build_object(
      'message', 'Logo obtenido correctamente',
      'data',    row_to_json(l.*)
    ) INTO v_result
    FROM (
      SELECT id, id_empresa, tipo, nombre_archivo, mime_type, archivo, created_at, updated_at
      FROM empresa_logo WHERE id = v_id
    ) l;
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Logo con id % no encontrado', v_id;
    END IF;
    RETURN v_result;

  ELSIF p_opcion = 3 THEN
    INSERT INTO empresa_logo (id_empresa, tipo, nombre_archivo, mime_type, archivo)
    VALUES (v_id_empresa, COALESCE(v_tipo, 'presupuesto'), v_nombre_arch, v_mime_type, v_archivo)
    ON CONFLICT (id_empresa, tipo) DO UPDATE
      SET nombre_archivo = EXCLUDED.nombre_archivo,
          mime_type      = EXCLUDED.mime_type,
          archivo        = EXCLUDED.archivo,
          updated_at     = NOW()
    RETURNING id INTO v_id_nuevo;
    SELECT json_build_object(
      'message', 'Logo guardado correctamente',
      'data',    row_to_json(l.*)
    ) INTO v_result
    FROM (
      SELECT id, id_empresa, tipo, nombre_archivo, mime_type, archivo, created_at, updated_at
      FROM empresa_logo WHERE id = v_id_nuevo
    ) l;
    RETURN v_result;

  ELSIF p_opcion = 4 THEN
    UPDATE empresa_logo SET
      nombre_archivo = COALESCE(v_nombre_arch, nombre_archivo),
      mime_type      = COALESCE(v_mime_type,   mime_type),
      archivo        = COALESCE(v_archivo,      archivo)
    WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Logo con id % no encontrado', v_id;
    END IF;
    SELECT json_build_object(
      'message', 'Logo actualizado correctamente',
      'data',    row_to_json(l.*)
    ) INTO v_result
    FROM (
      SELECT id, id_empresa, tipo, nombre_archivo, mime_type, archivo, created_at, updated_at
      FROM empresa_logo WHERE id = v_id
    ) l;
    RETURN v_result;

  ELSIF p_opcion = 5 THEN
    DELETE FROM empresa_logo WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Logo con id % no encontrado', v_id;
    END IF;
    RETURN json_build_object(
      'message', 'Logo eliminado correctamente',
      'data',    json_build_object('id', v_id)
    );

  ELSE
    RAISE EXCEPTION 'Opción inválida: %', p_opcion;
  END IF;

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 16: tipos_presupuesto_detalles  (FK → tipos_presupuesto)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tipos_presupuesto_detalles (
  id                  BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_tipo_presupuesto BIGINT       NOT NULL REFERENCES tipos_presupuesto(id) ON DELETE RESTRICT,
  codigo              VARCHAR(10)  NOT NULL,
  descripcion         VARCHAR(100) NOT NULL,
  orden               SMALLINT     NOT NULL DEFAULT 0,
  cant_max_det        SMALLINT     NOT NULL DEFAULT 10,
  col_doc             SMALLINT     NOT NULL DEFAULT 1 CHECK (col_doc IN (1, 2)),
  codigo_subtotal     VARCHAR(10)  NOT NULL,
  nombre_subtotal     VARCHAR(50)  NOT NULL,
  ver_sw_exento       BOOLEAN      NOT NULL DEFAULT FALSE,
  ver_cantidad        BOOLEAN      NOT NULL DEFAULT FALSE,
  ver_valor           BOOLEAN      NOT NULL DEFAULT FALSE,
  ver_total           BOOLEAN      NOT NULL DEFAULT FALSE,
  activo              BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tpd_id_tipo_presupuesto ON tipos_presupuesto_detalles(id_tipo_presupuesto);

CREATE OR REPLACE TRIGGER trg_tipos_presupuesto_detalles_updated_at
  BEFORE UPDATE ON tipos_presupuesto_detalles
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE FUNCTION sp_tipos_presupuesto_detalles(
  p_opcion INTEGER,
  p_data   JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_id                  BIGINT   := (p_data->>'id')::BIGINT;
  v_id_tipo_presupuesto BIGINT   := NULLIF((p_data->>'id_tipo_presupuesto')::BIGINT, 0);
  v_codigo              TEXT     := NULLIF(TRIM(p_data->>'codigo'),          '');
  v_descripcion         TEXT     := NULLIF(TRIM(p_data->>'descripcion'),     '');
  v_orden               SMALLINT := (p_data->>'orden')::SMALLINT;
  v_cant_max_det        SMALLINT := (p_data->>'cant_max_det')::SMALLINT;
  v_col_doc             SMALLINT := (p_data->>'col_doc')::SMALLINT;
  v_codigo_subtotal     TEXT     := NULLIF(TRIM(p_data->>'codigo_subtotal'), '');
  v_nombre_subtotal     TEXT     := NULLIF(TRIM(p_data->>'nombre_subtotal'), '');
  v_ver_sw_exento       BOOLEAN  := (p_data->>'ver_sw_exento')::BOOLEAN;
  v_ver_cantidad        BOOLEAN  := (p_data->>'ver_cantidad')::BOOLEAN;
  v_ver_valor           BOOLEAN  := (p_data->>'ver_valor')::BOOLEAN;
  v_ver_total           BOOLEAN  := (p_data->>'ver_total')::BOOLEAN;
  v_activo              BOOLEAN  := (p_data->>'activo')::BOOLEAN;
  v_id_nuevo            BIGINT;
  v_result              JSON;
BEGIN

  IF p_opcion = 1 THEN
    SELECT json_build_object(
      'message', 'Detalles de tipo presupuesto obtenidos correctamente',
      'data',    COALESCE(json_agg(d ORDER BY d.orden), '[]'::json)
    ) INTO v_result
    FROM (
      SELECT id, id_tipo_presupuesto, codigo, descripcion, orden, cant_max_det, col_doc,
             codigo_subtotal, nombre_subtotal,
             ver_sw_exento, ver_cantidad, ver_valor, ver_total,
             activo, created_at, updated_at
      FROM tipos_presupuesto_detalles
      WHERE id_tipo_presupuesto = v_id_tipo_presupuesto
    ) d;
    RETURN v_result;

  ELSIF p_opcion = 2 THEN
    SELECT json_build_object(
      'message', 'Detalle de tipo presupuesto obtenido correctamente',
      'data',    row_to_json(d.*)
    ) INTO v_result
    FROM (
      SELECT id, id_tipo_presupuesto, codigo, descripcion, orden, cant_max_det, col_doc,
             codigo_subtotal, nombre_subtotal,
             ver_sw_exento, ver_cantidad, ver_valor, ver_total,
             activo, created_at, updated_at
      FROM tipos_presupuesto_detalles WHERE id = v_id
    ) d;
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Detalle con id % no encontrado', v_id;
    END IF;
    RETURN v_result;

  ELSIF p_opcion = 3 THEN
    INSERT INTO tipos_presupuesto_detalles
      (id_tipo_presupuesto, codigo, descripcion, orden, cant_max_det, col_doc,
       codigo_subtotal, nombre_subtotal,
       ver_sw_exento, ver_cantidad, ver_valor, ver_total, activo)
    VALUES
      (v_id_tipo_presupuesto, v_codigo, v_descripcion, COALESCE(v_orden, 0),
       COALESCE(v_cant_max_det, 10), COALESCE(v_col_doc, 1), v_codigo_subtotal, v_nombre_subtotal,
       COALESCE(v_ver_sw_exento, FALSE), COALESCE(v_ver_cantidad, FALSE),
       COALESCE(v_ver_valor, FALSE), COALESCE(v_ver_total, FALSE),
       COALESCE(v_activo, TRUE))
    RETURNING id INTO v_id_nuevo;
    SELECT json_build_object(
      'message', 'Detalle de tipo presupuesto creado correctamente',
      'data',    row_to_json(d.*)
    ) INTO v_result
    FROM (
      SELECT id, id_tipo_presupuesto, codigo, descripcion, orden, cant_max_det, col_doc,
             codigo_subtotal, nombre_subtotal,
             ver_sw_exento, ver_cantidad, ver_valor, ver_total,
             activo, created_at, updated_at
      FROM tipos_presupuesto_detalles WHERE id = v_id_nuevo
    ) d;
    RETURN v_result;

  ELSIF p_opcion = 4 THEN
    UPDATE tipos_presupuesto_detalles SET
      id_tipo_presupuesto = COALESCE(v_id_tipo_presupuesto, id_tipo_presupuesto),
      codigo              = COALESCE(v_codigo,              codigo),
      descripcion         = COALESCE(v_descripcion,         descripcion),
      orden               = COALESCE(v_orden,               orden),
      cant_max_det        = COALESCE(v_cant_max_det,        cant_max_det),
      col_doc             = COALESCE(v_col_doc,             col_doc),
      codigo_subtotal     = COALESCE(v_codigo_subtotal,     codigo_subtotal),
      nombre_subtotal     = COALESCE(v_nombre_subtotal,     nombre_subtotal),
      ver_sw_exento       = COALESCE(v_ver_sw_exento,       ver_sw_exento),
      ver_cantidad        = COALESCE(v_ver_cantidad,        ver_cantidad),
      ver_valor           = COALESCE(v_ver_valor,           ver_valor),
      ver_total           = COALESCE(v_ver_total,           ver_total),
      activo              = COALESCE(v_activo,              activo)
    WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Detalle con id % no encontrado', v_id;
    END IF;
    SELECT json_build_object(
      'message', 'Detalle de tipo presupuesto actualizado correctamente',
      'data',    row_to_json(d.*)
    ) INTO v_result
    FROM (
      SELECT id, id_tipo_presupuesto, codigo, descripcion, orden, cant_max_det, col_doc,
             codigo_subtotal, nombre_subtotal,
             ver_sw_exento, ver_cantidad, ver_valor, ver_total,
             activo, created_at, updated_at
      FROM tipos_presupuesto_detalles WHERE id = v_id
    ) d;
    RETURN v_result;

  ELSIF p_opcion = 5 THEN
    DELETE FROM tipos_presupuesto_detalles WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Detalle con id % no encontrado', v_id;
    END IF;
    RETURN json_build_object(
      'message', 'Detalle de tipo presupuesto eliminado correctamente',
      'data',    json_build_object('id', v_id)
    );

  ELSE
    RAISE EXCEPTION 'Opción inválida: %', p_opcion;
  END IF;

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Empresas (id: PB=1, BS=2, BG=3)
INSERT INTO empresas (codigo, rut, razon_social, activo)
VALUES
  ('PB', '76.000.001-0', 'PE BUR', TRUE),
  ('BS', '76.000.002-0', 'BURS',   TRUE),
  ('BG', '76.000.003-0', 'BURG',   TRUE)
ON CONFLICT DO NOTHING;

-- Tipos de presupuesto
-- PB (id_empresa=1): PARTICULAR (id=1), PYD (id=2)
-- BG (id_empresa=3): PARABRISAS (id=3)
INSERT INTO tipos_presupuesto (id_empresa, codigo, descripcion, id_tipo_dte, activo)
VALUES
  (1, 'PARTICULAR',  'Particular',        NULL, TRUE),
  (1, 'PYD',         'Piezas y Detalles', NULL, TRUE),
  (3, 'PARABRISAS',  'Parabrisas',        NULL, TRUE)
ON CONFLICT DO NOTHING;

-- Detalles: PARTICULAR (id_tipo_presupuesto=1)
--   RP: Caso 2 → ver_valor=TRUE, resto FALSE
--   DS: Caso 1 → todos FALSE
--   PT: Caso 1 → todos FALSE
--   MC: Caso 1 → todos FALSE
INSERT INTO tipos_presupuesto_detalles
  (id_tipo_presupuesto, codigo, descripcion, orden, cant_max_det,
   codigo_subtotal, nombre_subtotal,
   ver_sw_exento, ver_cantidad, ver_valor, ver_total, activo, col_doc)
VALUES
  (1, 'RP', 'Repuestos',     1, 40, 'REP', 'Subtotal Repuestos',    FALSE, FALSE, TRUE,  FALSE, TRUE, 1),
  (1, 'DS', 'Diagnóstico',   2, 10, 'DS',  'Subtotal Diagnóstico',  FALSE, FALSE, FALSE, FALSE, TRUE, 2),
  (1, 'PT', 'Pintura',       3, 10, 'PT',  'Subtotal Pintura',      FALSE, FALSE, FALSE, FALSE, TRUE, 2),
  (1, 'MC', 'Mano de Obra',  4, 20, 'MO',  'Subtotal Mano de Obra', FALSE, FALSE, FALSE, FALSE, TRUE, 2)
ON CONFLICT DO NOTHING;

-- Detalles: PYD (id_tipo_presupuesto=2)
--   RP: Caso 2 → ver_valor=TRUE, resto FALSE
--   MO: Caso 1 → todos FALSE
INSERT INTO tipos_presupuesto_detalles
  (id_tipo_presupuesto, codigo, descripcion, orden, cant_max_det,
   codigo_subtotal, nombre_subtotal,
   ver_sw_exento, ver_cantidad, ver_valor, ver_total, activo,col_doc)
VALUES
  (2, 'RP', 'Repuestos',    1, 50, 'REP', 'Subtotal Repuestos',    FALSE, FALSE, TRUE,  FALSE, TRUE, 1),
  (2, 'MO', 'Mano de Obra', 2, 50, 'MO',  'Subtotal Mano de Obra', FALSE, FALSE, FALSE, FALSE, TRUE, 2)
ON CONFLICT DO NOTHING;

-- Detalles: PARABRISAS (id_tipo_presupuesto=3)
--   RP: Caso 2 → ver_valor=TRUE, resto FALSE
INSERT INTO tipos_presupuesto_detalles
  (id_tipo_presupuesto, codigo, descripcion, orden, cant_max_det,
   codigo_subtotal, nombre_subtotal,
   ver_sw_exento, ver_cantidad, ver_valor, ver_total, activo, col_doc)
VALUES
  (3, 'RP', 'Repuestos', 1, 50, 'REP', 'Subtotal Repuestos', FALSE, FALSE, TRUE, FALSE, TRUE, 1)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 16: presupuesto_numeracion  (correlativo por empresa)
-- ============================================================================

CREATE TABLE IF NOT EXISTS presupuesto_numeracion (
  id_empresa    BIGINT  PRIMARY KEY REFERENCES empresas(id) ON DELETE CASCADE,
  ultimo_numero INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- 17: presupuestos  (FK → empresas; soft FK → vehiculos, contribuyentes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS presupuestos (
  id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_empresa              BIGINT      NOT NULL REFERENCES empresas(id)          ON DELETE RESTRICT,
  numero                  INTEGER     NOT NULL,
  folio                   VARCHAR(20),
  fecha_registro          DATE        NOT NULL DEFAULT CURRENT_DATE,
  fecha_presupuesto       DATE        NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento       DATE,
  fecha_recepcion         DATE,
  fecha_entrega           DATE,
  estado                  VARCHAR(20) NOT NULL DEFAULT 'BORRADOR'
                            CHECK (estado IN ('BORRADOR','ENVIADO','FACTURADO','ANULADO')),

  id_tipo_presupuesto     BIGINT      REFERENCES tipos_presupuesto(id)          ON DELETE RESTRICT,

  -- Vehículo (snapshot + soft FK)
  id_vehiculo             BIGINT      REFERENCES vehiculos(id)                  ON DELETE RESTRICT,
  patente                 VARCHAR(10),
  id_modelo               BIGINT      REFERENCES modelos(id)                    ON DELETE RESTRICT,
  anio                    SMALLINT,
  color                   VARCHAR(50),

  -- Cliente (snapshot + soft FK)
  id_cliente              BIGINT      REFERENCES contribuyentes(id)             ON DELETE RESTRICT,
  cliente_rut             VARCHAR(20),
  cliente_nombre          VARCHAR(300),
  cliente_giro            VARCHAR(300),
  cliente_id_comuna       BIGINT      REFERENCES comunas(id)                    ON DELETE RESTRICT,
  cliente_direccion       VARCHAR(300),
  cliente_email           VARCHAR(300),
  cliente_telefono        VARCHAR(20),

  -- Contribuyente receptor (snapshot + soft FK)
  id_contribuyente        BIGINT      REFERENCES contribuyentes(id)             ON DELETE RESTRICT,
  contribuyente_rut       VARCHAR(20),
  contribuyente_nombre    VARCHAR(300),
  contribuyente_giro      VARCHAR(300),
  contribuyente_id_comuna BIGINT      REFERENCES comunas(id)                    ON DELETE RESTRICT,
  contribuyente_direccion VARCHAR(300),

  -- Totales
  neto                    NUMERIC(14,2) NOT NULL DEFAULT 0,
  exento                  NUMERIC(14,2) NOT NULL DEFAULT 0,
  porcentaje_iva          NUMERIC(5,2)  NOT NULL DEFAULT 19.00,
  iva                     NUMERIC(14,2) NOT NULL DEFAULT 0,
  bruto                   NUMERIC(14,2) NOT NULL DEFAULT 0,

  -- Observación libre
  observacion             VARCHAR(500),

  -- Flags (ocultos en vista)
  sw_facturar             BOOLEAN NOT NULL DEFAULT FALSE,
  sw_mismo_cliente        BOOLEAN NOT NULL DEFAULT TRUE,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (id_empresa, numero)
);

--ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS observacion VARCHAR(500);

CREATE UNIQUE INDEX IF NOT EXISTS idx_presupuestos_empresa_numero
  ON presupuestos (id_empresa, numero);
CREATE INDEX IF NOT EXISTS idx_presupuestos_id_vehiculo
  ON presupuestos (id_vehiculo)    WHERE id_vehiculo    IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_presupuestos_id_cliente
  ON presupuestos (id_cliente)     WHERE id_cliente     IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_presupuestos_id_contribuyente
  ON presupuestos (id_contribuyente) WHERE id_contribuyente IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_presupuestos_estado
  ON presupuestos (id_empresa, estado);

CREATE TRIGGER trg_presupuestos_updated_at
  BEFORE UPDATE ON presupuestos
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================================
-- 18: presupuesto_detalles  (FK → presupuestos, tipos_presupuesto_detalles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS presupuesto_detalles (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_presupuesto  BIGINT        NOT NULL REFERENCES presupuestos(id)                ON DELETE CASCADE,
  id_tipo_detalle BIGINT                 REFERENCES tipos_presupuesto_detalles(id)  ON DELETE RESTRICT,
  orden           SMALLINT      NOT NULL DEFAULT 1,
  descripcion     TEXT          NOT NULL,
  sw_exento       BOOLEAN       NOT NULL DEFAULT FALSE,
  cantidad        NUMERIC(10,2) NOT NULL DEFAULT 1,
  valor           NUMERIC(14,2) NOT NULL DEFAULT 0,
  total           NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pres_det_id_presupuesto
  ON presupuesto_detalles (id_presupuesto);

-- ============================================================================
-- 19: presupuesto_subtotales  (FK → presupuestos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS presupuesto_subtotales (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_presupuesto   BIGINT        NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  orden            SMALLINT      NOT NULL DEFAULT 1,
  codigo_subtotal  VARCHAR(20)   NOT NULL,
  nombre_subtotal  VARCHAR(100)  NOT NULL,
  monto            NUMERIC(14,2) NOT NULL DEFAULT 0,
  UNIQUE (id_presupuesto, codigo_subtotal)
);

CREATE INDEX IF NOT EXISTS idx_pres_sub_id_presupuesto
  ON presupuesto_subtotales (id_presupuesto);

-- ============================================================================
-- Helpers: fn_presupuesto_get_or_create_marca / modelo
-- (usados por upsert de vehículos cuando se crea desde el SP)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_presupuesto_get_or_create_marca(
  p_descripcion TEXT
) RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE
  v_id    BIGINT;
  v_code  VARCHAR(10);
BEGIN
  v_code := SUBSTRING(UPPER(REPLACE(TRIM(p_descripcion), ' ', '')), 1, 10);
  SELECT id INTO v_id FROM marcas WHERE codigo = v_code LIMIT 1;
  IF FOUND THEN RETURN v_id; END IF;
  LOOP
    BEGIN
      INSERT INTO marcas (codigo, descripcion, activo)
      VALUES (v_code, TRIM(p_descripcion), TRUE)
      RETURNING id INTO v_id;
      RETURN v_id;
    EXCEPTION WHEN unique_violation THEN
      SELECT id INTO v_id FROM marcas WHERE codigo = v_code LIMIT 1;
      IF FOUND THEN RETURN v_id; END IF;
    END;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION fn_presupuesto_get_or_create_modelo(
  p_descripcion TEXT,
  p_id_marca    BIGINT
) RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE
  v_id    BIGINT;
  v_code  VARCHAR(10);
BEGIN
  v_code := SUBSTRING(UPPER(REPLACE(TRIM(p_descripcion), ' ', '')), 1, 10);
  SELECT id INTO v_id FROM modelos WHERE codigo = v_code AND id_marca = p_id_marca LIMIT 1;
  IF FOUND THEN RETURN v_id; END IF;
  LOOP
    BEGIN
      INSERT INTO modelos (codigo, descripcion, id_marca, activo)
      VALUES (v_code, TRIM(p_descripcion), p_id_marca, TRUE)
      RETURNING id INTO v_id;
      RETURN v_id;
    EXCEPTION WHEN unique_violation THEN
      SELECT id INTO v_id FROM modelos WHERE codigo = v_code AND id_marca = p_id_marca LIMIT 1;
      IF FOUND THEN RETURN v_id; END IF;
    END;
  END LOOP;
END;
$$;

-- ============================================================================
-- sp_presupuestos
-- Opciones:
--   1 = lista por empresa (filtros: estado, fecha_desde, fecha_hasta)
--   2 = get by id (incluye detalles, subtotales, id_marca, id_region cliente/contribuyente)
--   3 = crear (correlativo atómico + upsert vehículo/cliente/contribuyente)
--   4 = actualizar
--   5 = eliminar (solo BORRADOR)
--   6 = lookup por patente
--   7 = lookup por RUT
--   8 = config tipo presupuesto
--   9 = documento completo para PDF
--  10 = lookup por código de empresa + número de presupuesto
-- ============================================================================

CREATE OR REPLACE FUNCTION sp_presupuestos(
  p_opcion INTEGER,
  p_data   JSONB DEFAULT '{}'
) RETURNS JSON AS $$
DECLARE
  -- Identificadores
  v_id              BIGINT   := (p_data->>'id')::BIGINT;
  v_id_empresa      BIGINT   := (p_data->>'id_empresa')::BIGINT;
  v_id_nuevo        BIGINT;

  -- Cabecera
  v_folio           VARCHAR  := NULLIF(TRIM(p_data->>'folio'), '');
  v_fecha_registro  DATE     := NULLIF(p_data->>'fecha_registro',  '')::DATE;
  v_fecha_presup    DATE     := NULLIF(p_data->>'fecha_presupuesto','')::DATE;
  v_fecha_venc      DATE     := NULLIF(p_data->>'fecha_vencimiento','')::DATE;
  v_fecha_recep     DATE     := NULLIF(p_data->>'fecha_recepcion',  '')::DATE;
  v_fecha_entrega   DATE     := NULLIF(p_data->>'fecha_entrega',    '')::DATE;
  v_estado          VARCHAR  := NULLIF(TRIM(p_data->>'estado'), '');
  v_id_tipo_pres    BIGINT   := NULLIF(p_data->>'id_tipo_presupuesto','')::BIGINT;

  -- Vehículo
  v_patente         VARCHAR  := UPPER(REGEXP_REPLACE(TRIM(COALESCE(p_data->>'patente','')), '[^A-Z0-9]','','g'));
  v_id_modelo       BIGINT   := NULLIF(p_data->>'id_modelo',  '')::BIGINT;
  v_id_marca        BIGINT;
  v_anio            SMALLINT := NULLIF(p_data->>'anio',        '')::SMALLINT;
  v_color           VARCHAR  := NULLIF(TRIM(p_data->>'color'), '');
  v_id_vehiculo     BIGINT;

  -- Cliente
  v_cliente_rut     VARCHAR  := UPPER(REPLACE(REPLACE(TRIM(COALESCE(p_data->>'cliente_rut','')),'.',''),' ',''));
  v_cliente_nombre  VARCHAR  := NULLIF(TRIM(p_data->>'cliente_nombre'),  '');
  v_cliente_giro    VARCHAR  := NULLIF(TRIM(p_data->>'cliente_giro'),    '');
  v_cliente_id_com  BIGINT   := NULLIF(p_data->>'cliente_id_comuna',     '')::BIGINT;
  v_cliente_dir     VARCHAR  := NULLIF(TRIM(p_data->>'cliente_direccion'),'');
  v_cliente_email   VARCHAR  := NULLIF(TRIM(p_data->>'cliente_email'),   '');
  v_cliente_tel     VARCHAR  := NULLIF(TRIM(p_data->>'cliente_telefono'),'');
  v_id_cliente      BIGINT;

  -- Contribuyente
  v_contrib_rut     VARCHAR  := UPPER(REPLACE(REPLACE(TRIM(COALESCE(p_data->>'contribuyente_rut','')),'.',''),' ',''));
  v_contrib_nombre  VARCHAR  := NULLIF(TRIM(p_data->>'contribuyente_nombre'),  '');
  v_contrib_giro    VARCHAR  := NULLIF(TRIM(p_data->>'contribuyente_giro'),    '');
  v_contrib_id_com  BIGINT   := NULLIF(p_data->>'contribuyente_id_comuna',     '')::BIGINT;
  v_contrib_dir     VARCHAR  := NULLIF(TRIM(p_data->>'contribuyente_direccion'),'');
  v_id_contribuy    BIGINT;

  -- Totales
  v_neto            NUMERIC  := NULLIF(p_data->>'neto',          '')::NUMERIC;
  v_exento          NUMERIC  := NULLIF(p_data->>'exento',         '')::NUMERIC;
  v_porcentaje_iva  NUMERIC  := NULLIF(p_data->>'porcentaje_iva', '')::NUMERIC;
  v_iva             NUMERIC  := NULLIF(p_data->>'iva',            '')::NUMERIC;
  v_bruto           NUMERIC  := NULLIF(p_data->>'bruto',          '')::NUMERIC;

  -- Observación
  v_observacion     TEXT     := NULLIF(TRIM(p_data->>'observacion'), '');

  -- Flags
  v_sw_facturar     BOOLEAN  := NULLIF(p_data->>'sw_facturar',    '')::BOOLEAN;
  v_sw_mismo_cli    BOOLEAN  := NULLIF(p_data->>'sw_mismo_cliente','')::BOOLEAN;

  -- Filtros lista
  v_fecha_desde     DATE     := NULLIF(p_data->>'fecha_desde','')::DATE;
  v_fecha_hasta     DATE     := NULLIF(p_data->>'fecha_hasta','')::DATE;

  v_numero_nuevo    INTEGER;
  v_result          JSON;
BEGIN

  -- =========================================================================
  -- OPCION 1: Lista por empresa
  -- =========================================================================
  IF p_opcion = 1 THEN
    SELECT json_build_object(
      'message', 'Lista de presupuestos',
      'data',    COALESCE(json_agg(row_to_json(p.*) ORDER BY p.numero DESC), '[]')
    ) INTO v_result
    FROM (
      SELECT pr.id, pr.id_empresa, pr.numero, pr.folio,
             pr.fecha_presupuesto, pr.estado,
             pr.id_tipo_presupuesto,
             pr.id_vehiculo, pr.patente,
             pr.id_modelo,
             mo.descripcion                AS modelo,
             mo.id_marca                   AS id_marca,
             ma.descripcion                AS marca,
             pr.anio, pr.color,
             pr.id_cliente,
             pr.cliente_rut, pr.cliente_nombre,
             pr.neto, pr.exento, pr.porcentaje_iva, pr.iva, pr.bruto,
             pr.created_at, pr.updated_at
      FROM presupuestos pr
      LEFT JOIN modelos mo ON pr.id_modelo  = mo.id
      LEFT JOIN marcas  ma ON mo.id_marca   = ma.id
      WHERE pr.id_empresa  = v_id_empresa
        AND (v_estado      IS NULL OR pr.estado            = v_estado)
        AND (v_fecha_desde IS NULL OR pr.fecha_presupuesto >= v_fecha_desde)
        AND (v_fecha_hasta IS NULL OR pr.fecha_presupuesto <= v_fecha_hasta)
        AND (NULLIF(v_patente, '') IS NULL OR pr.patente   = v_patente)
    ) p;
    RETURN v_result;

  -- =========================================================================
  -- OPCION 2: Get by id
  -- =========================================================================
  ELSIF p_opcion = 2 THEN
    SELECT json_build_object(
      'message', 'Presupuesto obtenido',
      'data',    row_to_json(p.*)
    ) INTO v_result
    FROM (
      SELECT pr.*,
             -- Modelo y marca derivados de id_modelo
             mo.descripcion  AS modelo,
             mo.id_marca     AS id_marca,
             ma.descripcion  AS marca,
             -- Región cliente derivada de cliente_id_comuna
             com_cli.id_region AS cliente_id_region,
             -- Región contribuyente derivada de contribuyente_id_comuna
             com_con.id_region AS contribuyente_id_region,
             -- Detalles anidados
             COALESCE(
               (SELECT json_agg(row_to_json(d.*) ORDER BY d.orden)
                FROM presupuesto_detalles d
                WHERE d.id_presupuesto = pr.id),
               '[]'
             ) AS detalles,
             -- Subtotales anidados
             COALESCE(
               (SELECT json_agg(row_to_json(s.*) ORDER BY s.orden)
                FROM presupuesto_subtotales s
                WHERE s.id_presupuesto = pr.id),
               '[]'
             ) AS subtotales
      FROM presupuestos pr
      LEFT JOIN modelos mo     ON pr.id_modelo              = mo.id
      LEFT JOIN marcas  ma     ON mo.id_marca               = ma.id
      LEFT JOIN comunas com_cli ON pr.cliente_id_comuna     = com_cli.id
      LEFT JOIN comunas com_con ON pr.contribuyente_id_comuna = com_con.id
      WHERE pr.id = v_id
    ) p;
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Presupuesto con id % no encontrado', v_id;
    END IF;
    RETURN v_result;

  -- =========================================================================
  -- OPCION 3: Crear
  -- =========================================================================
  ELSIF p_opcion = 3 THEN

    -- Correlativo atómico por empresa
    INSERT INTO presupuesto_numeracion (id_empresa, ultimo_numero)
    VALUES (v_id_empresa, 1)
    ON CONFLICT (id_empresa) DO UPDATE
      SET ultimo_numero = presupuesto_numeracion.ultimo_numero + 1
    RETURNING ultimo_numero INTO v_numero_nuevo;

    -- Upsert vehículo por patente (ppu)
    IF v_patente <> '' THEN
      SELECT id INTO v_id_vehiculo FROM vehiculos WHERE ppu = v_patente LIMIT 1;
      IF FOUND THEN
        UPDATE vehiculos SET
          id_modelo = COALESCE(v_id_modelo, id_modelo),
          anio      = COALESCE(v_anio,      anio),
          color     = COALESCE(v_color,     color)
        WHERE id = v_id_vehiculo;
      ELSE
        -- Obtener id_marca desde el modelo seleccionado
        IF v_id_modelo IS NOT NULL THEN
          SELECT id_marca INTO v_id_marca FROM modelos WHERE id = v_id_modelo;
        END IF;
        IF v_id_marca IS NOT NULL AND v_id_modelo IS NOT NULL THEN
          INSERT INTO vehiculos (ppu, id_marca, id_modelo, anio, color, activo)
          VALUES (v_patente, v_id_marca, v_id_modelo, v_anio, v_color, TRUE)
          RETURNING id INTO v_id_vehiculo;
        END IF;
      END IF;
    END IF;

    -- Upsert cliente
    IF v_cliente_rut <> '' THEN
      SELECT id INTO v_id_cliente FROM contribuyentes WHERE rut = v_cliente_rut LIMIT 1;
      IF FOUND THEN
        UPDATE contribuyentes SET
          nombre    = COALESCE(v_cliente_nombre, nombre),
          giro      = COALESCE(v_cliente_giro,   giro),
          id_comuna = COALESCE(v_cliente_id_com, id_comuna),
          direccion = COALESCE(v_cliente_dir,    direccion),
          email     = COALESCE(v_cliente_email,  email),
          telefono  = COALESCE(v_cliente_tel,    telefono)
        WHERE id = v_id_cliente;
      ELSE
        INSERT INTO contribuyentes (rut, nombre, giro, id_comuna, direccion, email, telefono, activo)
        VALUES (v_cliente_rut, COALESCE(v_cliente_nombre,''), v_cliente_giro,
                v_cliente_id_com, v_cliente_dir, v_cliente_email, v_cliente_tel, TRUE)
        RETURNING id INTO v_id_cliente;
      END IF;
    END IF;

    -- Upsert contribuyente receptor (si viene RUT distinto)
    IF v_contrib_rut <> '' THEN
      SELECT id INTO v_id_contribuy FROM contribuyentes WHERE rut = v_contrib_rut LIMIT 1;
      IF NOT FOUND THEN
        INSERT INTO contribuyentes (rut, nombre, giro, id_comuna, direccion, activo)
        VALUES (v_contrib_rut, COALESCE(v_contrib_nombre,''), v_contrib_giro,
                v_contrib_id_com, v_contrib_dir, TRUE)
        RETURNING id INTO v_id_contribuy;
      END IF;
    END IF;

    -- Insertar presupuesto
    INSERT INTO presupuestos (
      id_empresa, numero, folio,
      fecha_registro, fecha_presupuesto, fecha_vencimiento, fecha_recepcion, fecha_entrega,
      estado, id_tipo_presupuesto,
      id_vehiculo, patente, id_modelo, anio, color,
      id_cliente, cliente_rut, cliente_nombre, cliente_giro,
        cliente_id_comuna, cliente_direccion, cliente_email, cliente_telefono,
      id_contribuyente, contribuyente_rut, contribuyente_nombre,
        contribuyente_giro, contribuyente_id_comuna, contribuyente_direccion,
      neto, exento, porcentaje_iva, iva, bruto,
      sw_facturar, sw_mismo_cliente, observacion
    ) VALUES (
      v_id_empresa, v_numero_nuevo, v_folio,
      COALESCE(v_fecha_registro, CURRENT_DATE),
      COALESCE(v_fecha_presup,   CURRENT_DATE),
      v_fecha_venc, v_fecha_recep, v_fecha_entrega,
      COALESCE(v_estado, 'BORRADOR'), v_id_tipo_pres,
      v_id_vehiculo, NULLIF(v_patente,''), v_id_modelo, v_anio, v_color,
      v_id_cliente, NULLIF(v_cliente_rut,''), v_cliente_nombre, v_cliente_giro,
        v_cliente_id_com, v_cliente_dir, v_cliente_email, v_cliente_tel,
      v_id_contribuy, NULLIF(v_contrib_rut,''), v_contrib_nombre,
        v_contrib_giro, v_contrib_id_com, v_contrib_dir,
      COALESCE(v_neto, 0), COALESCE(v_exento, 0),
      COALESCE(v_porcentaje_iva, 19.00),
      COALESCE(v_iva,   0), COALESCE(v_bruto,  0),
      COALESCE(v_sw_facturar,  FALSE),
      COALESCE(v_sw_mismo_cli, TRUE),
      v_observacion
    )
    RETURNING id INTO v_id_nuevo;

    RETURN sp_presupuestos(2, json_build_object('id', v_id_nuevo)::jsonb);

  -- =========================================================================
  -- OPCION 4: Actualizar
  -- =========================================================================
  ELSIF p_opcion = 4 THEN
    UPDATE presupuestos SET
      folio                   = COALESCE(v_folio,            folio),
      fecha_registro          = COALESCE(v_fecha_registro,   fecha_registro),
      fecha_presupuesto       = COALESCE(v_fecha_presup,     fecha_presupuesto),
      fecha_vencimiento       = CASE WHEN p_data::jsonb ? 'fecha_vencimiento' THEN v_fecha_venc  ELSE fecha_vencimiento END,
      fecha_recepcion         = CASE WHEN p_data::jsonb ? 'fecha_recepcion'   THEN v_fecha_recep ELSE fecha_recepcion   END,
      fecha_entrega           = CASE WHEN p_data::jsonb ? 'fecha_entrega'     THEN v_fecha_entrega ELSE fecha_entrega   END,
      estado                  = COALESCE(v_estado,           estado),
      id_tipo_presupuesto     = COALESCE(v_id_tipo_pres,     id_tipo_presupuesto),
      -- Vehículo
      id_vehiculo             = COALESCE(v_id_vehiculo,      id_vehiculo),
      patente                 = CASE WHEN v_patente <> ''    THEN v_patente    ELSE patente    END,
      id_modelo               = COALESCE(v_id_modelo,        id_modelo),
      anio                    = COALESCE(v_anio,             anio),
      color                   = COALESCE(v_color,            color),
      -- Cliente
      id_cliente              = COALESCE(v_id_cliente,       id_cliente),
      cliente_rut             = CASE WHEN v_cliente_rut <> '' THEN v_cliente_rut ELSE cliente_rut END,
      cliente_nombre          = COALESCE(v_cliente_nombre,   cliente_nombre),
      cliente_giro            = COALESCE(v_cliente_giro,     cliente_giro),
      cliente_id_comuna       = COALESCE(v_cliente_id_com,   cliente_id_comuna),
      cliente_direccion       = COALESCE(v_cliente_dir,      cliente_direccion),
      cliente_email           = COALESCE(v_cliente_email,    cliente_email),
      cliente_telefono        = COALESCE(v_cliente_tel,      cliente_telefono),
      -- Contribuyente
      id_contribuyente        = COALESCE(v_id_contribuy,     id_contribuyente),
      contribuyente_rut       = CASE WHEN v_contrib_rut <> '' THEN v_contrib_rut ELSE contribuyente_rut END,
      contribuyente_nombre    = COALESCE(v_contrib_nombre,   contribuyente_nombre),
      contribuyente_giro      = COALESCE(v_contrib_giro,     contribuyente_giro),
      contribuyente_id_comuna = COALESCE(v_contrib_id_com,   contribuyente_id_comuna),
      contribuyente_direccion = COALESCE(v_contrib_dir,      contribuyente_direccion),
      -- Totales
      neto                    = COALESCE(v_neto,             neto),
      exento                  = COALESCE(v_exento,           exento),
      porcentaje_iva          = COALESCE(v_porcentaje_iva,   porcentaje_iva),
      iva                     = COALESCE(v_iva,              iva),
      bruto                   = COALESCE(v_bruto,            bruto),
      sw_facturar             = COALESCE(v_sw_facturar,      sw_facturar),
      sw_mismo_cliente        = COALESCE(v_sw_mismo_cli,     sw_mismo_cliente),
      observacion             = CASE WHEN p_data::jsonb ? 'observacion' THEN v_observacion ELSE observacion END
    WHERE id = v_id AND id_empresa = v_id_empresa;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Presupuesto con id % no encontrado', v_id;
    END IF;
    RETURN sp_presupuestos(2, json_build_object('id', v_id)::jsonb);

  -- =========================================================================
  -- OPCION 5: Eliminar (solo BORRADOR)
  -- =========================================================================
  ELSIF p_opcion = 5 THEN
    DELETE FROM presupuestos
    WHERE id = v_id AND id_empresa = v_id_empresa AND estado = 'BORRADOR';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Presupuesto no encontrado o no está en estado BORRADOR';
    END IF;
    RETURN json_build_object(
      'message', 'Presupuesto eliminado correctamente',
      'data',    json_build_object('id', v_id)
    );

  -- =========================================================================
  -- OPCION 6: Lookup por patente
  -- =========================================================================
  ELSIF p_opcion = 6 THEN
    v_patente := UPPER(REGEXP_REPLACE(TRIM(COALESCE(p_data->>'patente','')), '[^A-Z0-9]','','g'));
    SELECT json_build_object(
      'message', 'Vehículo encontrado',
      'data',    row_to_json(v.*)
    ) INTO v_result
    FROM (
      SELECT veh.id,
             veh.ppu                AS patente,
             veh.id_modelo,
             mo.descripcion         AS modelo,
             mo.id_marca,
             ma.descripcion         AS marca,
             veh.anio,
             veh.color,
             -- Último cliente asociado al vehículo (para pre-poblar form)
             (SELECT row_to_json(c.*)
              FROM contribuyentes c
              JOIN presupuestos pr ON pr.id_cliente = c.id
              WHERE pr.id_vehiculo = veh.id
              ORDER BY pr.created_at DESC LIMIT 1) AS ultimo_cliente
      FROM vehiculos veh
      LEFT JOIN modelos mo ON veh.id_modelo = mo.id
      LEFT JOIN marcas  ma ON mo.id_marca   = ma.id
      WHERE veh.ppu = v_patente
    ) v;
    IF v_result IS NULL THEN
      RETURN json_build_object('message', 'Vehículo no encontrado', 'data', NULL);
    END IF;
    RETURN v_result;

  -- =========================================================================
  -- OPCION 7: Lookup por RUT
  -- =========================================================================
  ELSIF p_opcion = 7 THEN
    v_cliente_rut := UPPER(REPLACE(REPLACE(TRIM(COALESCE(p_data->>'rut','')),'.',''),' ',''));
    SELECT json_build_object(
      'message', 'Contribuyente encontrado',
      'data',    row_to_json(c.*)
    ) INTO v_result
    FROM (
      SELECT con.id, con.rut, con.nombre, con.giro,
             con.id_comuna,
             com.id_region,
             con.direccion, con.email, con.telefono
      FROM contribuyentes con
      LEFT JOIN comunas com ON con.id_comuna = com.id
      WHERE con.rut = v_cliente_rut
    ) c;
    IF v_result IS NULL THEN
      RETURN json_build_object('message', 'Contribuyente no encontrado', 'data', NULL);
    END IF;
    RETURN v_result;

  -- =========================================================================
  -- OPCION 8: Config tipo presupuesto
  -- =========================================================================
  ELSIF p_opcion = 8 THEN
    SELECT json_build_object(
      'message', 'Configuración tipo presupuesto',
      'data',    row_to_json(t.*)
    ) INTO v_result
    FROM (
      SELECT tp.id, tp.codigo, tp.descripcion, tp.id_tipo_dte,
             COALESCE(
               (SELECT json_agg(row_to_json(d.*) ORDER BY d.orden)
                FROM tipos_presupuesto_detalles d
                WHERE d.id_tipo_presupuesto = tp.id AND d.activo = TRUE),
               '[]'
             ) AS detalles
      FROM tipos_presupuesto tp
      WHERE tp.id = (p_data->>'id_tipo_presupuesto')::BIGINT
    ) t;
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Tipo de presupuesto no encontrado';
    END IF;
    RETURN v_result;

  -- =========================================================================
  -- OPCION 9: Documento completo para generación de PDF
  -- Retorna empresa + encabezado + cliente + vehiculo + grupos + subtotales
  -- Los grupos incluyen col_doc, cant_max_det e ítems ya filtrados (sin vacíos)
  -- =========================================================================
  ELSIF p_opcion = 9 THEN
    SELECT json_build_object(
      'message', 'Documento presupuesto',
      'data', json_build_object(
        'empresa', (
          SELECT row_to_json(e.*)
          FROM (
            SELECT em.razon_social, em.nombre_fantasia, em.giro,
                   em.direccion, em.direccion_referencia, em.telefono, em.email, em.porcentaje_iva
            FROM empresas em
            JOIN presupuestos pr ON pr.id_empresa = em.id
            WHERE pr.id = v_id
          ) e
        ),
        'tipo_presupuesto', (
          SELECT row_to_json(tp.*)
          FROM (
            SELECT t.encabezado_linea1, t.encabezado_linea2,
                   t.logo_ancho, t.logo_alto, t.dias_validez
            FROM tipos_presupuesto t
            JOIN presupuestos pr ON pr.id_tipo_presupuesto = t.id
            WHERE pr.id = v_id
          ) tp
        ),
        'logo', (
          SELECT row_to_json(lg.*)
          FROM (
            SELECT el.mime_type, el.archivo
            FROM empresa_logo el
            JOIN presupuestos pr ON pr.id_empresa = el.id_empresa
            WHERE pr.id = v_id AND el.tipo = 'presupuesto'
          ) lg
        ),
        'encabezado', (
          SELECT row_to_json(enc.*)
          FROM (
            SELECT pr.numero, pr.fecha_presupuesto, pr.fecha_entrega,
                   pr.porcentaje_iva, pr.neto, pr.exento, pr.iva, pr.bruto,
                   pr.observacion
            FROM presupuestos pr
            WHERE pr.id = v_id
          ) enc
        ),
        'cliente', (
          SELECT row_to_json(c.*)
          FROM (
            SELECT pr.cliente_rut       AS rut,
                   pr.cliente_nombre    AS nombre,
                   pr.cliente_direccion AS direccion,
                   pr.cliente_telefono  AS telefono
            FROM presupuestos pr
            WHERE pr.id = v_id
          ) c
        ),
        'vehiculo', (
          SELECT row_to_json(v.*)
          FROM (
            SELECT pr.patente,
                   ma.descripcion AS marca,
                   mo.descripcion AS modelo,
                   pr.anio, pr.color
            FROM presupuestos pr
            LEFT JOIN modelos mo ON pr.id_modelo = mo.id
            LEFT JOIN marcas  ma ON mo.id_marca  = ma.id
            WHERE pr.id = v_id
          ) v
        ),
        'grupos', (
          SELECT COALESCE(json_agg(g ORDER BY g.orden), '[]'::json)
          FROM (
            SELECT
              tpd.orden,
              tpd.col_doc,
              tpd.descripcion  AS header,
              tpd.cant_max_det,
              tpd.ver_cantidad,
              tpd.ver_valor,
              tpd.ver_total,
              COALESCE(
                (SELECT json_agg(
                   json_build_object(
                     'descripcion', pd.descripcion,
                     'cantidad',    pd.cantidad,
                     'valor',       pd.valor,
                     'total',       pd.total
                   )
                   ORDER BY pd.orden, pd.id
                 )
                 FROM presupuesto_detalles pd
                 WHERE pd.id_presupuesto  = v_id
                   AND pd.id_tipo_detalle = tpd.id
                   AND NULLIF(TRIM(pd.descripcion), '') IS NOT NULL
                ),
                '[]'::json
              ) AS items
            FROM tipos_presupuesto_detalles tpd
            WHERE tpd.id_tipo_presupuesto = (
              SELECT id_tipo_presupuesto FROM presupuestos WHERE id = v_id
            )
            AND tpd.activo = TRUE
          ) g
        ),
        'subtotales', (
          SELECT COALESCE(
            json_agg(
              json_build_object('nombre', ps.nombre_subtotal, 'monto', ps.monto)
              ORDER BY ps.orden
            ),
            '[]'::json
          )
          FROM presupuesto_subtotales ps
          WHERE ps.id_presupuesto = v_id
        )
      )
    ) INTO v_result;

    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Presupuesto % no encontrado', v_id;
    END IF;
    RETURN v_result;

  -- =========================================================================
  -- OPCION 10: Lookup por código de empresa + número de presupuesto
  -- Retorna solo { id } para que el frontend pueda redirigir a /presupuestos/:id
  -- =========================================================================
  ELSIF p_opcion = 10 THEN
    SELECT json_build_object(
      'message', 'Presupuesto encontrado',
      'data',    json_build_object('id', p.id)
    ) INTO v_result
    FROM presupuestos p
    JOIN empresas e ON e.id = p.id_empresa
    WHERE UPPER(TRIM(e.codigo)) = UPPER(TRIM(COALESCE(p_data->>'codigo_empresa', '')))
      AND p.numero = (p_data->>'numero')::INTEGER;

    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Presupuesto no encontrado: empresa ''%'' número %',
        p_data->>'codigo_empresa', p_data->>'numero';
    END IF;
    RETURN v_result;

  ELSE
    RAISE EXCEPTION 'Opción inválida: %', p_opcion;
  END IF;

END;
$$ LANGUAGE plpgsql;

