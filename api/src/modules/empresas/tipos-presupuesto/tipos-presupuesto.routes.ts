import { createSPRouter } from '../../../lib/createSPRouter';
import { TipoPresupuestoSchema } from './tipos-presupuesto.schema';

export const tiposPresupuestoRouter = createSPRouter({
  spName: 'sp_tipos_presupuesto',
  schema: TipoPresupuestoSchema,
  global: false,
  extraOps: { export: true, resolve: true },
});
