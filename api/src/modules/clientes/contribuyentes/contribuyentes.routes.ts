import { createSPRouter } from '../../../lib/createSPRouter';
import { ContribuyenteSchema } from './contribuyentes.schema';

export const contribuyentesRouter = createSPRouter({
  spName: 'sp_contribuyentes',
  schema: ContribuyenteSchema,
  global: true,
  extraOps: { export: true, resolve: true },
});
