export type PhotoSlotId = 'front' | 'left' | 'right' | 'top'

export type PhotoSlot = {
  id: PhotoSlotId
  label: string
  hint: string
}

export type Photo = {
  id: PhotoSlotId
  name: string
  url: string
}

export type ProcessKind = 'powder' | 'cerakote'

export type Sheen = 'gloss' | 'satin' | 'wrinkle'

export type FinishColor = {
  id: string
  name: string
  hex: string
  process: ProcessKind
  metallic?: boolean
}

export type Complexity = 'simple' | 'standard' | 'complex'

export type Prep = 'clean' | 'strip'

export type SamplePart = 'header' | 'sign' | 'tumbler'

export type PartSource = { kind: 'sample'; sample: SamplePart } | { kind: 'photos' }

export type ShopRates = {
  powderPerSqFt: number
  cerakotePerSqFt: number
  powderSetup: number
  cerakoteSetup: number
  powderMinimum: number
  cerakoteMinimum: number
  stripFee: number
  simpleMult: number
  standardMult: number
  complexMult: number
}

export type QuoteResult = {
  areaSqIn: number
  areaSqFt: number
  coating: number
  setup: number
  prep: number
  complexityMult: number
  subtotal: number
  total: number
  low: number
  high: number
  process: ProcessKind
  colorName: string
  longestInches: number
}
