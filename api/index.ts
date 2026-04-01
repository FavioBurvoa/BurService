import { app } from './src/app';
import { env } from './src/config/env';
import { logger } from './src/config/logger';
import { sql } from './src/config/db';

app.listen(env.PORT, () => {
  logger.info(`BUR Service API corriendo en puerto ${env.PORT}`);
  logger.info(`Ambiente: ${env.NODE_ENV}`);
});

// Graceful shutdown: cerrar el pool de PostgreSQL antes de salir
async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} recibido — cerrando conexiones...`);
  await sql.end();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT',  () => void shutdown('SIGINT'));
