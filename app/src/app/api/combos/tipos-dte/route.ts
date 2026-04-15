// ============================================================================
// API ROUTE — COMBO TIPOS DTE
// Retorna registros activos en formato { valor, texto, codigo } para selects.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch, handleRouteError } from '@/lib/apiClient';
import type { ApiResponse, ComboOption } from '@/components/mantenedor/types';

interface TipoDte {
  id: number;
  codigo: string;
  descripcion: string;
  activo: boolean;
}

interface TipoDteCombo extends ComboOption {
  codigo: string;
}

export async function GET() {
  try {
    const result = await apiFetch<TipoDte[]>('/tipos-dte');

    const items = result.data ?? [];
    const comboData: TipoDteCombo[] = items
      .filter((item) => item.activo)
      .map((item) => ({ valor: item.id, texto: `${item.codigo} - ${item.descripcion}`, codigo: item.codigo }));

    const response: ApiResponse<TipoDteCombo[]> = {
      success:   true,
      message:   'Combo de tipos DTE obtenido correctamente',
      data:      comboData,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (err) {
    return handleRouteError(err);
  }
}
