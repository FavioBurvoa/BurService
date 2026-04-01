import type { MarcaInput } from './marcas.schema';

export const SP_NAME = 'sp_marcas';

/**
 * Firma SP:
 *   sp_marcas(p_opcion, p_empresa_id, p_id, p_codigo, p_descripcion, p_activo)
 */
export function paramsMapper(opcion: number, body: MarcaInput): unknown[] {
  return [
    opcion,
    body.empresa_id,
    body.id          ?? null,
    body.codigo      ?? null,
    body.descripcion ?? null,
    body.activo      ?? null,
  ];
}
