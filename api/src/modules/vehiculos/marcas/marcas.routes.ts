import { createSPRouter } from '../../../lib/createSPRouter';
import { MarcaSchema } from './marcas.schema';

export const marcasRouter = createSPRouter({
  spName: 'sp_marcas',
  schema: MarcaSchema,
  global: true,
  extraOps: { export: true, resolve: true },
});
