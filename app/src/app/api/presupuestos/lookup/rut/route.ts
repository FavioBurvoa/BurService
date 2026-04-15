// ============================================================================
// API ROUTE — LOOKUP RUT
// Proxy hacia Node API: busca datos del contribuyente por RUT.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch, handleRouteError } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rut = (searchParams.get('q') ?? '').trim();

    if (!rut) {
      const response: ApiResponse = { success: false, message: 'RUT requerido', data: null, timestamp: new Date().toISOString() };
      return NextResponse.json(response, { status: 400 });
    }

    const data = await apiFetch(`/presupuestos/lookup/rut/${encodeURIComponent(rut)}`);
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}
