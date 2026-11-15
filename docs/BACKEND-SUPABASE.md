# Migración backend + Supabase (incremental)

## Estado
Esta rama incorpora un **backend independiente en preparación**. No se ha conectado
el frontend ni importado datos. La aplicación anterior continúa dependiendo de
`json-server` hasta completar la migración. **No usar en producción todavía.**

## Diagnóstico comprobado (rama main)
- React/Vite/TypeScript en `src/`; llamadas a `http://localhost:8080` en
  `AppContext.tsx` y `AuthContext.tsx`.
- `Sales.tsx` guarda cada ítem y descuenta stock con peticiones independientes.
- `AuthContext.tsx` descargaba usuarios y contrastaba contraseñas en cliente.
- `Settings.tsx` tiene un reseteo total mediante `PUT /db`.
- `src/types/index.ts` define inventario tienda/bodega, variantes, pagos por
  ítem, gastos y recurrencias. No existe apertura/arqueo formal de caja.
- El `db.json` comercial **NO** está en Git. `.bolt/dbprueba` es muestra.

## Decisiones de arquitectura
- Frontend actual sin modificar; más adelante consumiría `/api/*` con JWT.
- Backend separado `server/` (Fastify + TypeScript).
- Supabase Auth para identificar usuarios; PostgreSQL transaccional para negocio.
- Cada solicitud usa JWT validado contra Supabase Auth + cabecera `x-business-id`;
  el backend verifica membresía activa **antes** de consultar o escribir.
- En acceso PostgreSQL servidor se asume que RLS podría ser omitido por el rol:
  **todas** las SQL deben filtrar `business_id`. RLS está habilitado y los
  permisos directos del cliente están revocados por defecto.
- En ventas: un único identificador idempotente y transacción, con bloqueos
  de filas de inventario, precios calculados desde DB y rechazo de stock negativo.
- Catálogo, movimientos y caja se migrarán por incrementos; no se inventan datos.
- `products.cost_total_amount` representa **costo total del stock actual**,
  siguiendo el uso observado de `costPrice` en `AppContext.tsx`.
  Confirmar esta semántica con un JSON real antes de importar.
- Unidades de stock en NUMERIC(14,3); precios en NUMERIC(14,2).
  La modalidad de venta por peso requiere prueba específica antes de conectarla.
- El modelo incluye `business_id` en cada entidad comercial para aislar negocios;
  futuras sucursales no están implementadas.

## Instalación local (aún requiere credenciales de desarrollo)
1. Crear proyecto de Supabase **de pruebas**; configurar credenciales solo en
   `server/.env`, partiendo de `server/.env.example`.
2. Ejecutar `supabase/migrations/202611150001_initial_pos.sql` mediante
   migraciones de Supabase o SQL Editor **solo en proyecto vacío/de pruebas**.
3. Crear usuario por Supabase Auth y, mediante SQL Editor de desarrollo,
   crear `businesses` y `business_memberships` con el UUID real de `auth.users`.
   **No** importar contraseñas en texto plano del JSON histórico.
4. `cd server && npm install && npm run dev`. Puerto por defecto 3001;
   `GET /health` comprueba arranque sin exponer secretos.
5. `npm test` valida las reglas puras; `npm run build` revisa TypeScript.
6. Para consultar API autenticada enviar `Authorization: Bearer <access_token>`
   y `x-business-id: <uuid_del_negocio>`. Nunca enviar claves secretas al chat.

## Estrategia de migración
1. Copiar el `db.json` real fuera del repositorio; hash y respaldo de solo lectura.
2. Validar campos, registros duplicados, variantes, costos, cantidades y fechas.
3. Ensayar importación sobre DB de pruebas con tabla de correspondencia de IDs;
   cotejar conteos y sumas de inventario/ventas/gastos.
4. Integrar componentes uno a uno mediante capa `src/services`.
5. Probar ventas simultáneas, rechazo por stock, idempotencia, RLS/aislamiento,
   persistencia tras reiniciar y compatibilidad funcional.
6. Solo entonces realizar corte definitivo y retirar `json-server`.

## Prohibiciones
- No sobrescribir datos reales ni ejecutar `Settings.clearAllData` contra la DB.
- No exponer `DATABASE_URL`, contraseñas, claves secretas o cookies de sesión.
- No afirmar integración verificada antes de pruebas contra Supabase.
