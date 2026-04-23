import { makeImportPreviewHandler } from '@/lib/bulkHandler';

export const POST = makeImportPreviewHandler({
  nodePath: '/tipos-contribuyente',
  headerMap: {
    'factura': 'sw_factura',
  },
});
