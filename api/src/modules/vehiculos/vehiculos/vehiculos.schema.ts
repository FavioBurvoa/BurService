import { z } from 'zod';

export const VehiculoSchema = z.object({
  id:               z.number().int().positive().optional(),
  ppu:              z.string().max(10).optional(),
  id_marca:         z.coerce.number().int().positive().optional(),
  id_modelo:        z.coerce.number().int().positive().optional(),
  anio:             z.coerce.number().int().min(1900).max(2100).nullable().optional(),
  color:            z.string().max(50).nullable().optional(),
  id_tipo_vehiculo: z.coerce.number().int().positive().nullable().optional(),
  activo:           z.boolean().optional(),
});

export type VehiculoInput = z.infer<typeof VehiculoSchema>;
