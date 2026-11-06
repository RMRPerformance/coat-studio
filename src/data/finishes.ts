import type { FinishColor } from '../types'

export const POWDER_COLORS: FinishColor[] = [
  { id: 'p-gloss-black', name: 'Gloss Black', hex: '#111111', process: 'powder' },
  { id: 'p-matte-black', name: 'Matte Black', hex: '#1a1a1a', process: 'powder' },
  { id: 'p-white', name: 'Gloss White', hex: '#f4f1ea', process: 'powder' },
  { id: 'p-orange', name: 'Safety Orange', hex: '#f15a22', process: 'powder' },
  { id: 'p-candy-red', name: 'Candy Red', hex: '#9b1c2e', process: 'powder' },
  { id: 'p-blue', name: 'Deep Blue', hex: '#163a6b', process: 'powder' },
  { id: 'p-yellow', name: 'Equipment Yellow', hex: '#e3b505', process: 'powder' },
  { id: 'p-silver', name: 'Metallic Silver', hex: '#c5c8cc', process: 'powder', metallic: true },
  { id: 'p-hammertone', name: 'Hammertone Grey', hex: '#6d7176', process: 'powder' },
  { id: 'p-green', name: 'John Deere Green', hex: '#367c2b', process: 'powder' },
]

export const CERAKOTE_COLORS: FinishColor[] = [
  { id: 'c-graphite', name: 'Graphite Black', hex: '#1c1c1c', process: 'cerakote' },
  { id: 'c-armor', name: 'Armor Black', hex: '#0c0c0c', process: 'cerakote' },
  { id: 'c-sniper', name: 'Sniper Grey', hex: '#6b6e70', process: 'cerakote' },
  { id: 'c-tungsten', name: 'Tungsten', hex: '#4a4e51', process: 'cerakote' },
  { id: 'c-fde', name: 'Flat Dark Earth', hex: '#b09a77', process: 'cerakote' },
  { id: 'c-burnt', name: 'Burnt Bronze', hex: '#5c4a32', process: 'cerakote' },
  { id: 'c-midnight', name: 'Midnight Bronze', hex: '#3b2f24', process: 'cerakote' },
  { id: 'c-od', name: 'OD Green', hex: '#4a5d23', process: 'cerakote' },
  { id: 'c-cobalt', name: 'Cobalt', hex: '#1b3a6b', process: 'cerakote' },
  { id: 'c-crimson', name: 'Crimson', hex: '#8b1e3f', process: 'cerakote' },
  { id: 'c-titanium', name: 'Titanium', hex: '#8a8d8f', process: 'cerakote', metallic: true },
  { id: 'c-white', name: 'Snow White', hex: '#efece4', process: 'cerakote' },
]

export const PHOTO_SLOTS = [
  { id: 'front' as const, label: 'Front', hint: 'Straight on' },
  { id: 'left' as const, label: 'Left', hint: '90° side' },
  { id: 'right' as const, label: 'Right', hint: 'Other side' },
  { id: 'top' as const, label: 'Top', hint: 'Optional 4th' },
]
