import type { ModeloInput } from './modelos.schema';

export const SP_NAME = 'sp_modelos';

/**
 * Firma SP:
 *   sp_modelos(p_opcion, p_empresa_id, p_id, p_codigo, p_descripcion, p_id_marca, p_activo)
 */
export function paramsMapper(opcion: number, body: ModeloInput): unknown[] {
  return [
    opcion,
    body.empresa_id,
    body.id          ?? null,
    body.codigo      ?? null,
    body.descripcion ?? null,
    body.idMarca     ?? null,
    body.activo      ?? null,
  ];
}
