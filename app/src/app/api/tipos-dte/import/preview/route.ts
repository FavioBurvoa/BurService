import { makeImportPreviewHandler } from '@/lib/bulkHandler';

export const POST = makeImportPreviewHandler({
  nodePath: '/tipos-dte',
  headerMap: {
    'afecto':      'sw_afecto',
    'exento':      'sw_exento',
    'electronico': 'sw_electronico',
  },
});
