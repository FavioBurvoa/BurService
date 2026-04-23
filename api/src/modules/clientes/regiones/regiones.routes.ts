import { createSPRouter } from '../../../lib/createSPRouter';
import { RegionSchema } from './regiones.schema';

export const regionesRouter = createSPRouter({
  spName: 'sp_regiones',
  schema: RegionSchema,
  global: true,
  extraOps: { export: true, resolve: true },
});
