import { makeImportPreviewHandler } from '@/lib/bulkHandler';

export const POST = makeImportPreviewHandler({
  nodePath:     '/tipos-presupuesto-detalles',
  contextField: 'id_tipo_presupuesto',
  headerMap: {
    'cant. max. det.':  'cant_max_det',
    'cant max det':     'cant_max_det',
    'col. doc.':        'col_doc',
    'col doc':          'col_doc',
    'codigo subtotal':  'codigo_subtotal',
    'nombre subtotal':  'nombre_subtotal',
    'ver sw exento':    'ver_sw_exento',
    'ver cantidad':     'ver_cantidad',
    'ver valor':        'ver_valor',
    'ver total':        'ver_total',
  },
});
