// ============================================================================
// API ROUTE — PRESUPUESTOS
// Proxy autenticado hacia el Node API.
// GET: lista | POST: crear | PUT: actualizar | DELETE: eliminar
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch, handleRouteError } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

// ── GET — Lista por empresa ────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => { params[key] = value; });

    const data = await apiFetch('/presupuestos', { params });
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

// ── POST — Crear ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await apiFetch('/presupuestos', { method: 'POST', body });
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

// ── PUT — Actualizar ───────────────────────────────────────────────────────

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = await apiFetch('/presupuestos', { method: 'PUT', body });
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

// ── DELETE — Eliminar ──────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const data = await apiFetch('/presupuestos', { method: 'DELETE', body });
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}
