import { z } from 'zod';

export const FolioCafSchema = z.object({
  id:                 z.number().int().positive().optional(),
  id_empresa:         z.coerce.number().int().positive().optional(),
  id_tipo_dte:        z.coerce.number().int().positive().optional(),
  folio_desde:        z.coerce.number().int().positive().optional(),
  folio_hasta:        z.coerce.number().int().positive().optional(),
  nombre_archivo:     z.string().max(300).optional(),
  mime_type:          z.string().max(100).optional(),
  fecha_vencimiento:  z.string().nullable().optional(),
  archivo_caf:        z.string().optional(),
  activo:             z.boolean().optional(),
});

export type FolioCafInput = z.infer<typeof FolioCafSchema>;
