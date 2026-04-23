import { makeExportHandler } from '@/lib/bulkHandler';

export const GET = makeExportHandler({
  nodePath:     '/tipos-presupuesto',
  template:     'tipos-presupuesto-lista',
  filename:     'tipos-presupuesto',
  contextField: 'id_empresa',
});
