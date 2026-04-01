import { z } from 'zod';

export const TipoVehiculoSchema = z.object({
  id:          z.number().int().positive().optional(),
  codigo:      z.string().max(10).optional(),
  descripcion: z.string().max(200).optional(),
  activo:      z.boolean().optional(),
});

export type TipoVehiculoInput = z.infer<typeof TipoVehiculoSchema>;
