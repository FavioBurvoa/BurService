import { makeExportHandler } from '@/lib/bulkHandler';

export const GET = makeExportHandler({
  nodePath: '/regiones',
  template: 'regiones-lista',
  filename: 'regiones',
});
