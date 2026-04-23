import { createSPRouter } from '../../../lib/createSPRouter';
import { TipoPresupuestoDetalleSchema } from './tipos-presupuesto-detalles.schema';

export const tiposPresupuestoDetallesRouter = createSPRouter({
  spName: 'sp_tipos_presupuesto_detalles',
  schema: TipoPresupuestoDetalleSchema,
  global: false,
  contextField: 'id_tipo_presupuesto',
  extraOps: { export: true, resolve: true },
});
