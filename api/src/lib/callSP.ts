import { sql } from '../config/db';
import type { SpResult } from '../types';

/**
 * Ejecuta un stored procedure con firma estándar de dos parámetros:
 *   sp_nombre(p_opcion INTEGER, p_data JSONB)
 *
 * CONTRATO: el SP debe retornar JSON con la forma { message, data }.
 *
 * Ejemplo de SP mínimo:
 *   RETURN json_build_object('message', 'Ok', 'data', row_to_json(r));
 *
 * @param spName  Nombre del SP (ej: 'sp_marcas'). Solo acepta nombres internos — nunca input de usuario.
 * @param opcion  Número de operación que determina qué hace el SP (1=listar, 2=obtener, 3=insertar, etc.)
 * @param data    Payload como objeto plano. El SP extrae los campos que necesita del JSONB.
 */
export async function callSP<T = unknown>(
  spName:  string,
  opcion:  number,
  data:    Record<string, unknown> = {},
): Promise<SpResult<T>> {
  // Usar tagged template literals (forma recomendada de postgres.js).
  // sql(spName) → identificador con comillas: "sp_tipos_vehiculo"
  // sql.json(data) → serializa el objeto como JSONB nativo sin double-encode
  // Cast a Parameters[0] porque postgres.js JSONValue es muy estricto y
  // Record<string, unknown> técnicamente puede contener Symbols/BigInts.
  const rows = await sql`
    SELECT ${sql(spName)}(${opcion}::integer, ${sql.json(data as Parameters<typeof sql.json>[0])}) AS result
  `;

  const result = rows[0]?.result as SpResult<T> | undefined;

  if (result === undefined || result === null) {
    throw new Error(`El procedimiento '${spName}' no retornó resultado`);
  }

  return result;
}
