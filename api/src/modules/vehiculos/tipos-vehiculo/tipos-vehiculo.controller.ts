import type { TipoVehiculoInput } from './tipos-vehiculo.schema';

export const SP_NAME = 'sp_tipos_vehiculo';

/**
 * Firma SP:
 *   sp_tipos_vehiculo(p_opcion, p_empresa_id, p_id, p_codigo, p_descripcion, p_activo)
 */
export function paramsMapper(opcion: number, body: TipoVehiculoInput): unknown[] {
  return [
    opcion,
    body.empresa_id,
    body.id          ?? null,
    body.codigo      ?? null,
    body.descripcion ?? null,
    body.activo      ?? null,
  ];
}
