import { makeExportHandler } from '@/lib/bulkHandler';

export const GET = makeExportHandler({
  nodePath: '/modelos',
  template: 'modelos-lista',
  filename: 'modelos',
});
