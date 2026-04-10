// ============================================================================
// API ROUTE — LOOKUP NÚMERO DE PRESUPUESTO
// Proxy hacia Node API: busca presupuesto por código de empresa + número.
// Retorna { id } para que el frontend pueda redirigir a /presupuestos/:id
// TODO: GET ${process.env.API_URL}/presupuestos/lookup/numero?codigo_empresa=X&numero=Y
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const codigoEmpresa = (searchParams.get('codigo_empresa') ?? '').trim();
    const numero = (searchParams.get('numero') ?? '').trim();

    if (!codigoEmpresa || !numero) {
      const response: ApiResponse = {
        success:   false,
        message:   'codigo_empresa y numero requeridos',
        data:      null,
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const data = await apiFetch(
      `/presupuestos/lookup/numero?codigo_empresa=${encodeURIComponent(codigoEmpresa)}&numero=${encodeURIComponent(numero)}`
    );
    return NextResponse.json(data);
  } catch {
    const response: ApiResponse = {
      success:   false,
      message:   'Error al buscar presupuesto',
      data:      null,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
