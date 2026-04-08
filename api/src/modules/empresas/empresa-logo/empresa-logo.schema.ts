import { z } from 'zod';

export const EmpresaLogoSchema = z.object({
  id:             z.number().int().positive().optional(),
  id_empresa:     z.coerce.number().int().positive().optional(),
  tipo:           z.string().max(20).optional(),
  nombre_archivo: z.string().max(300).optional(),
  mime_type:      z.string().max(20).optional(),
  archivo:        z.string().optional(),
});

export type EmpresaLogoInput = z.infer<typeof EmpresaLogoSchema>;
