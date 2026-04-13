// Migraciones de schema de localStorage
// Cada función convierte el estado de versión N a N+1

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrate(persistedState: any, version: number): any {
  let state = persistedState

  if (version < 2) {
    // v1 → v2: renombrar expenses → transactions, agregar campos nuevos
    const expenses = state.expenses ?? []
    const factor = state.settings?.conversionFactor ?? 1
    state = {
      ...state,
      accounts: state.accounts ?? [],
      transactions: expenses.map((e: any) => ({
        ...e,
        type: 'expense',
        accountId: '',
        amountAlt: factor > 0 ? e.amount / factor : 0,
        categoryRef: e.categoryRef ?? null,
      })),
      settings: {
        currencySymbol: state.settings?.currencySymbol ?? '$',
        currencyCode: state.settings?.currencyCode ?? 'ARS',
        currencyName: state.settings?.currencyName ?? 'Peso Argentino',
        altCurrencySymbol: state.settings?.altCurrencySymbol ?? 'U$S',
        altCurrencyCode: state.settings?.altCurrencyCode ?? 'USD',
        altCurrencyName: state.settings?.altCurrencyName ?? 'Dólar',
        conversionFactor: state.settings?.conversionFactor ?? 1,
        locale: state.settings?.locale ?? 'es-AR',
        warningThreshold: state.settings?.warningThreshold ?? 0.80,
      },
    }
    delete state.expenses
  }

  if (version < 3) {
    // v2 → v3: agregar listas de compras
    state = {
      ...state,
      shoppingLists: state.shoppingLists ?? [],
      shoppingListItems: state.shoppingListItems ?? [],
    }
  }

  return state
}
