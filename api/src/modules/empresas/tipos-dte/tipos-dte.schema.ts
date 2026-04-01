import { z } from 'zod';

export const TipoDteSchema = z.object({
  id:             z.number().int().positive().optional(),
  codigo:         z.string().max(10).optional(),
  descripcion:    z.string().max(200).optional(),
  sw_afecto:      z.boolean().optional(),
  sw_exento:      z.boolean().optional(),
  sw_electronico: z.boolean().optional(),
  activo:         z.boolean().optional(),
});

export type TipoDteInput = z.infer<typeof TipoDteSchema>;
