import { z } from 'zod';

export const TipoPresupuestoDetalleSchema = z.object({
  id:                   z.number().int().positive().optional(),
  id_tipo_presupuesto:  z.coerce.number().int().positive().optional(),
  codigo:               z.string().max(10).optional(),
  descripcion:          z.string().max(100).optional(),
  orden:                z.coerce.number().int().min(0).optional(),
  cant_max_det:         z.coerce.number().int().min(1).optional(),
  col_doc:              z.coerce.number().int().min(1).max(2).optional(),
  codigo_subtotal:      z.string().max(10).optional(),
  nombre_subtotal:      z.string().max(50).optional(),
  ver_sw_exento:        z.boolean().optional(),
  ver_cantidad:         z.boolean().optional(),
  ver_valor:            z.boolean().optional(),
  ver_total:            z.boolean().optional(),
  activo:               z.boolean().optional(),
});

export type TipoPresupuestoDetalleInput = z.infer<typeof TipoPresupuestoDetalleSchema>;
