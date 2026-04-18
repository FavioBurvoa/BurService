import { z } from 'zod';

export const EmpresaSchema = z.object({
  id:              z.number().int().positive().optional(),
  codigo:          z.string().max(20).optional(),
  rut:             z.string().max(20).optional(),
  razon_social:    z.string().max(300).optional(),
  nombre_fantasia: z.string().max(300).nullable().optional(),
  giro:            z.string().max(300).nullable().optional(),
  act_eco:         z.string().max(50).nullable().optional(),
  id_comuna:       z.coerce.number().int().positive().nullable().optional(),
  direccion:            z.string().max(300).nullable().optional(),
  direccion_referencia: z.string().max(300).nullable().optional(),
  email:                z.string().max(300).email('Formato de email inválido').nullable().optional(),
  telefono:        z.string().max(20).nullable().optional(),
  numero_resolucion_sii: z.coerce.number().int().positive().nullable().optional(),
  fecha_resolucion_sii:  z.string().nullable().optional(),
  porcentaje_iva:        z.coerce.number().min(0).max(100).optional(),
  ambiente:              z.coerce.number().int().min(1).max(2).optional(),
  activo:                z.boolean().optional(),
});

export type EmpresaInput = z.infer<typeof EmpresaSchema>;
