import type { Complexity, Prep, QuoteResult, ShopRates } from '../types'
import { mailtoQuote, money } from '../lib/quote'

type Props = {
  quote: QuoteResult | null
  complexity: Complexity
  prep: Prep
  warning: string | null
  error: string | null
  rates: ShopRates
  onRates: (r: ShopRates) => void
}

export function QuoteCard({ quote, complexity, prep, warning, error, rates, onRates }: Props) {
  return (
    <section className="panel quote">
      <header className="panel-h">
        <h2>3. Estimate</h2>
        <p>Ballpark only. The shop confirms after seeing the part.</p>
      </header>
      {error ? <p className="banner err">{error}</p> : null}
      {warning && !error ? <p className="banner">{warning}</p> : null}
      {quote ? (
        <>
          <p className="price">
            {money(quote.low)}–{money(quote.high)}
          </p>
          <ul className="breakdown">
            <li>
              <span>Surface</span>
              <strong>
                {quote.areaSqFt.toFixed(2)} sq ft
                <em>{quote.areaSqIn.toFixed(0)} sq in</em>
              </strong>
            </li>
            <li>
              <span>
                {quote.process === 'powder' ? 'Powder' : 'Cerakote'} × {quote.complexityMult.toFixed(2)}
              </span>
              <strong>{money(quote.coating)}</strong>
            </li>
            <li>
              <span>Setup</span>
              <strong>{money(quote.setup)}</strong>
            </li>
            {quote.prep > 0 ? (
              <li>
                <span>Strip / blast</span>
                <strong>{money(quote.prep)}</strong>
              </li>
            ) : null}
            <li>
              <span>Shop minimum</span>
              <strong>
                {money(quote.process === 'powder' ? rates.powderMinimum : rates.cerakoteMinimum)}
              </strong>
            </li>
          </ul>
          <div className="actions">
            <a className="btn primary" href={mailtoQuote(quote, complexity, prep)}>
              Email this estimate
            </a>
            <a className="btn" href="tel:+15672171793">
              Call (567) 217-1793
            </a>
          </div>
        </>
      ) : (
        <p className="muted">Load a sample part or photos to see a price.</p>
      )}
      <details className="rates">
        <summary>Sample shop rates — edit yours</summary>
        <p className="muted tiny">
          These are starting numbers, not RMR’s published list. Change them to match what you actually
          charge; they stay in this browser.
        </p>
        <div className="rate-grid">
          <Rate label="Powder / sq ft" value={rates.powderPerSqFt} onChange={(n) => onRates({ ...rates, powderPerSqFt: n })} />
          <Rate label="Cerakote / sq ft" value={rates.cerakotePerSqFt} onChange={(n) => onRates({ ...rates, cerakotePerSqFt: n })} />
          <Rate label="Powder setup" value={rates.powderSetup} onChange={(n) => onRates({ ...rates, powderSetup: n })} />
          <Rate label="Cerakote setup" value={rates.cerakoteSetup} onChange={(n) => onRates({ ...rates, cerakoteSetup: n })} />
          <Rate label="Powder min" value={rates.powderMinimum} onChange={(n) => onRates({ ...rates, powderMinimum: n })} />
          <Rate label="Cerakote min" value={rates.cerakoteMinimum} onChange={(n) => onRates({ ...rates, cerakoteMinimum: n })} />
          <Rate label="Strip fee" value={rates.stripFee} onChange={(n) => onRates({ ...rates, stripFee: n })} />
        </div>
      </details>
    </section>
  )
}

function Rate({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <label className="field compact">
      <span>{label}</span>
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </label>
  )
}
