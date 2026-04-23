import { makeExportHandler } from '@/lib/bulkHandler';

export const GET = makeExportHandler({
  nodePath: '/tipos-vehiculo',
  template: 'tipos-vehiculo-lista',
  filename: 'tipos-vehiculo',
});
