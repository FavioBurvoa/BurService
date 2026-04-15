// ============================================================================
// API ROUTE — COMBO COMUNAS
// Retorna solo registros activos en formato { valor, texto, id_region } para selects.
// id_region se incluye para que el frontend pueda filtrar por región.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch, handleRouteError } from '@/lib/apiClient';
import type { ApiResponse, ComboOption } from '@/components/mantenedor/types';

interface Comuna {
  id: number;
  id_region: number;
  descripcion: string;
  activo: boolean;
}

interface ComunaCombo extends ComboOption {
  id_region: number;
}

export async function GET() {
  try {
    const result = await apiFetch<Comuna[]>('/comunas');

    const items = result.data ?? [];
    const comboData: ComunaCombo[] = items
      .filter((item) => item.activo)
      .map((item) => ({ valor: item.id, texto: item.descripcion, id_region: item.id_region }));

    const response: ApiResponse<ComunaCombo[]> = {
      success:   true,
      message:   'Combo de comunas obtenido correctamente',
      data:      comboData,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (err) {
    return handleRouteError(err);
  }
}
