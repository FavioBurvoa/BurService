// ============================================================================
// API ROUTE — COMBO TIPOS CONTRIBUYENTE
// Retorna registros activos en formato { valor, texto, sw_factura } para selects.
// sw_factura se incluye para evaluar condiciones dinámicas en el frontend.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/apiClient';
import type { ApiResponse, ComboOption } from '@/components/mantenedor/types';

interface TipoContribuyente {
  id: number;
  descripcion: string;
  sw_factura: boolean;
  activo: boolean;
}

interface TipoContribuyenteCombo extends ComboOption {
  sw_factura: boolean;
}

export async function GET() {
  try {
    const result = await apiFetch<TipoContribuyente[]>('/tipos-contribuyente');

    const items = result.data ?? [];
    const comboData: TipoContribuyenteCombo[] = items
      .filter((item) => item.activo)
      .map((item) => ({ valor: item.id, texto: item.descripcion, sw_factura: item.sw_factura }));

    const response: ApiResponse<TipoContribuyenteCombo[]> = {
      success:   true,
      message:   'Combo de tipos contribuyente obtenido correctamente',
      data:      comboData,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch {
    const response: ApiResponse = {
      success:   false,
      message:   'Error al obtener combo de tipos contribuyente',
      data:      null,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
