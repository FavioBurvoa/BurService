import { z } from 'zod';

export const TipoContribuyenteSchema = z.object({
  id:          z.number().int().positive().optional(),
  codigo:      z.string().max(10).optional(),
  descripcion: z.string().max(200).optional(),
  sw_factura:  z.boolean().optional(),
  activo:      z.boolean().optional(),
});

export type TipoContribuyenteInput = z.infer<typeof TipoContribuyenteSchema>;
