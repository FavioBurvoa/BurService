import { makeImportPreviewHandler } from '@/lib/bulkHandler';

export const POST = makeImportPreviewHandler({
  nodePath: '/vehiculos',
  headerMap: {
    'ano':           'anio',
    'tipo vehiculo': 'tipo_vehiculo',
  },
});
