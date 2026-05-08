// TODO: POST /api/auth/logout
//
// Logout federado: limpia la sesión NextAuth server-side y retorna la URL
// de logout de Keycloak para que el cliente haga el redirect final.
// El id_token nunca viaja al cliente — se usa solo server-side como hint.

import { getToken } from 'next-auth/jwt';
import { cookies, headers } from 'next/headers';

export async function POST(request: Request) {
  // ── CSRF: verificar que la solicitud viene del propio frontend ─────────────
  const origin      = request.headers.get('origin');
  const baseUrl     = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');

  if (!origin || !origin.startsWith(baseUrl)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── Obtener idToken del JWT encriptado (server-side) ──────────────────────
  const headersList = await headers();
  const rawToken = await getToken({
    req: { headers: headersList },
    secret:       process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  });

  const idToken = rawToken?.idToken as string | undefined;

  // ── Limpiar cookies de Auth.js ─────────────────────────────────────────────
  // En producción los cookies usan prefijos __Secure- / __Host- que el browser
  // solo borra si la respuesta incluye los flags Secure/Path correctos.
  // cookieStore.delete() no siempre los aplica → usamos set('', {...}) explícito.
  // Auth.js parte la session-token en chunks (.0, .1, ...) si el JWT > 4 KB.
  const cookieStore  = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';

  // Patrones de cookies que Auth.js v5 puede setear
  const authCookiePatterns = isProduction
    ? [
        '__Secure-authjs.session-token',
        '__Secure-authjs.callback-url',
        '__Secure-authjs.pkce.code_verifier',
        '__Secure-authjs.state',
        '__Secure-authjs.nonce',
        '__Host-authjs.csrf-token',
      ]
    : [
        'authjs.session-token',
        'authjs.callback-url',
        'authjs.pkce.code_verifier',
        'authjs.state',
        'authjs.nonce',
        'authjs.csrf-token',
      ];

  // Atributos para que el browser acepte el delete (matchear lo que setea Auth.js al login)
  const expireAttrs = {
    httpOnly: true,
    sameSite: 'lax' as const,
    path:     '/',
    secure:   isProduction,
    maxAge:   0,
    expires:  new Date(0),
  };

  for (const c of cookieStore.getAll()) {
    const isAuthCookie = authCookiePatterns.some(
      (p) => c.name === p || c.name.startsWith(`${p}.`),
    );
    if (isAuthCookie) {
      cookieStore.set(c.name, '', expireAttrs);
    }
  }

  // ── Construir URL de logout de Keycloak (si aplica) ───────────────────────
  const callbackUrl = `${baseUrl}/login`;
  const issuer      = process.env.KEYCLOAK_ISSUER;

  if (idToken && issuer) {
    const logoutUrl = new URL(`${issuer}/protocol/openid-connect/logout`);
    logoutUrl.searchParams.set('id_token_hint',          idToken);
    logoutUrl.searchParams.set('post_logout_redirect_uri', callbackUrl);

    return Response.json({ logoutUrl: logoutUrl.toString() });
  }

  // Fallback: mock auth o sin idToken — redirigir solo al login local
  return Response.json({ logoutUrl: callbackUrl });
}
