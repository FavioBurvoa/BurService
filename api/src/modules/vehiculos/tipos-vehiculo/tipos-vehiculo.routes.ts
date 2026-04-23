import { createSPRouter } from '../../../lib/createSPRouter';
import { TipoVehiculoSchema } from './tipos-vehiculo.schema';

export const tiposVehiculoRouter = createSPRouter({
  spName: 'sp_tipos_vehiculo',
  schema: TipoVehiculoSchema,
  global: true,
  extraOps: { export: true, resolve: true },
});
