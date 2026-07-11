import type { AppSettings } from '../types'

export function formatCurrency(amount: number, settings: AppSettings): string {
  return new Intl.NumberFormat(settings.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCurrencyFull(amount: number, settings: AppSettings): string {
  return `${settings.currencySymbol}${formatCurrency(amount, settings)}`
}

/** Formatea un monto con el símbolo de una moneda arbitraria (secundaria). */
export function formatInCurrency(amount: number, symbol: string, locale = 'es-AR'): string {
  return `${symbol}${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)}`
}

export function parseAmount(str: string): number {
  return parseFloat(str.replace(',', '.'))
}

// factor = cuántas unidades de la moneda secundaria equivalen a 1 unidad de la principal
/** Convierte de moneda principal a secundaria (secundaria = principal × factor) */
export function toAlt(amount: number, factor: number): number {
  return amount * factor
}

/** Convierte de moneda secundaria a principal (principal = secundaria ÷ factor) */
export function toOfficial(amountAlt: number, factor: number): number {
  return factor > 0 ? amountAlt / factor : 0
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function periodName(month: number, year: number): string {
  const months = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
  ]
  return `${months[month - 1]} ${year}`
}
