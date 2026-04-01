// ============================================================================
// API ROUTE — COMBO MARCAS
// Retorna solo registros activos en formato { valor, texto } para selects.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/apiClient';
import type { ApiResponse, ComboOption } from '@/components/mantenedor/types';

interface Marca {
  id: number;
  codigo: string;
  descripcion: string;
  activo: boolean;
}

export async function GET() {
  try {
    const result = await apiFetch<Marca[]>('/marcas');

    const items = result.data ?? [];
    const comboData: ComboOption[] = items
      .filter((item) => item.activo)
      .map((item) => ({ valor: item.id, texto: item.descripcion }));

    const response: ApiResponse<ComboOption[]> = {
      success:   true,
      message:   'Combo de marcas obtenido correctamente',
      data:      comboData,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch {
    const response: ApiResponse = {
      success:   false,
      message:   'Error al obtener combo de marcas',
      data:      null,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
