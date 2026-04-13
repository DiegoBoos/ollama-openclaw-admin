# Análisis de Arquitectura - ollama-openclaw-admin API

**Fecha:** 2026-04-07
**Analista:** Rocky
**Alcance:** `apps/api` (NestJS)

---

## Resumen Ejecutivo

La API ya tenía dos mejoras relevantes antes de este trabajo:
- `SiriscloudAuthGuard` para endpoints sensibles
- sanitización de inputs en `openclaw.service.ts`
- tests e2e de seguridad

Aun así, la superficie seguía débil en siete frentes estructurales: timeouts HTTP, rate limiting, validación de DTOs, CORS explícito, observabilidad, health checks consolidados y validación de configuración.

**Estado post-mejoras:**
- ✅ Timeout global de requests
- ✅ Rate limiting global y por endpoint sensible
- ✅ DTOs y `ValidationPipe` global
- ✅ CORS con whitelist explícita
- ✅ Request IDs y logging estructurado JSON
- ✅ `/api/health`, `/api/health/ready`, `/api/health/live`
- ✅ Fail-fast de configuración en startup

Build y tests e2e pasando.

---

## Hallazgos Iniciales

### 1. Timeouts HTTP
**Hallazgo:** `HttpService` no tenía timeout global. Solo el guard de Siriscloud tenía uno hardcodeado a 5s.

**Riesgo:** requests colgados, saturación de recursos, dependencia lenta afectando toda la API.

**Implementado:**
- `HttpModule` global con timeout de 30s
- `TimeoutInterceptor` global para requests entrantes
- soporte opcional de override vía header `X-Request-Timeout` con tope de 60s

### 2. Rate Limiting
**Hallazgo:** no había protección contra abuso ni DoS, especialmente en login, register, generate, chat y operaciones sensibles de OpenClaw.

**Riesgo:** abuso de CPU/GPU, credential stuffing, denegación de servicio trivial.

**Implementado:**
- `@nestjs/throttler` como guard global
- límites específicos por endpoint:
  - login: 5/min
  - register: 3/min
  - generate/chat: 10/min
  - launch/stop/restart: 5/min
  - list models: 30/min

### 3. DTOs y Validación
**Hallazgo:** varios endpoints aceptaban `any` o tipos inline sin validación real.

**Riesgo:** payloads arbitrarios, inputs enormes, falta de contratos claros.

**Implementado:**
- DTOs en `src/dto/`
- `ValidationPipe` global con:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`
- validación para:
  - launch
  - logs query
  - login/register/validate
  - generate/chat
  - create integration

**Nota:** la validación de `messages` en chat quedó mejor que antes, pero todavía no está modelada con un DTO anidado fuerte. Es el principal punto que dejaría para una siguiente iteración.

### 4. CORS
**Hallazgo:** `main.ts` no definía CORS explícito.

**Riesgo:** configuración ambigua, riesgo de exposición si alguien lo habilita sin whitelist.

**Implementado:**
- whitelist desde `CORS_ORIGINS`
- en desarrollo, defaults razonables para localhost
- en producción, ausencia de `CORS_ORIGINS` rompe startup

### 5. Logging y Observabilidad
**Hallazgo:** observabilidad mínima, sin request IDs ni formato estructurado.

**Riesgo:** troubleshooting pobre, trazabilidad baja, correlación difícil.

**Implementado:**
- middleware de logging JSON con `pino`
- request ID generado o reutilizado desde `X-Request-Id`
- `X-Request-Id` de vuelta en response
- filtro global de excepciones con respuesta estructurada

### 6. Health Checks
**Hallazgo:** existían checks parciales (`/ollama/health`, `/siriscloud/health`) pero no un estado consolidado del sistema.

**Implementado:**
- `HealthModule`
- `/api/health`
- `/api/health/ready`
- `/api/health/live`
- chequeo consolidado de:
  - Ollama
  - OpenClaw
  - Siriscloud Auth

### 7. Configuración
**Hallazgo:** había defaults silenciosos en variables sensibles, especialmente `SIRISCLOUD_AUTH_URL`.

**Riesgo:** deploy aparentemente exitoso con configuración inválida.

**Implementado:**
- `src/config/configuration.ts`
- validación de entorno al startup
- fail-fast en producción si faltan variables críticas
- validación fuerte de `CORS_ORIGINS` en producción

---

## Cambios Implementados

### Nuevos archivos
- `src/common/interceptors/timeout.interceptor.ts`
- `src/common/middleware/logger.middleware.ts`
- `src/common/filters/http-exception.filter.ts`
- `src/config/configuration.ts`
- `src/dto/generate.dto.ts`
- `src/dto/auth.dto.ts`
- `src/dto/integrations.dto.ts`
- `src/dto/index.ts`
- `src/health/health.module.ts`
- `src/health/health.service.ts`
- `src/health/health.controller.ts`

### Archivos modificados
- `src/main.ts`
- `src/app.module.ts`
- `src/ollama/ollama.controller.ts`
- `src/openclaw/openclaw.controller.ts`
- `src/siriscloud/siriscloud.controller.ts`
- `package.json`

### Dependencias agregadas
- `@nestjs/throttler`
- `class-validator`
- `class-transformer`
- `pino`
- `pino-pretty`

---

## Verificación

### Build
- ✅ `npm run build`

### Tests
- ✅ `npm run test:e2e`
- suites pasando: 2/2
- tests pasando: 8/8

---

## Riesgos / deuda remanente

1. **DTO de chat incompleto**
   - `messages` todavía no usa una validación anidada estricta con `@ValidateNested`.
   - Recomendación: crear `ChatMessageDto[]` con límites de cantidad y tamaño total.

2. **Logger artesanal**
   - Hoy funciona y compila, pero está hecho con middleware manual.
   - Recomendación: migrar a `nestjs-pino` para integración más limpia con Nest.

3. **Timeouts salientes inconsistentes**
   - Ya hay timeout global del `HttpModule`, pero algunos servicios aún usan `axiosRef` directamente y el guard mantiene timeout propio.
   - No está mal, pero convendría unificar política y métricas.

4. **Readiness endpoint**
   - `/api/health/ready` devuelve payload de no ready, pero no levanta explícitamente 503.
   - Para Kubernetes sería mejor devolver status HTTP 503 cuando corresponda.

---

## Priorización Recomendada

### P1
- modelar `ChatDto` con nested validation real
- devolver 503 en readiness cuando haya dependencia crítica caída

### P2
- migrar logging a `nestjs-pino`
- agregar métricas Prometheus/OpenTelemetry

### P3
- separar configuración por dominio con factories tipadas
- añadir tests e2e para rate limit, CORS y `/health`

---

## Conclusión

La API quedó significativamente mejor parada para producción. Antes había controles puntuales; ahora hay una base transversal de seguridad operativa y observabilidad. El cambio importante no es solo agregar features, sino haber cerrado huecos sistémicos.

Lo más valioso que queda pendiente es endurecer el contrato de `chat` y mejorar el comportamiento semántico del readiness check.

_Rocky 🪨_