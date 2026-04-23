import { makeImportPreviewHandler } from '@/lib/bulkHandler';

export const POST = makeImportPreviewHandler({
  nodePath: '/empresas',
  headerMap: {
    'razon social':          'razon_social',
    'nombre fantasia':       'nombre_fantasia',
    'act. eco.':             'act_eco',
    'act eco':               'act_eco',
    'act_eco':               'act_eco',
    'direccion referencia':  'direccion_referencia',
    'nro resolucion sii':    'numero_resolucion_sii',
    'numero resolucion sii': 'numero_resolucion_sii',
    'fecha resolucion sii':  'fecha_resolucion_sii',
    '% iva':                 'porcentaje_iva',
    'porcentaje iva':        'porcentaje_iva',
  },
});
