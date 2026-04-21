import { makeExportHandler } from '@/lib/bulkHandler';

export const GET = makeExportHandler({
  nodePath: '/marcas',
  template: 'marcas-lista',
  filename: 'marcas',
});
