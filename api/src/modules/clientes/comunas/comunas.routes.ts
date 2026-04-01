import { createSPRouter } from '../../../lib/createSPRouter';
import { ComunaSchema } from './comunas.schema';

export const comunasRouter = createSPRouter({
  spName: 'sp_comunas',
  schema: ComunaSchema,
  global: true,
});
