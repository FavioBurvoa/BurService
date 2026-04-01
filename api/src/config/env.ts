import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT:      z.string().default('3001').transform(Number),
  NODE_ENV:  z.enum(['development', 'production', 'test']).default('development'),

  DB_HOST:     z.string({ required_error: 'DB_HOST es requerido' }),
  DB_PORT:     z.string().default('5432').transform(Number),
  DB_NAME:     z.string({ required_error: 'DB_NAME es requerido' }),
  DB_USER:     z.string({ required_error: 'DB_USER es requerido' }),
  DB_PASSWORD: z.string({ required_error: 'DB_PASSWORD es requerido' }),

  KEYCLOAK_JWKS_URL: z.string({ required_error: 'KEYCLOAK_JWKS_URL es requerido' }).url(),
  KEYCLOAK_ISSUER:   z.string({ required_error: 'KEYCLOAK_ISSUER es requerido' }).url(),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas — detener el proceso:');
  parsed.error.issues.forEach((issue) => {
    console.error(`   ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;
