import { createSPRouter } from '../../../lib/createSPRouter';
import { EmpresaSchema } from './empresas.schema';

export const empresasRouter = createSPRouter({
  spName: 'sp_empresas',
  schema: EmpresaSchema,
  global: true,
});
