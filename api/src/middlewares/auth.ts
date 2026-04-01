import type { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../config/env';
import type { JWTPayload, ApiResponse } from '../types';

// JWKS se inicializa una vez y se reutiliza en cada request.
// createRemoteJWKSet cachea las claves internamente y las rota automáticamente.
const JWKS = createRemoteJWKSet(new URL(env.KEYCLOAK_JWKS_URL));

function unauthorizedResponse(): ApiResponse {
  return {
    success:   false,
    message:   'No autorizado',
    data:      null,
    timestamp: new Date().toISOString(),
  };
}

export async function authMiddleware(
  req:  Request,
  res:  Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json(unauthorizedResponse());
    return;
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: env.KEYCLOAK_ISSUER,
    });

    // Mapear claims del token al tipo JWTPayload
    req.user = {
      sub:        payload.sub as string,
      empresa_id: payload['empresa_id'] as number,
      email:      payload['email']      as string,
      roles:      (payload['roles']     as string[]) ?? [],
    };

    next();
  } catch {
    // No exponer el detalle del error de JWT al cliente
    res.status(401).json(unauthorizedResponse());
  }
}
