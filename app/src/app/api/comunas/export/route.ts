import { makeExportHandler } from '@/lib/bulkHandler';

export const GET = makeExportHandler({
  nodePath: '/comunas',
  template: 'comunas-lista',
  filename: 'comunas',
});
