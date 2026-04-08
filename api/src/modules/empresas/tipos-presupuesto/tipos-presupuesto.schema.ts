import { z } from 'zod';

export const TipoPresupuestoSchema = z.object({
  id:                z.number().int().positive().optional(),
  id_empresa:        z.coerce.number().int().positive().optional(),
  codigo:            z.string().max(20).optional(),
  descripcion:       z.string().max(200).optional(),
  id_tipo_dte:       z.coerce.number().int().positive().nullable().optional(),
  encabezado_linea1: z.string().max(150).nullable().optional(),
  encabezado_linea2: z.string().max(150).nullable().optional(),
  logo_ancho:        z.coerce.number().int().min(20).max(300).nullable().optional(),
  logo_alto:         z.coerce.number().int().min(20).max(200).nullable().optional(),
  dias_validez:      z.coerce.number().int().min(1).nullable().optional(),
  activo:            z.boolean().optional(),
});

export type TipoPresupuestoInput = z.infer<typeof TipoPresupuestoSchema>;
