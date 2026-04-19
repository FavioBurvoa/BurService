// ============================================================================
// MIDDLEWARE — RATE LIMITING PARA RUTAS /api/*
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

const hits = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

function cleanup(now: number) {
  for (const [ip, timestamps] of hits.entries()) {
    const fresh = timestamps.filter((t) => now - t < WINDOW_MS);
    if (fresh.length === 0) hits.delete(ip);
    else hits.set(ip, fresh);
  }
}

export function middleware(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();

  if (hits.size > 1000) cleanup(now);

  const timestamps = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: 'Demasiadas solicitudes. Intenta nuevamente en unos segundos.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(MAX_REQUESTS),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil((oldest + WINDOW_MS) / 1000)),
        },
      }
    );
  }

  timestamps.push(now);
  hits.set(ip, timestamps);

  const res = NextResponse.next();
  res.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS));
  res.headers.set('X-RateLimit-Remaining', String(MAX_REQUESTS - timestamps.length));
  return res;
}

export const config = {
  matcher: ['/api/:path*'],
};
