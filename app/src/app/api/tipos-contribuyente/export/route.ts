import { makeExportHandler } from '@/lib/bulkHandler';

export const GET = makeExportHandler({
  nodePath: '/tipos-contribuyente',
  template: 'tipos-contribuyente-lista',
  filename: 'tipos-contribuyente',
});
