// ============================================================================
// API ROUTE — COMBO TIPOS PRESUPUESTO
// Retorna registros activos en formato { valor, texto } para selects.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/apiClient';
import type { ApiResponse, ComboOption } from '@/components/mantenedor/types';

interface TipoPresupuesto {
  id: number;
  codigo: string;
  descripcion: string;
  activo: boolean;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idEmpresa = searchParams.get('id_empresa');
    const url = idEmpresa ? `/tipos-presupuesto?id_empresa=${idEmpresa}` : '/tipos-presupuesto';
    const result = await apiFetch<TipoPresupuesto[]>(url);

    const items = result.data ?? [];
    const comboData: ComboOption[] = items
      .filter((item) => item.activo)
      .map((item) => ({ valor: item.id, texto: `${item.codigo} - ${item.descripcion}` }));

    const response: ApiResponse<ComboOption[]> = {
      success:   true,
      message:   'Combo de tipos de presupuesto obtenido correctamente',
      data:      comboData,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch {
    const response: ApiResponse = {
      success:   false,
      message:   'Error al obtener combo de tipos de presupuesto',
      data:      null,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
