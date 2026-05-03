-- ============================================================================
-- seed.sql — Saga Ops
-- ============================================================================
-- IDEMPOTENTE (todos los INSERTs usan ON CONFLICT DO NOTHING).
-- Se ejecuta MANUALMENTE solo en bootstrap inicial:
--   docker compose --profile seed run --rm db-seed
-- Contiene catálogos permanentes (marcas, regiones, tipos DTE, etc.) y
-- datos de ejemplo de desarrollo.
-- ============================================================================

INSERT INTO marcas (codigo, descripcion, activo) VALUES
  ('TOY', 'Toyota',    TRUE),
  ('HON', 'Honda',     TRUE),
  ('FOR', 'Ford',      TRUE),
  ('CHE', 'Chevrolet', TRUE),
  ('NIS', 'Nissan',    FALSE)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO tipos_vehiculo (codigo, descripcion, activo) VALUES
  ('SED', 'Sedán',       TRUE),
  ('SUV', 'SUV',         TRUE),
  ('PIC', 'Pickup',      TRUE),
  ('HAT', 'Hatchback',   TRUE),
  ('VAN', 'Van',         TRUE),
  ('MOT', 'Motocicleta', FALSE)
ON CONFLICT (codigo) DO NOTHING;
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
INSERT INTO tipos_contribuyente (codigo, descripcion, sw_factura, activo) VALUES
  ('EMP', 'Empresa',         TRUE,  TRUE),
  ('PNP', 'Persona Natural', FALSE, TRUE),
  ('CSP', 'Sin Personalidad',FALSE, TRUE)
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO tipos_dte (codigo, descripcion, sw_afecto, sw_exento, sw_electronico, activo) VALUES
  (33, 'Factura Electrónica',                    TRUE,  FALSE, TRUE, TRUE),
  (34, 'Factura No Afecta o Exenta Electrónica', FALSE, TRUE,  TRUE, TRUE),
  (39, 'Boleta Electrónica',                     TRUE,  FALSE, TRUE, TRUE),
  (41, 'Boleta No Afecta o Exenta Electrónica',  FALSE, TRUE,  TRUE, TRUE),
  (52, 'Guía de Despacho Electrónica',           FALSE, FALSE, TRUE, TRUE),
  (56, 'Nota de Débito Electrónica',             FALSE, FALSE, TRUE, TRUE),
  (61, 'Nota de Crédito Electrónica',            FALSE, FALSE, TRUE, TRUE)
ON CONFLICT (codigo) DO NOTHING;
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
INSERT INTO empresas (codigo, rut, razon_social, activo)
VALUES
  ('PB', '76.000.001-0', 'PE BUR', TRUE),
  ('BS', '76.000.002-0', 'BURS',   TRUE),
  ('BG', '76.000.003-0', 'BURG',   TRUE)
ON CONFLICT DO NOTHING;
INSERT INTO tipos_presupuesto (id_empresa, codigo, descripcion, id_tipo_dte, activo)
VALUES
  (1, 'PARTICULAR',  'Particular',        NULL, TRUE),
  (1, 'PYD',         'Piezas y Detalles', NULL, TRUE),
  (3, 'PARABRISAS',  'Parabrisas',        NULL, TRUE)
ON CONFLICT DO NOTHING;
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
INSERT INTO tipos_presupuesto_detalles
  (id_tipo_presupuesto, codigo, descripcion, orden, cant_max_det,
   codigo_subtotal, nombre_subtotal,
   ver_sw_exento, ver_cantidad, ver_valor, ver_total, activo,col_doc)
VALUES
  (2, 'RP', 'Repuestos',    1, 50, 'REP', 'Subtotal Repuestos',    FALSE, FALSE, TRUE,  FALSE, TRUE, 1),
  (2, 'MO', 'Mano de Obra', 2, 50, 'MO',  'Subtotal Mano de Obra', FALSE, FALSE, FALSE, FALSE, TRUE, 2)
ON CONFLICT DO NOTHING;
INSERT INTO tipos_presupuesto_detalles
  (id_tipo_presupuesto, codigo, descripcion, orden, cant_max_det,
   codigo_subtotal, nombre_subtotal,
   ver_sw_exento, ver_cantidad, ver_valor, ver_total, activo, col_doc)
VALUES
  (3, 'RP', 'Repuestos', 1, 50, 'REP', 'Subtotal Repuestos', FALSE, FALSE, TRUE, FALSE, TRUE, 1)
ON CONFLICT DO NOTHING;