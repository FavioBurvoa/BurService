import { makeExportHandler } from '@/lib/bulkHandler';

export const GET = makeExportHandler({
  nodePath: '/empresas',
  template: 'empresas-lista',
  filename: 'empresas',
});
