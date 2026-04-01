// ============================================================================
// API ROUTE — COMBO AMBIENTE DTE
// Valores estáticos: 1=Certificación, 2=Producción (SMALLINT en DB)
// ============================================================================

import { NextResponse } from 'next/server';
import type { ApiResponse, ComboOption } from '@/components/mantenedor/types';

const ambienteCombo: ComboOption[] = [
  { valor: 1, texto: 'Certificación' },
  { valor: 2, texto: 'Producción' },
];

export async function GET() {
  const response: ApiResponse<ComboOption[]> = {
    success:   true,
    message:   'Combo de ambientes obtenido correctamente',
    data:      ambienteCombo,
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(response);
}
