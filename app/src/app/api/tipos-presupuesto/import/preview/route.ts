import { makeImportPreviewHandler } from '@/lib/bulkHandler';

export const POST = makeImportPreviewHandler({
  nodePath:     '/tipos-presupuesto',
  contextField: 'id_empresa',
  headerMap: {
    'tipo dte':             'tipo_dte',
    'encabezado linea 1':   'encabezado_linea1',
    'encabezado linea 2':   'encabezado_linea2',
    'logo ancho':           'logo_ancho',
    'logo alto':            'logo_alto',
    'dias validez':         'dias_validez',
  },
});
