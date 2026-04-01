// ============================================================================
// API ROUTE — LOOKUP PATENTE
// Proxy hacia Node API: busca vehículo + último cliente asociado.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patente = (searchParams.get('q') ?? '').trim().toUpperCase();

    if (!patente) {
      const response: ApiResponse = { success: false, message: 'Patente requerida', data: null, timestamp: new Date().toISOString() };
      return NextResponse.json(response, { status: 400 });
    }

    const data = await apiFetch(`/presupuestos/lookup/patente/${encodeURIComponent(patente)}`);
    return NextResponse.json(data);
  } catch {
    const response: ApiResponse = {
      success:   false,
      message:   'Error al buscar por patente',
      data:      null,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
