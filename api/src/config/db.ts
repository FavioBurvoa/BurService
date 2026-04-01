import postgres from 'postgres';
import { env } from './env';

// Singleton — una sola conexión compartida en toda la app
export const sql = postgres({
  host:     env.DB_HOST,
  port:     env.DB_PORT,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  max:             10,  // máximo de conexiones en el pool
  idle_timeout:    30,  // segundos antes de cerrar conexión idle
  connect_timeout: 10,  // segundos de timeout al conectar
});
