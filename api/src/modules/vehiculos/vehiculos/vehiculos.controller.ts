import type { VehiculoInput } from './vehiculos.schema';

export const SP_NAME = 'sp_vehiculos';

/**
 * Firma SP:
 *   sp_vehiculos(p_opcion, p_empresa_id, p_id, p_ppu, p_id_marca,
 *                p_id_modelo, p_anio, p_color, p_id_tipo_vehiculo, p_activo)
 */
export function paramsMapper(opcion: number, body: VehiculoInput): unknown[] {
  return [
    opcion,
    body.empresa_id,
    body.id             ?? null,
    body.ppu            ?? null,
    body.idMarca        ?? null,
    body.idModelo       ?? null,
    body.anio           ?? null,
    body.color          ?? null,
    body.idTipoVehiculo ?? null,
    body.activo         ?? null,
  ];
}
