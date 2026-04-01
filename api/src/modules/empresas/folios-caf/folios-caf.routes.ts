import { createSPRouter } from '../../../lib/createSPRouter';
import { FolioCafSchema } from './folios-caf.schema';

export const foliosCafRouter = createSPRouter({
  spName: 'sp_folios_caf',
  schema: FolioCafSchema,
  global: false,
});
