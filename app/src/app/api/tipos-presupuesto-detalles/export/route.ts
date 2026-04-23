import { makeExportHandler } from '@/lib/bulkHandler';

export const GET = makeExportHandler({
  nodePath:     '/tipos-presupuesto-detalles',
  template:     'tipos-presupuesto-detalles-lista',
  filename:     'tipos-presupuesto-detalles',
  contextField: 'id_tipo_presupuesto',
});
