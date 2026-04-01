import { createSPRouter } from '../../../lib/createSPRouter';
import { CertificadoDteSchema } from './certificados-dte.schema';

export const certificadosDteRouter = createSPRouter({
  spName: 'sp_certificados_dte',
  schema: CertificadoDteSchema,
  global: false,
});
