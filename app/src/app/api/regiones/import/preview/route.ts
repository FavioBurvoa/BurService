import { makeImportPreviewHandler } from '@/lib/bulkHandler';

export const POST = makeImportPreviewHandler({
  nodePath: '/regiones',
  headerMap: {
    'codigo sii': 'codigo_sii',
  },
});
