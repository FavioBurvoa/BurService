import { z } from 'zod';

const VehiculoSchema = z.object({
  patente:   z.string().max(10).optional(),
  id_marca:  z.coerce.number().int().positive().nullable().optional(),
  id_modelo: z.coerce.number().int().positive().nullable().optional(),
  anio:      z.coerce.number().int().min(1900).max(2100).nullable().optional(),
  color:     z.string().max(50).nullable().optional(),
});

const PersonaSchema = z.object({
  rut:       z.string().max(20).optional(),
  nombre:    z.string().max(300).optional(),
  giro:      z.string().max(300).nullable().optional(),
  id_comuna: z.coerce.number().int().positive().nullable().optional(),
  direccion: z.string().max(300).nullable().optional(),
  email:     z.string().max(300).nullable().optional(),
  telefono:  z.string().max(20).nullable().optional(),
});

const EncabezadoSchema = z.object({
  id:                   z.coerce.number().int().positive().optional(),
  id_empresa:           z.coerce.number().int().positive().optional(),
  numero:               z.coerce.number().int().positive().nullable().optional(),
  folio:                z.string().max(20).nullable().optional(),
  fecha_registro:       z.string().optional(),
  fecha_presupuesto:    z.string().optional(),
  fecha_vencimiento:    z.string().nullable().optional(),
  fecha_recepcion:      z.string().nullable().optional(),
  fecha_entrega:        z.string().nullable().optional(),
  estado:               z.enum(['BORRADOR', 'ENVIADO', 'FACTURADO', 'ANULADO']).optional(),
  id_tipo_presupuesto:  z.coerce.number().int().positive().nullable().optional(),
  porcentaje_iva:       z.coerce.number().optional(),
  neto:                 z.coerce.number().optional(),
  exento:               z.coerce.number().optional(),
  iva:                  z.coerce.number().optional(),
  bruto:                z.coerce.number().optional(),
  sw_facturar:          z.boolean().optional(),
  sw_mismo_cliente:     z.boolean().optional(),
  vehiculo:             VehiculoSchema.optional(),
  cliente:              PersonaSchema.optional(),
  contribuyente:        PersonaSchema.nullable().optional(),
});

const DetalleSchema = z.object({
  id:             z.coerce.number().int().positive().optional(),
  id_tipo_detalle: z.coerce.number().int().positive().nullable().optional(),
  orden:          z.coerce.number().int().optional(),
  descripcion:    z.string().optional(),
  sw_exento:      z.boolean().optional(),
  cantidad:       z.coerce.number().optional(),
  valor:          z.coerce.number().optional(),
  total:          z.coerce.number().optional(),
});

const SubtotalSchema = z.object({
  orden:           z.coerce.number().int().optional(),
  codigo_subtotal: z.string().max(20).optional(),
  nombre_subtotal: z.string().max(100).optional(),
  subtotal:        z.coerce.number().optional(),
});

export const PresupuestoSchema = z.object({
  encabezado: EncabezadoSchema.optional(),
  detalles:   z.array(DetalleSchema).optional(),
  subtotales: z.array(SubtotalSchema).optional(),
});

export type PresupuestoInput = z.infer<typeof PresupuestoSchema>;
export type EncabezadoInput  = z.infer<typeof EncabezadoSchema>;
export type DetalleInput     = z.infer<typeof DetalleSchema>;
export type SubtotalInput    = z.infer<typeof SubtotalSchema>;
