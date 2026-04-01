import { z } from 'zod';

export const CertificadoDteSchema = z.object({
  id:                 z.number().int().positive().optional(),
  id_empresa:         z.coerce.number().int().positive().optional(),
  descripcion:        z.string().max(300).optional(),
  nombre_archivo:     z.string().max(300).optional(),
  mime_type:          z.string().max(100).optional(),
  certificado:        z.string().optional(),
  password:           z.string().max(300).nullable().optional(),
  fecha_vencimiento:  z.string().nullable().optional(),
  activo:             z.boolean().optional(),
});

export type CertificadoDteInput = z.infer<typeof CertificadoDteSchema>;
