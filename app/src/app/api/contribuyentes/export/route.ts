import { makeExportHandler } from '@/lib/bulkHandler';

export const GET = makeExportHandler({
  nodePath: '/contribuyentes',
  template: 'contribuyentes-lista',
  filename: 'contribuyentes',
});
