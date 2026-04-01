import { z } from 'zod';

export const RegionSchema = z.object({
  id:          z.number().int().positive().optional(),
  codigo:      z.string().max(10).optional(),
  descripcion: z.string().max(200).optional(),
  orden:       z.coerce.number().int().min(0).max(99).optional(),
  codigo_sii:  z.string().max(10).nullable().optional(),
  activo:      z.boolean().optional(),
});

export type RegionInput = z.infer<typeof RegionSchema>;
