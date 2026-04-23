import { makeImportPreviewHandler } from '@/lib/bulkHandler';

export const POST = makeImportPreviewHandler({
  nodePath: '/contribuyentes',
  headerMap: {
    'direccion': 'direccion',
    'telefono 2': 'telefono2',
    'telefono2':  'telefono2',
    'tipos':                'tipos_contribuyente',
    'tipos contribuyente':  'tipos_contribuyente',
    'tipos_contribuyente':  'tipos_contribuyente',
  },
});
