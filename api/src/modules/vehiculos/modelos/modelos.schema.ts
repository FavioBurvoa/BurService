import { z } from 'zod';

export const ModeloSchema = z.object({
  id:          z.number().int().positive().optional(),
  codigo:      z.string().max(10).optional(),
  descripcion: z.string().max(200).optional(),
  id_marca:    z.coerce.number().int().positive().optional(),
  activo:      z.boolean().optional(),
});

export type ModeloInput = z.infer<typeof ModeloSchema>;
