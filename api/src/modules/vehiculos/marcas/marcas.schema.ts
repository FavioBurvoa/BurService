import { z } from 'zod';

export const MarcaSchema = z.object({
  id:          z.number().int().positive().optional(),
  codigo:      z.string().max(10).optional(),
  descripcion: z.string().max(200).optional(),
  activo:      z.boolean().optional(),
});

export type MarcaInput = z.infer<typeof MarcaSchema>;
