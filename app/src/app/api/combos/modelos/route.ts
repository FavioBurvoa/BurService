// ============================================================================
// API ROUTE — COMBO MODELOS
// Retorna solo registros activos en formato { valor, texto, id_marca } para selects.
// id_marca permite filtrar opciones dependiendo de la marca seleccionada.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/apiClient';
import type { ApiResponse, ComboOption } from '@/components/mantenedor/types';

interface Modelo {
  id: number;
  codigo: string;
  descripcion: string;
  id_marca: number;
  activo: boolean;
}

interface ModeloCombo extends ComboOption {
  id_marca: number;
}

export async function GET() {
  try {
    const result = await apiFetch<Modelo[]>('/modelos');

    const items = result.data ?? [];
    const comboData: ModeloCombo[] = items
      .filter((item) => item.activo)
      .map((item) => ({ valor: item.id, texto: item.descripcion, id_marca: item.id_marca }));

    const response: ApiResponse<ModeloCombo[]> = {
      success:   true,
      message:   'Combo de modelos obtenido correctamente',
      data:      comboData,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch {
    const response: ApiResponse = {
      success:   false,
      message:   'Error al obtener combo de modelos',
      data:      null,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
