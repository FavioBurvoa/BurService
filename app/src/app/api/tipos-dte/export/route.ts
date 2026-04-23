import { makeExportHandler } from '@/lib/bulkHandler';

export const GET = makeExportHandler({
  nodePath: '/tipos-dte',
  template: 'tipos-dte-lista',
  filename: 'tipos-dte',
});
