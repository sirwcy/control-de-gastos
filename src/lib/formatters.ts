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

export function formatCurrencyAlt(amount: number, settings: AppSettings): string {
  return `${settings.altCurrencySymbol}${new Intl.NumberFormat(settings.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)}`
}

export function parseAmount(str: string): number {
  return parseFloat(str.replace(',', '.'))
}

/** Convierte de moneda oficial a alterna */
export function toAlt(amount: number, factor: number): number {
  return factor > 0 ? amount / factor : 0
}

/** Convierte de moneda alterna a oficial */
export function toOfficial(amountAlt: number, factor: number): number {
  return amountAlt * factor
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
