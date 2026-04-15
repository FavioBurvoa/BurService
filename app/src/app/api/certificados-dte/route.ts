// ============================================================================
// API ROUTE — CERTIFICADOS DTE
// Proxy autenticado hacia el Node API.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch, handleRouteError } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

interface CertificadoDte {
  id: number;
  id_empresa: number;
  descripcion: string;
  nombre_archivo: string;
  mime_type: string;
  certificado: string;
  password: string | null;
  fecha_vencimiento: string | null;
  activo: boolean;
}

// ── GET — Listar por empresa ──────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idEmpresa = searchParams.get('id_empresa');
    const url = idEmpresa ? `/certificados-dte?id_empresa=${idEmpresa}` : '/certificados-dte';
    const data = await apiFetch<CertificadoDte[]>(url);
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

// ── POST — Crear o actualizar ─────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body: CertificadoDte = await request.json();
    const method = body.id ? 'PUT' : 'POST';

    const data = await apiFetch<CertificadoDte>('/certificados-dte', { method, body });
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

// ── DELETE — Eliminar uno o varios ───────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const items: CertificadoDte[] = await request.json();

    let lastResult: ApiResponse<unknown> = {
      success:   true,
      message:   '',
      data:      null,
      timestamp: new Date().toISOString(),
    };

    for (const item of items) {
      lastResult = await apiFetch('/certificados-dte', {
        method: 'DELETE',
        body:   { id: item.id },
      });

      if (!lastResult.success) {
        return NextResponse.json(lastResult, { status: 400 });
      }
    }

    return NextResponse.json({
      ...lastResult,
      message: `${items.length} certificado${items.length > 1 ? 's' : ''} eliminado${items.length > 1 ? 's' : ''} correctamente`,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
