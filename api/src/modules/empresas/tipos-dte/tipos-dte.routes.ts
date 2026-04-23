import { createSPRouter } from '../../../lib/createSPRouter';
import { TipoDteSchema } from './tipos-dte.schema';

export const tiposDteRouter = createSPRouter({
  spName: 'sp_tipos_dte',
  schema: TipoDteSchema,
  global: true,
  extraOps: { export: true, resolve: true },
});
