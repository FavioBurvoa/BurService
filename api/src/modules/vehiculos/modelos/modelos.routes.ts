import { createSPRouter } from '../../../lib/createSPRouter';
import { ModeloSchema } from './modelos.schema';

export const modelosRouter = createSPRouter({
  spName: 'sp_modelos',
  schema: ModeloSchema,
  global: true,
  extraOps: { export: true, resolve: true },
});
