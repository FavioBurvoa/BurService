# DEPLOY — Saga Ops

Guía operativa para levantar el stack en un server LAN-only con HTTPS confiable y respaldos versionados.

---

## Arquitectura

Dos compose separados con responsabilidades distintas:

| Compose | Servicios | Lifecycle |
|---|---|---|
| `docker-compose.infra.yml` | nginx-proxy, postgres, postgres-kc, keycloak, gotenberg, adminer (debug) | Siempre arriba; cambia raramente |
| `docker-compose.app.yml` | app, api, reporte-svc, db-migrate (profile) | Deploy frecuente, gestionado por CI |

Networks compartidas (creadas por infra, externas en app):

- **`saga-proxy`** — servicios públicos (nginx, app, keycloak)
- **`saga-internal`** — todo el resto (sin port host)

Hostnames públicos:

- `https://app.burservce.cl` → app (Next.js)
- `https://auth.burservce.cl` → keycloak

DB principal: vive en infra, schema/seed se aplican vía `db-migrate` y `db-seed` (one-shot containers en el compose de app).

---

## Setup desde cero (server nuevo)

### 1. Pre-requisitos en el server

- Docker + Docker Compose v2
- `git`
- `git-crypt`: `apt install git-crypt` (Linux) / `brew install git-crypt` (Mac)
- `mkcert`: ver paso 4

### 2. Clonar repo y desbloquear secretos

```bash
git clone <repo> saga-ops
cd saga-ops
git-crypt unlock /ruta/segura/saga-ops.key
```

> El archivo `saga-ops.key` NUNCA va al repo. Guardarlo en password manager / USB cifrado.
> Para generar la key la primera vez (solo una vez en la vida del repo):
> ```bash
> git-crypt init
> git-crypt export-key /ruta/segura/saga-ops.key
> ```

### 3. Configurar `.env` y verificar

```bash
cp .env.example .env  # solo si no estaba versionado todavía
nano .env             # ajustar LAN_IP, passwords reales
```

### 4. Crear estructura de data y generar certificados TLS

**4.1 — Crear `/opt/data` con perms correctos** (data persistente fuera del repo):

```bash
sudo mkdir -p /opt/data/{postgres,postgres-kc,nginx-proxy/{certs,vhost.d,html},mkcert}
sudo chown -R $USER:$USER /opt/data
chmod 700 /opt/data/postgres /opt/data/postgres-kc
```

**4.2 — Instalar mkcert** (si no lo tenés):

```bash
sudo apt install -y libnss3-tools
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
mkcert -install   # genera la CA local en el server
```

**4.3 — Copiar la CA root para que los containers la confíen** (NextAuth → Keycloak):

```bash
cp "$(mkcert -CAROOT)/rootCA.pem" /opt/data/mkcert/rootCA.pem
```

**4.4 — Emitir certs para los 2 hostnames públicos**:

```bash
cd /opt/data/nginx-proxy/certs
mkcert app.burservce.cl auth.burservce.cl
# Genera 2 archivos: app.burservce.cl+1.pem y app.burservce.cl+1-key.pem

# Renombrar al formato que nginx-proxy espera ({hostname}.crt + {hostname}.key)
mv app.burservce.cl+1.pem      app.burservce.cl.crt
mv app.burservce.cl+1-key.pem  app.burservce.cl.key

# Duplicar para auth (ambos hostnames están en el SAN del mismo cert)
cp app.burservce.cl.crt        auth.burservce.cl.crt
cp app.burservce.cl.key        auth.burservce.cl.key

# Verificar
ls -la /opt/data/nginx-proxy/certs/
# Deberías ver: app.burservce.cl.crt + .key, auth.burservce.cl.crt + .key
```

### 5. Compilar tema de Keycloak

```bash
cd keycloak-theme
npm ci
npm run build-keycloak-theme
cd ..
# El JAR queda en keycloak-theme/dist_keycloak/ y el compose lo bind-mountea
```

### 6. Levantar infra primero

```bash
docker compose -f docker-compose.infra.yml up -d

# Verificar
docker compose -f docker-compose.infra.yml ps
docker compose -f docker-compose.infra.yml logs -f --tail 50
```

Espera hasta ver `postgres` y `postgres-kc` en estado **healthy**, y `keycloak` arrancando (toma ~60s).

### 7. Aplicar schema (1ra vez)

```bash
# Schema (crea tablas, índices, funciones SP) — idempotente, se puede correr N veces
docker compose -f docker-compose.app.yml --profile migrate run --rm db-migrate
```

> **Seed (catálogos)**: en producción NO se aplica desde compose — se carga manualmente desde la app a medida que el usuario crea registros. El `db/seed.sql` queda solo como referencia para desarrollo local. Si querés bootstrappear catálogos, podés hacerlo manual con: `docker exec -i saga-postgres psql -U postgres -d burservice < db/seed.sql`

### 8. Levantar la app

```bash
docker compose -f docker-compose.app.yml up -d --build

docker compose -f docker-compose.app.yml ps
docker compose -f docker-compose.app.yml logs -f --tail 50
```

### 9. Configurar DNS local en cada dispositivo cliente

En **laptop**, **celular** y demás dispositivos desde donde accedas:

**Linux / Mac**: `/etc/hosts` (sudo)

```
192.168.0.50  app.burservce.cl auth.burservce.cl
```

**Windows**: `C:\Windows\System32\drivers\etc\hosts` (como admin), misma línea.

**Android/iOS**: requiere apps tipo `Hosts Go` o un servidor DNS local.

### 10. Instalar la CA mkcert en cada dispositivo cliente

Para que los browsers confíen en el cert, importar `/opt/data/mkcert/rootCA.pem` (del server) en cada dispositivo.

- **Linux / Mac**: `mkcert -install` en cada dispositivo donde corras mkcert. Si no, importar manualmente al keychain (Mac) / NSS DB (Linux).
- **Windows**: doble click al `rootCA.pem` → "Trusted Root Certification Authorities".
- **iOS/Android**: Settings → Security → Install certificate. iOS además: Settings → General → About → Certificate Trust Settings → habilitar.

### 11. Configurar el realm de Keycloak

Primer login al admin: `https://auth.burservce.cl` → user `admin` / password de `KC_ADMIN_PASSWORD`.

Crear el realm `saga-ops`, configurar el client `burservice` con redirect URIs:
- `https://app.burservce.cl/api/auth/callback/keycloak`

Copiar el client secret a `app/.env.docker` → `KEYCLOAK_SECRET`. Reiniciar el app: `docker compose -f docker-compose.app.yml restart app`.

---

## Operación diaria

### Levantar / bajar

```bash
# Infra (rara vez se baja)
docker compose -f docker-compose.infra.yml up -d
docker compose -f docker-compose.infra.yml down              # ⚠️ corta auth y db

# Infra + adminer
docker compose -f docker-compose.infra.yml --profile debug up -d

# App (deploy típico)
docker compose -f docker-compose.app.yml up -d --build
docker compose -f docker-compose.app.yml down               # solo app, infra sigue arriba

# Todo junto (logs combinados)
docker compose -f docker-compose.infra.yml -f docker-compose.app.yml ps
```

### Aplicar cambios de schema

```bash
# Después de modificar db/schema.sql
docker compose -f docker-compose.app.yml --profile migrate run --rm db-migrate
```

> El CI lo hará automático cuando haya cambios en `db/schema.sql`.

### Logs

```bash
docker compose -f docker-compose.app.yml   logs -f                  # app, api, reporte-svc
docker compose -f docker-compose.infra.yml logs -f                  # infra
docker compose -f docker-compose.app.yml   logs -f app api          # selección
```

### Rebuild tras cambios de código

```bash
git pull
docker compose -f docker-compose.app.yml up -d --build app          # solo app
docker compose -f docker-compose.app.yml up -d --build              # todo
```

### Restart

```bash
docker compose -f docker-compose.app.yml   restart app
docker compose -f docker-compose.infra.yml restart keycloak
```

---

## Backups

### Manual

```bash
docker exec saga-postgres pg_dump -U postgres burservice \
  | gzip > backups/saga-$(date +%F).sql.gz
```

### Automatizado (cron diario 03:00)

Crear `scripts/backup-db.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
DATE=$(date +%F)
docker exec saga-postgres pg_dump -U postgres burservice \
  | gzip > "backups/saga-$DATE.sql.gz"
# Retención: últimos 30 días
find backups -name 'saga-*.sql.gz' -mtime +30 -delete
# Versionar
git add backups
git -c user.email=cron@server -c user.name=cron \
  commit -m "backup db $DATE" --allow-empty
git push
```

`chmod +x scripts/backup-db.sh` y agregar a crontab:

```
0 3 * * * /ruta/a/saga-ops/scripts/backup-db.sh >> /var/log/saga-backup.log 2>&1
```

### Restore

```bash
gunzip < backups/saga-2026-04-28.sql.gz \
  | docker exec -i saga-postgres psql -U postgres burservice
```

### Migración futura a `restic` + Backblaze B2

Cuando los dumps acumulen >50 MB en git:
- `restic init -r b2:saga-ops-backups:/`
- Backup snapshot cifrado, dedup, compresión
- Costo estimado: ~$0.50/mes por 100 GB

---

## Operación de desarrollo

### Dev local fuera de Docker (`npm run dev`)

`api/.env` y `app/.env.local` siguen vigentes para `npm run dev`. **Postgres no está expuesto al host por default**.

**Opciones para dev local**:

- **A) Levantar solo postgres con port mapping temporal**: `docker compose -f docker-compose.infra.yml run --rm --service-ports -p 127.0.0.1:5432:5432 postgres`
- **B) Usar adminer** (`docker compose -f docker-compose.infra.yml --profile debug up -d adminer`) → `http://localhost:8080`
- **C) Editar el infra compose temporalmente** agregando `ports: ["127.0.0.1:5432:5432"]` (no commitear)

### Theme Keycloak

Después de cambios:
```bash
cd keycloak-theme
npm run build-keycloak-theme
cd ..
docker compose -f docker-compose.infra.yml restart keycloak
```

---

## Acceso remoto SSH (informativo, no parte del compose)

Para administrar desde fuera de la LAN sin abrir puertos del router:

**Tailscale** (free para uso personal):
```bash
# En el server
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Instalar el cliente Tailscale en tu laptop/celular fuera de la LAN. Te conectas vía la IP Tailscale del server (100.x.x.x) o el hostname asignado. Sin port forwarding, sin VPN clásica.

---

## CI/CD (próxima fase, no implementado todavía)

Cuando levantemos el GitLab Runner self-hosted, el `.gitlab-ci.yml` aprovechará la separación db/app/infra para hacer deploys granulares según qué cambia:

| Cambio en commit | Jobs ejecutados |
|---|---|
| Solo `app/src/...` | `deploy-app` |
| Solo `api/src/...` | `deploy-api` |
| Solo `db/schema.sql` | `deploy-db` (corre `docker compose -f docker-compose.app.yml --profile migrate run --rm db-migrate`) |
| `db/` + `api/` | `deploy-db` → `deploy-api` (orden por stages, atómico) |
| Solo `*.md` | Ninguno |
| `keycloak-theme/` | `deploy-keycloak-theme` (rebuild theme + restart keycloak) |
| `docker-compose.infra.yml` | `deploy-infra` (manual normalmente) |

Implementación en una sesión separada, una vez que el deploy manual esté validado.

---

## Troubleshooting

| Síntoma | Causa probable | Fix |
|---|---|---|
| Browser muestra "No es seguro" | CA mkcert no instalada en el dispositivo | Importar `/opt/data/mkcert/rootCA.pem` |
| `ERR_CONNECTION_REFUSED` a `app.burservce.cl` | `/etc/hosts` no apunta a la IP del server | Editar `/etc/hosts` |
| Login a Keycloak da timeout en redirect | KC_HOSTNAME no coincide con el Host real | Verificar `KC_HOSTNAME=auth.burservce.cl` |
| `NextAuth` falla al validar cert en server-side | CA mkcert no copiada a `/opt/data/mkcert/rootCA.pem` | `cp $(mkcert -CAROOT)/rootCA.pem /opt/data/mkcert/` |
| `docker compose -f docker-compose.app.yml up` falla con "network saga-proxy not found" | Infra no está arriba | `docker compose -f docker-compose.infra.yml up -d` primero |
| `db-migrate` falla con "could not connect to server" | Postgres no healthy todavía | Esperar healthcheck OK; `docker compose -f docker-compose.infra.yml ps` |
| Backup cron falla en `git push` | Falta credencial git en cron | Configurar SSH key del cron user |
| Port 80/443 ocupado | Otro proceso (apache/nginx host) está corriendo | `sudo systemctl stop nginx` o cambiar puertos |

---

## Archivos sensibles (cifrados con git-crypt)

- `.env` (raíz)
- `app/.env.docker`
- `app/.env.local`
- `api/.env.docker`
- `api/.env`

Verificar estado: `git-crypt status`.

---

## Próximos pasos (no hechos en este pase)

- [ ] `.gitlab-ci.yml` + GitLab Runner self-hosted (cuando deploy manual quede validado)
- [ ] Migración de backups git → `restic` + Backblaze B2
- [ ] CSP headers en `next.config.ts` (#33 PENDIENTES)
- [ ] Audit logging
- [ ] Keycloak `start --optimized` (~30% más rápido al arrancar)
