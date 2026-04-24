# PENDIENTES — Saga Ops

Última actualización: 2026-04-23

---

## Prioridad 1 — Seguridad (antes de producción)

- [ ] 01. Cifrar contraseñas de certificados DTE en DB (pgcrypto o cifrado app-level) — diferido: funcionalidad DTE es fase futura; revisar cuando se implemente el módulo de emisión
- [x] 02. Limpiar `.env.example` — resuelto: archivo quedó con credenciales falsas (placeholders)
- [x] 03. Validar `ids` en `empresa-logo` DELETE antes de pasar al backend (resuelto con #10: DELETE ahora usa body)
- [x] 04. Agregar validación de email (`.email()`) en schemas Zod de empresas y contribuyentes
- [x] 05. Validación de RUT chileno en schemas Zod — formato (sin puntos, con guión, mayúsculas) + dígito verificador (módulo 11)
- [x] 06. ~~Agregar `.max()` al campo `certificado`~~ — descartado: certificado .p12 tiene tamaño acotado por naturaleza
- [x] 07. Agregar bounds a campos numéricos en `presupuestos.schema.ts` (`.min(0)`)

## Prioridad 2 — Consistencia de código

- [x] 08. Centralizar `formatCLP`/`parseCLP` en `src/lib/formatters.ts` (duplicado en CurrencyInput.tsx y EditableGrid.tsx)
- [x] 09. ~~Unificar `presupuestos/route.ts` — POST/PUT separados debería ser POST con `id` condicional~~ — descartado: POST/PUT separados son REST correcto; la convención de CLAUDE.md aplica solo a mantenedores simples, no a transacciones
- [x] 10. `empresa-logo/route.ts` debe usar `handleRouteError()` como las demás rutas
- [x] 11. Remover `axios` de dependencias (no se usa, solo `fetch`)
- [x] 12. Arreglar dependencias de hooks con `eslint-disable` en `EditableGrid.tsx`
- [x] 13. ~~Extraer sección vehículo de `PresupuestoForm.tsx` a componente (duplicado desktop/mobile)~~ — descartado: refactor diferido; el duplicado no genera bugs y funciona bien en ambos layouts

## Prioridad 3 — Robustez

- [x] 14. Agregar rate limiting en rutas API de Next.js (actualmente solo existe en Node API) — implementado con middleware in-memory (100 req/min por IP); migrar a Redis si se escala a multi-instance
- [x] 15. Agregar páginas `/error.tsx` y `/not-found.tsx`
- [x] 16. ~~Agregar manejo de excepción en SPs para castings inválidos (`::BIGINT`, `::SMALLINT`)~~ — descartado: Zod valida tipos en entrada del API; los SPs reciben datos ya validados
- [x] 17. Reemplazar `console.log/error` en `auth.ts` por logger estructurado o eliminar
- [x] 18. Evitar key con index fallback en EditableGrid (`_tempId ?? rowIdx`)
- [x] 19. Monitorear estabilidad de `next-auth` beta (`5.0.0-beta.30`) — informativo, no requiere acción ahora

## Prioridad 4 — UX pendiente

- [ ] 20. Preservar valor de combos al navegar con Enter en edición (Enter pasa sin desmarcar; Space para seleccionar/deseleccionar)
- [x] 21. Preview de logo empresa en mantenedor — resuelto: `FilePreview.tsx` integrado en `Mantenedor.tsx` para cualquier columna tipo archivo (imagen con zoom, PDF/xls/doc/xml/certificado con ícono)
- [ ] 22. Paginación server-side en Mantenedor
- [ ] 23. Ordenamiento por columna en grid
- [x] 24. Export a Excel/CSV
- [x] 25. Import masivo
- [ ] 26. Filtros avanzados por columna
- [ ] 27. Definir página dashboard (actualmente tiene datos hardcodeados de prueba) — enfoque acordado: "panel de trabajo", no dashboard ejecutivo. Contenido:
  - (a) **Barra de acciones rápidas** arriba: `+ Nuevo presupuesto`, atajo al flujo diario
  - (b) **Mis presupuestos recientes**: últimos 10-15 con columnas mínimas (nro, fecha, contribuyente, patente, bruto, estado); click → abre
  - (c) **Buscador rápido empresa+número** estilo `/presupuestos/lista` pero compacto, para saltar directo a un presupuesto sin pasar por la lista completa
  - Afinar en iteración previa a implementación (SP `sp_dashboard` o endpoints granulares)
- [x] 28. Mensajes de validación descriptivos — errorMap global de Zod en español + errores inline bajo cada campo del form (`form.setErrors` en Mantenedor con los `errors[]` del backend)
- [x] 40. Subtotales directos (Caso 1) — recalcular total al Enter/blur, no solo al salir del campo. Hoy al tipear un valor no se refleja en el total general hasta perder el foco; afecta PresupuestoForm → PanelSubtotales
- [x] 41. Persistir último filtro usado en las 3 páginas de buscadores (`/presupuestos/lista`, `/presupuestos/vehiculo`, `/presupuestos/seguimiento`) — resuelto: hook `useStickyFilters(viewKey, keys)` con `localStorage` aislado por usuario (clave `saga_ops_filters_${email}_${view}`). Hidrata URL desde storage si llega vacía, persiste cada cambio. URL manda sobre storage (respeta links compartidos). Botón "Limpiar" agregado en las 3 vistas
- [ ] 43. Vista tipo calendario para organización de tareas — **investigar opciones antes de implementar**: Mantine Dates (calendario simple nativo del stack), FullCalendar (feature-rich, pesado), React Big Calendar (intermedio). Evaluar al abordarlo según requisitos reales (drag&drop, eventos, vistas mes/semana/día, recurrencia). Definir modelo de "tarea" y alcance funcional antes de elegir librería

## Prioridad 5 — Producción / infraestructura

- [x] 29. Health check para API en docker-compose — resuelto: healthcheck añadido a `keycloak` (`KC_HEALTH_ENABLED=true` + `/health/ready`) y `gotenberg` (`/health`); plantilla lista para `api` cuando se descomente el servicio; `postgres` y `postgres-kc` ya lo tenían
- [ ] 30. Estrategia de backups de base de datos — se configurará directamente sobre ambiente productivo en go-live (primera fase = levantar producción)
- [ ] 31. Audit logging (registro de create/update/delete) — fase 2, post aprobación de la app
- [ ] 32. Request correlation IDs para tracing
- [ ] 33. Configurar Content-Security-Policy en Next.js — estrategia: arrancar en modo `Content-Security-Policy-Report-Only` en producción para detectar violaciones reales sin romper, ajustar directivas (`script-src`, `style-src` para Mantine inline, `img-src 'self' data: blob:` para FilePreview, `connect-src` con dominio Keycloak, `frame-ancestors 'none'`), luego pasar a enforcement. Configurar en `app/next.config.ts` → `headers()`
- [ ] 34. Resource limits (memory, CPU) en docker-compose
- [ ] 36. Rate limiter — revisar valores (`MAX_REQUESTS`, `WINDOW_MS`) según tráfico real antes de deploy; subir a ~300/min si se esperan >5 usuarios concurrentes desde mismo NAT/oficina. Revisión en fase 1 (primera semana prod) junto con #37
- [ ] 37. Verificar config jwilder-proxy en producción — debe setear `X-Forwarded-For` con IP real del cliente (default OK, pero confirmar); loguear warning si el header no llega al middleware Next.js. Revisión en fase 1
- [ ] 38. Red interna Docker — Next.js container NO debe estar expuesto directamente al exterior (solo jwilder-proxy con acceso vía red interna) para evitar spoofing de `X-Forwarded-For`

## Prioridad 6 — Autorización granular (multi-usuario)

- [ ] 35. Autorización por scope de Keycloak — **no bloqueante para go-live**: fase 1 opera con 1 solo usuario operativo que solo crea presupuestos. Queda como mejora para cuando se amplíe a múltiples usuarios/empresas. Actualmente cualquier usuario autenticado ve todas las empresas y todas las acciones. Requiere:
  - (a) **Restricción de empresas por usuario**: mapear `id_empresa` accesibles al usuario vía atributos/grupos Keycloak; filtrar combos de empresa y validar en backend (rechazar si `id_empresa` del request no está en el scope del usuario)
  - (b) **Visibilidad del menú**: esconder items del sidebar según roles/scopes del JWT (ej: rol `admin` ve todo, `operador` solo ve presupuestos/vehículos)
  - (c) **Bloqueo de acciones**: deshabilitar botones crear/editar/eliminar en mantenedores según permisos; validar también en backend vía middleware que lea `realm_access.roles` o client scopes del JWT
  - Usar Keycloak Authorization Services (resources + scopes + policies) o roles simples según complejidad deseada

---

## Completados

- [x] Formateador RUT (displayRut, RutInput)
- [x] Formateador patente (displayPatente, PatenteInput)
- [x] Enter navigation entre campos de formulario (enterNav.ts)
- [x] Select-all on focus para inputs de texto (selectOnFocus.ts)
- [x] Auto-focus en primer campo al abrir modal
- [x] DB: tablas presupuesto + sp_presupuestos en init.sql
- [x] Node API: módulo presupuestos (schema + routes + registro)
- [x] Next.js: rutas proxy /api/presupuestos/*
- [x] PresupuestoForm: integración completa con rutas reales
- [x] Lista presupuestos: migrar a react-query + LoadingOverlay/Skeleton
- [x] Refresh token rotation en auth
- [x] Logout federado (NextAuth + Keycloak)
- [x] Login con tema custom Keycloak
