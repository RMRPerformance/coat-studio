import type { ShopRates } from '../types'

export const DEFAULT_RATES: ShopRates = {
  powderPerSqFt: 14,
  cerakotePerSqFt: 32,
  powderSetup: 45,
  cerakoteSetup: 75,
  powderMinimum: 65,
  cerakoteMinimum: 95,
  stripFee: 35,
  simpleMult: 1,
  standardMult: 1.2,
  complexMult: 1.55,
}

const KEY = 'rmr-coat-studio-rates'

export function loadRates(): ShopRates {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_RATES }
    const parsed = JSON.parse(raw) as Partial<ShopRates>
    return { ...DEFAULT_RATES, ...parsed }
  } catch {
    return { ...DEFAULT_RATES }
  }
}

export function saveRates(rates: ShopRates) {
  localStorage.setItem(KEY, JSON.stringify(rates))
}
