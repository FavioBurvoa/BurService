// ============================================================================
// API ROUTE — COMBO TIPOS DE VEHÍCULO
// Retorna solo registros activos en formato { valor, texto } para selects.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch, handleRouteError } from '@/lib/apiClient';
import type { ApiResponse, ComboOption } from '@/components/mantenedor/types';

interface TipoVehiculo {
  id: number;
  codigo: string;
  descripcion: string;
  activo: boolean;
}

export async function GET() {
  try {
    const result = await apiFetch<TipoVehiculo[]>('/tipos-vehiculo');

    const items = result.data ?? [];
    const comboData: ComboOption[] = items
      .filter((item) => item.activo)
      .map((item) => ({ valor: item.id, texto: item.descripcion }));

    const response: ApiResponse<ComboOption[]> = {
      success:   true,
      message:   'Combo de tipos de vehículo obtenido correctamente',
      data:      comboData,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (err) {
    return handleRouteError(err);
  }
}
