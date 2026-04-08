import { createSPRouter } from '../../../lib/createSPRouter';
import { EmpresaLogoSchema } from './empresa-logo.schema';

export const empresaLogoRouter = createSPRouter({
  spName: 'sp_empresa_logo',
  schema: EmpresaLogoSchema,
  global: false,
});
