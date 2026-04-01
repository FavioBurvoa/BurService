import { z } from 'zod';

export const ComunaSchema = z.object({
  id:          z.number().int().positive().optional(),
  id_region:   z.coerce.number().int().positive().optional(),
  codigo:      z.string().max(10).optional(),
  descripcion: z.string().max(200).optional(),
  orden:       z.coerce.number().int().min(0).max(999).optional(),
  codigo_sii:  z.string().max(10).nullable().optional(),
  activo:      z.boolean().optional(),
});

export type ComunaInput = z.infer<typeof ComunaSchema>;
