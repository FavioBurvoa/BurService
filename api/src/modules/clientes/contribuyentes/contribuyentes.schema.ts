import { z } from 'zod';

export const ContribuyenteSchema = z.object({
  id:                     z.number().int().positive().optional(),
  rut:                    z.string().max(20).optional(),
  nombre:                 z.string().max(300).optional(),
  apellidos:              z.string().max(300).optional(),
  giro:                   z.string().max(300).nullable().optional(),
  id_comuna:              z.coerce.number().int().positive().nullable().optional(),
  direccion:              z.string().max(300).nullable().optional(),
  email:                  z.string().max(300).email('Formato de email inválido').nullable().optional(),
  telefono:               z.string().max(20).nullable().optional(),
  telefono2:              z.string().max(20).nullable().optional(),
  activo:                 z.boolean().optional(),
  id_tipo_contribuyente:  z.array(z.coerce.number().int().positive()).optional(),
});

export type ContribuyenteInput = z.infer<typeof ContribuyenteSchema>;
