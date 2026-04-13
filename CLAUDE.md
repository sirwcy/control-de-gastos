# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm run dev       # Servidor de desarrollo (http://localhost:5173)
npm run build     # Build de producción (tsc -b && vite build)
npm run preview   # Preview del build de producción
```

No hay tests unitarios configurados. Para verificar tipos: `node ./node_modules/typescript/bin/tsc --noEmit`

## Stack

- React 18 + TypeScript + Vite 8
- Tailwind CSS 3 (configurado en `tailwind.config.js`)
- Zustand 4 con middleware `persist` → `localStorage` (key: `control-gastos-v1`)
- React Router DOM 6 con `HashRouter` (para compatibilidad sin servidor)
- lucide-react para íconos

## Arquitectura

### Datos persistidos
Todo el estado de la app se guarda en `localStorage` a través de Zustand `persist`. No hay backend.

El modelo de datos tiene 3 niveles de jerarquía de categorías:
- `Category` → `Subcategory` (FK: `categoryId`) → `SubSubcategory` (FK: `subcategoryId`)

Las referencias a cualquier nivel usan `CategoryRef` con un discriminador `level: 'category' | 'subcategory' | 'sub_subcategory'`. Todos los gastos y presupuestos apuntan a un `BudgetPeriod` explícitamente (no por rango de fechas).

### Stores
- `src/store/dataStore.ts` — toda la lógica de negocio (CRUD, cascade deletes, persist)
- `src/store/uiStore.ts` — estado efímero (qué sheet está abierto, `selectedPeriodId`)

### Lógica del dashboard
`src/lib/calculations.ts` → función pura `computeDashboard()`. Usa una sola pasada con Maps para acumular totales (O(n)) en vez de filter+reduce anidados. El hook `usePeriodId` / `useCurrentPeriod` en `src/hooks/usePeriodId.ts` resuelve el período activo para todas las páginas.

### Navegación
Bottom navigation fija con 4 tabs. FAB (+) central abre `ExpenseFormSheet` (bottom sheet animado). Todas las páginas tienen rutas con `HashRouter` (`/`, `/gastos`, `/presupuesto`, `/categorias`).

### Helpers compartidos
- `src/lib/formatters.ts` — `formatCurrencyFull`, `parseAmount`, `todayISO`, `formatDateShort`
- `src/lib/categoryHelpers.ts` — `getFullPath`, `getRefLabel`, `getCategoryForRef`
- `src/lib/calculations.ts` — `computeDashboard` (solo función pura, sin imports de stores)
- `src/lib/constants.ts` — `CATEGORY_COLORS`, `CATEGORY_ICONS`, `STATUS_COLORS`, `MONTHS_ES`

### Datos de ejemplo
`src/lib/seedData.ts` — se ejecuta en `App.tsx` al primer arranque si no hay categorías en el store.

## Convenciones TypeScript

Todos los imports de tipos deben usar `import type { ... }` (el proyecto tiene `verbatimModuleSyntax` habilitado). El proyecto usa ESLint; evitar `any` explícitos.
