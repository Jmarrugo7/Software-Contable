<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CONTABLE — Sistema de Gestión y Control de Gastos mediante Facturas

Reemplaza el manejo de gastos en Excel de un **único usuario: el contador**.
Interfaz y textos en **español (Colombia)**. Moneda: **COP**. Zona horaria: **America/Bogota**.

## Fuentes de verdad (léelas antes de cualquier tarea)

1. `docs/ERS_V2.pdf` — requisitos (RF-01..RF-41, RN-01..RN-14, RNF-01..RNF-10). **Manda la V2**, no la V1.
2. `supabase/migrations/001_esquema_inicial.sql` — esquema de base de datos ya diseñado y probado.
3. Este archivo — decisiones acordadas con el usuario que complementan o corrigen el ERS.

Si algo del código contradice al ERS o a este archivo, **detente y pregunta**; no improvises.

## Stack (obligatorio)

- **Base de datos, autenticación y archivos: Supabase** (Postgres + Auth + Storage). Restricción no negociable.
- Next.js 16 (App Router) + TypeScript estricto + Tailwind 4 + componentes propios al estilo shadcn en `src/components/ui/` (sin CLI de shadcn)
- Recharts para gráficas · Zod + React Hook Form para formularios · `@supabase/ssr` para sesión
- PDF de factura: `@react-pdf/renderer` o `pdf-lib`, generado en el servidor

Variables de entorno (`.env.local`, nunca al repositorio; incluir `.env.local.example` sin valores):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**Prohibido** usar la `service_role key` en el cliente o exponerla en variables `NEXT_PUBLIC_*`.

## Decisiones acordadas (complementan/corrigen el ERS)

| Tema | Decisión |
|---|---|
| Gasto/Compra | Lista fija de 24 categorías (ya en el SQL). Reemplaza "descripción" y "tipo de gasto". |
| Método de pago | Lista fija: TRANSFERENCIA, EFECTIVO, TARJETA DE CREDITO, DESCONOCIDO. |
| **Fuente de recursos** | Predefinidas: DISMEJ SAS, CAJA MENOR, SRA FIDIA. **El usuario SÍ puede agregar nuevas** desde el formulario (opción "+ Agregar nueva…"). Solo agregar: no editar ni borrar. *Esto es una excepción a RN-08.* |
| Fecha | Siempre el momento del registro. No es editable, ni al crear ni al editar. |
| Negativos | Solo la categoría **NOTA CREDITO** admite precio unitario, IVA y retenciones negativos (devoluciones). En las demás, todo positivo. |
| Cantidad | Por defecto 1. |
| IVA y retenciones | Los **digita** el contador (valor en pesos). No se calculan al 19 %. |
| Descarga (RF-25) | Solo un **PDF generado** con los datos de la factura. No descargar adjuntos por este botón. |
| Semana | Lunes a domingo (ISO). |
| Adjuntos | Varios por factura; PDF, JPG, PNG, WebP; máx. 10 MB c/u; bucket privado `facturas-adjuntos`; ruta `{factura_id}/{uuid}-{nombre_saneado}`; ver con URLs firmadas de corta duración. |
| Proveedor | Texto libre con autocompletado de proveedores usados antes (sin módulo de proveedores). |
| Anuladas | No se editan; primero se reactivan. |
| Usuario | Cuenta única creada a mano en Supabase; **no hay pantalla de registro**. |

## Reglas de arquitectura

- **Los cálculos y reglas viven en la base de datos** (columnas generadas y triggers del SQL). La UI puede mostrar una vista previa del subtotal/total mientras se digita, pero **el valor guardado lo calcula Postgres**. No dupliques reglas críticas solo en el frontend.
- Cambios de estado **solo** con las funciones RPC `anular_factura(p_factura_id, p_motivo)` y `reactivar_factura(p_factura_id)`. Nunca `update ... set estado`.
- El tablero usa las RPC `resumen_gastos`, `gastos_por_periodo('day'|'week'|'month'|'year', ...)` y `gastos_por_categoria`. Ya excluyen anuladas y usan hora de Colombia. No recalcules en el cliente.
- **Nunca** se borra una factura (ni SQL `delete`, ni botón "eliminar"). El SQL lo bloquea.
- Cualquier cambio de esquema = **nueva migración numerada** (`002_...sql`), nunca editar la 001 una vez aplicada.
- Todas las rutas (salvo `/login`) protegidas con middleware de Supabase; sin sesión → redirigir a `/login`.
- Errores de la base de datos (mensajes `raise exception` en español) se muestran al usuario tal cual, de forma amigable.
- Dinero: mostrar con `formatearMoneda()` de `src/lib/formato.ts` (es-CO, COP). Los `numeric` de Postgres llegan a TypeScript como `number`. **No sumes ni calcules totales en el cliente**: los totales y agregados los calcula Postgres (columnas generadas y RPC).
- Next.js 16: la protección de rutas vive en `src/proxy.ts` (antes `middleware.ts`), `cookies()` es asíncrono y los formularios usan Server Actions con `useActionState`.
- Diseño: identidad de libro contable definida en `src/app/globals.css` (`papel`, `hoja`, `mesa`, `tinta`, `regla`, `sello`, `rojo`; tipografías Source Serif 4 y Source Sans 3). Usa esos tokens, no colores sueltos. Negativos siempre en `text-rojo` **y** con signo menos (no depender solo del color).

## Estructura de carpetas sugerida

```
src/
  app/
    (auth)/login/              # página, formulario y Server Action
    (app)/facturas/            # listado, /nueva, /[id], /anuladas
    (app)/gastos/              # tablero de control de gastos
  components/                  # ui/, layout/, facturas/, gastos/
  proxy.ts                     # sesión y redirecciones
  lib/
    supabase/                  # client.ts, server.ts, env.ts
    validaciones/              # esquemas Zod
    formato.ts                 # moneda, fechas (America/Bogota)
  types/database.ts            # generado: supabase gen types typescript
supabase/migrations/
docs/
```

## Fuera de alcance (no construir)

Migración del Excel histórico · detalle de productos por factura · módulo de proveedores · presupuestos o alertas de sobreejecución · edición de Gasto/Compra o Método de pago · roles adicionales · registro público de usuarios.


## Estado actual

| Fase | Estado |
|---|---|
| 0 · Proyecto base | Hecha |
| 1 · Migración aplicada y tipos | Código hecho. **Pendiente que el usuario ejecute la migración 001** en su Supabase; el panel "Conexión con la base de datos" en `/facturas` confirma que quedó bien (es temporal: se retira en la Fase 3). |
| 2 · Login, logout, rutas protegidas | Hecha |
| 3 · Registrar factura | Siguiente |

Comandos: `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm run types` (regenera `src/types/database.ts` desde Supabase, requiere `supabase login` y `supabase link`).

## Forma de trabajar

Se trabaja **por fases y esperando aprobación** al final de cada una:

| Fase | Contenido | Requisitos |
|---|---|---|
| 0 | Proyecto base, conexión a Supabase, variables de entorno, layout | RNF-08 |
| 1 | Aplicar migración 001 y generar tipos TypeScript | RN-08 |
| 2 | Login, logout y rutas protegidas | RF-01..03 |
| 3 | Registrar factura (formulario, vista previa de cálculos, adjuntos) | RF-04..20 |
| 4 | Listado, detalle, edición, filtros (Gasto/Compra y fechas) y PDF | RF-21..25 |
| 5 | Anular, ver anuladas, reactivar | RF-26..30 |
| 6 | Tablero: indicadores, filtros, gráficas por día/semana/mes/año | RF-31..41 |

Al terminar cada fase: resume lo hecho, indica qué requisitos quedan cubiertos, cómo probarlo, y **espera confirmación**. No avances a la siguiente por iniciativa propia.

## Calidad

- TypeScript sin `any`; sin errores de lint ni de tipos antes de dar una fase por terminada.
- Formularios con validación clara en español y botón "Guardar" deshabilitado mientras se envía.
- Interfaz simple para alguien sin conocimientos técnicos (RNF-01): pocas pantallas, mensajes claros, confirmación antes de anular y reactivar.
- Responsive y usable en navegadores modernos (RNF-07).
