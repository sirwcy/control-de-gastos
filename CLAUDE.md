# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm run dev       # Servidor de desarrollo (http://localhost:5173)
npm run build     # Build de producción (tsc -b && vite build)
npm run preview   # Preview del build de producción
```

Para verificar tipos: `node ./node_modules/typescript/bin/tsc --noEmit`

## Despliegue

**Auto-deploy desde GitHub** (rama `main`). Netlify está conectado al repo: cada `git push` a `main` dispara build (`npm run build`) y publica en `sicdg.netlify.app`. **No hay redeploy manual** — basta con commitear y pushear.

- Build command: `npm run build` · Publish directory: `dist`
- Las variables de entorno viven en Netlify (*Project configuration → Environment variables*); un cambio de variable requiere un redeploy (Deploys → Trigger deploy → *Clear cache and deploy*).

## Infraestructura

| Servicio | URL / ID |
|---------|----------|
| GitHub | https://github.com/sirwcy/control-de-gastos |
| Netlify | https://sicdg.netlify.app (ID: `a6b60e8d-abea-4ab9-9c21-d70e8f23bf3c`) |
| Supabase | proyecto `labodega` (`btiyedvlrrioyctopflp`), prefijo `cdg_` |
| Storage | bucket `cdg-receipts` (comprobantes, máx 10 MB) |

Variables de entorno requeridas (en `.env.local` y en Netlify):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` — acepta cualquiera de los dos formatos de clave pública de Supabase: la anon JWT vieja (`eyJ...`) o la publishable nueva (`sb_publishable_...`). Nota: hoy `.env.local` usa la JWT y Netlify usa la publishable; ambas son válidas.

## Stack

- React 18 + TypeScript + Vite 8
- Tailwind CSS 3
- Zustand 4 con `persist` → `localStorage` (key: `control-gastos-v1`) — **pendiente migrar a Supabase**
- React Router DOM 6 con `HashRouter`
- `@supabase/supabase-js` — cliente en `src/lib/supabase.ts`
- lucide-react para íconos

## Arquitectura actual (localStorage — pre-migración)

### Stores
- `src/store/dataStore.ts` — toda la lógica de negocio (CRUD, cascade deletes, persist)
- `src/store/uiStore.ts` — estado efímero (sheets abiertos, `selectedPeriodId`)

### Modelo de datos
Jerarquía de categorías en 3 niveles: `Category` → `Subcategory` → `SubSubcategory`.
Las referencias usan `CategoryRef` con discriminador `level: 'category' | 'subcategory' | 'sub_subcategory'`.
Todos los gastos y presupuestos apuntan a un `BudgetPeriod` explícitamente.

### Lógica del dashboard
`src/lib/calculations.ts` → `computeDashboard()`: función pura, una sola pasada con Maps O(n).

### Navegación
5 tabs: Inicio | Movimientos | [+FAB] | Cuentas | Compras + Presupuesto. Rutas con `HashRouter`.

### Helpers compartidos
- `src/lib/formatters.ts` — `formatCurrencyFull`, `formatCurrencyAlt`, `parseAmount`, `todayISO`
- `src/lib/categoryHelpers.ts` — `getFullPath`, `getRefLabel`, `getCategoryForRef`
- `src/lib/calculations.ts` — `computeDashboard`
- `src/lib/imageStore.ts` — IndexedDB helpers para imágenes (temporal, migrar a Supabase Storage)
- `src/lib/supabase.ts` — cliente Supabase

## Supabase — Schema (prefijo `cdg_`)

14 tablas con RLS activo. Roles por cartera: `admin` | `executor` | `reader`.

Función helper: `cdg_wallet_role(wallet_id UUID) → TEXT` — devuelve el rol del usuario actual.

Tablas principales:
- `cdg_wallets` — carteras (personal / family)
- `cdg_wallet_members` — miembros con rol
- `cdg_wallet_settings` — configuración de monedas por cartera
- `cdg_invitations` — invitaciones pendientes por email
- `cdg_categories / cdg_subcategories / cdg_sub_subcategories`
- `cdg_accounts` — cuentas bancarias/efectivo
- `cdg_budget_periods / cdg_budget_items`
- `cdg_transactions` — gastos e ingresos (con `created_by` para control de executor)
- `cdg_shopping_lists / cdg_shopping_list_items`

## Roadmap de migración a Supabase

1. **Auth** — `src/store/authStore.ts` + pantallas Login/Registro + flujo de selección de cartera
2. **Data layer** — reemplazar Zustand persist por llamadas Supabase en `dataStore.ts`
3. **Users module** — admin puede invitar, cambiar roles, eliminar miembros
4. **Images** — migrar IndexedDB (`imageStore.ts`) → Supabase Storage `cdg-receipts`

## Convenciones TypeScript

Todos los imports de tipos deben usar `import type { ... }` (`verbatimModuleSyntax` habilitado). Evitar `any` explícitos.
