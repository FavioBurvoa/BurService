// ============================================================================
// API ROUTE — COMBO EMPRESAS
// Retorna solo registros activos en formato { valor, texto } para selects.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/apiClient';
import type { ApiResponse, ComboOption } from '@/components/mantenedor/types';

interface Empresa {
  id: number;
  razon_social: string;
  activo: boolean;
}

export async function GET() {
  try {
    const result = await apiFetch<Empresa[]>('/empresas');

    const items = result.data ?? [];
    const comboData: ComboOption[] = items
      .filter((item) => item.activo)
      .map((item) => ({ valor: item.id, texto: item.razon_social }));

    const response: ApiResponse<ComboOption[]> = {
      success:   true,
      message:   'Combo de empresas obtenido correctamente',
      data:      comboData,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch {
    const response: ApiResponse = {
      success:   false,
      message:   'Error al obtener combo de empresas',
      data:      null,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
