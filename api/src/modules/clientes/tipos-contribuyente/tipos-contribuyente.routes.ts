import { createSPRouter } from '../../../lib/createSPRouter';
import { TipoContribuyenteSchema } from './tipos-contribuyente.schema';

export const tiposContribuyenteRouter = createSPRouter({
  spName: 'sp_tipos_contribuyente',
  schema: TipoContribuyenteSchema,
  global: true,
  extraOps: { export: true, resolve: true },
});
