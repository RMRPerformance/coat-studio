import type { Complexity, Prep, ProcessKind, QuoteResult, ShopRates } from '../types'

export function computeQuote(opts: {
  areaSqIn: number
  process: ProcessKind
  colorName: string
  longestInches: number
  complexity: Complexity
  prep: Prep
  rates: ShopRates
}): QuoteResult {
  const areaSqFt = opts.areaSqIn / 144
  const rate = opts.process === 'powder' ? opts.rates.powderPerSqFt : opts.rates.cerakotePerSqFt
  const setup = opts.process === 'powder' ? opts.rates.powderSetup : opts.rates.cerakoteSetup
  const minimum = opts.process === 'powder' ? opts.rates.powderMinimum : opts.rates.cerakoteMinimum
  const complexityMult =
    opts.complexity === 'simple'
      ? opts.rates.simpleMult
      : opts.complexity === 'complex'
        ? opts.rates.complexMult
        : opts.rates.standardMult
  const prep = opts.prep === 'strip' ? opts.rates.stripFee : 0
  const coating = areaSqFt * rate * complexityMult
  const subtotal = coating + setup + prep
  const total = Math.max(minimum, subtotal)
  return {
    areaSqIn: opts.areaSqIn,
    areaSqFt,
    coating,
    setup,
    prep,
    complexityMult,
    subtotal,
    total,
    low: total * 0.85,
    high: total * 1.25,
    process: opts.process,
    colorName: opts.colorName,
    longestInches: opts.longestInches,
  }
}

export function money(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function mailtoQuote(quote: QuoteResult, complexity: Complexity, prep: Prep) {
  const body = [
    'Hi RMR — I used Coat Studio and would like a real quote.',
    '',
    `Finish: ${quote.process === 'powder' ? 'Powder coat' : 'Cerakote'} · ${quote.colorName}`,
    `Longest side: ${quote.longestInches.toFixed(1)} in`,
    `Estimated surface: ${quote.areaSqFt.toFixed(2)} sq ft`,
    `Complexity: ${complexity}`,
    `Prep: ${prep === 'strip' ? 'needs strip / blast' : 'already clean'}`,
    `Ballpark from the tool: ${money(quote.low)}–${money(quote.high)}`,
    '',
    'Photos of the part are attached in a follow-up / I can bring the part in.',
  ].join('\n')
  const q = new URLSearchParams({
    subject: `Coat estimate: ${quote.colorName} ${quote.process}`,
    body,
  })
  return `mailto:info@rmrperformance.com?${q.toString()}`
}
