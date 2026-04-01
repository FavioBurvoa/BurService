import { createSPRouter } from '../../../lib/createSPRouter';
import { VehiculoSchema } from './vehiculos.schema';

export const vehiculosRouter = createSPRouter({
  spName: 'sp_vehiculos',
  schema: VehiculoSchema,
  global: true,
});
