import { makeExportHandler } from '@/lib/bulkHandler';

export const GET = makeExportHandler({
  nodePath: '/vehiculos',
  template: 'vehiculos-lista',
  filename: 'vehiculos',
});
