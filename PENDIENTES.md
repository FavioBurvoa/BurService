# PENDIENTES — Saga Ops

Última actualización: 2026-04-18

---

## Prioridad 1 — Seguridad (antes de producción)

- [ ] 01. Cifrar contraseñas de certificados DTE en DB (pgcrypto o cifrado app-level)
- [ ] 02. Limpiar `.env.example` — remover credenciales reales de Keycloak
- [x] 03. Validar `ids` en `empresa-logo` DELETE antes de pasar al backend (resuelto con #10: DELETE ahora usa body)
- [x] 04. Agregar validación de email (`.email()`) en schemas Zod de empresas y contribuyentes
- [x] 05. Validación de RUT chileno en schemas Zod — formato (sin puntos, con guión, mayúsculas) + dígito verificador (módulo 11)
- [x] 06. ~~Agregar `.max()` al campo `certificado`~~ — descartado: certificado .p12 tiene tamaño acotado por naturaleza
- [x] 07. Agregar bounds a campos numéricos en `presupuestos.schema.ts` (`.min(0)`)

## Prioridad 2 — Consistencia de código

- [x] 08. Centralizar `formatCLP`/`parseCLP` en `src/lib/formatters.ts` (duplicado en CurrencyInput.tsx y EditableGrid.tsx)
- [ ] 09. Unificar `presupuestos/route.ts` — POST/PUT separados debería ser POST con `id` condicional
- [x] 10. `empresa-logo/route.ts` debe usar `handleRouteError()` como las demás rutas
- [x] 11. Remover `axios` de dependencias (no se usa, solo `fetch`)
- [x] 12. Arreglar dependencias de hooks con `eslint-disable` en `EditableGrid.tsx`
- [ ] 13. Extraer sección vehículo de `PresupuestoForm.tsx` a componente (duplicado desktop/mobile)

## Prioridad 3 — Robustez

- [ ] 14. Agregar rate limiting en rutas API de Next.js (actualmente solo existe en Node API)
- [x] 15. Agregar páginas `/error.tsx` y `/not-found.tsx`
- [ ] 16. Agregar manejo de excepción en SPs para castings inválidos (`::BIGINT`, `::SMALLINT`)
- [x] 17. Reemplazar `console.log/error` en `auth.ts` por logger estructurado o eliminar
- [x] 18. Evitar key con index fallback en EditableGrid (`_tempId ?? rowIdx`)
- [x] 19. Monitorear estabilidad de `next-auth` beta (`5.0.0-beta.30`) — informativo, no requiere acción ahora

## Prioridad 4 — UX pendiente

- [ ] 20. Preservar valor de combos al navegar con Enter en edición (Enter pasa sin desmarcar; Space para seleccionar/deseleccionar)
- [ ] 21. Preview de logo empresa en mantenedor
- [ ] 22. Paginación server-side en Mantenedor
- [ ] 23. Ordenamiento por columna en grid
- [ ] 24. Export a Excel/CSV
- [ ] 25. Import masivo
- [ ] 26. Filtros avanzados por columna
- [ ] 27. Definir página dashboard (actualmente tiene datos hardcodeados de prueba)
- [ ] 28. Mensajes de validación descriptivos — mostrar detalle del error (ej: "RUT inválido", "Email inválido") en vez de genérico "Error validación"

## Prioridad 5 — Producción / infraestructura

- [ ] 29. Health check para API en docker-compose
- [ ] 30. Estrategia de backups de base de datos
- [ ] 31. Audit logging (registro de create/update/delete)
- [ ] 32. Request correlation IDs para tracing
- [ ] 33. Configurar Content-Security-Policy en Next.js
- [ ] 34. Resource limits (memory, CPU) en docker-compose

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
