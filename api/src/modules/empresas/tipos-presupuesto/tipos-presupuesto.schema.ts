import { z } from 'zod';

export const TipoPresupuestoSchema = z.object({
  id:          z.number().int().positive().optional(),
  id_empresa:  z.coerce.number().int().positive().optional(),
  codigo:      z.string().max(20).optional(),
  descripcion: z.string().max(200).optional(),
  id_tipo_dte: z.coerce.number().int().positive().nullable().optional(),
  activo:      z.boolean().optional(),
});

export type TipoPresupuestoInput = z.infer<typeof TipoPresupuestoSchema>;
