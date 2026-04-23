import { makeImportPreviewHandler } from '@/lib/bulkHandler';

export const POST = makeImportPreviewHandler({
  nodePath: '/comunas',
  headerMap: {
    'codigo sii': 'codigo_sii',
  },
});
