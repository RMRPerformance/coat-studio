import { CERAKOTE_COLORS, POWDER_COLORS } from '../data/finishes'
import type { Complexity, Prep, ProcessKind, Sheen } from '../types'

type Props = {
  process: ProcessKind
  onProcess: (p: ProcessKind) => void
  colorId: string
  onColor: (id: string) => void
  sheen: Sheen
  onSheen: (s: Sheen) => void
  complexity: Complexity
  onComplexity: (c: Complexity) => void
  prep: Prep
  onPrep: (p: Prep) => void
  longest: number
  onLongest: (n: number) => void
}

export function FinishPanel({
  process,
  onProcess,
  colorId,
  onColor,
  sheen,
  onSheen,
  complexity,
  onComplexity,
  prep,
  onPrep,
  longest,
  onLongest,
}: Props) {
  const colors = process === 'powder' ? POWDER_COLORS : CERAKOTE_COLORS
  return (
    <section className="panel">
      <header className="panel-h">
        <h2>2. Finish</h2>
        <p>Pick the coating family, then a color. The 3D view updates live.</p>
      </header>
      <div className="seg" role="tablist" aria-label="Coating type">
        <button
          type="button"
          className={process === 'powder' ? 'on' : ''}
          onClick={() => onProcess('powder')}
        >
          Powder coat
        </button>
        <button
          type="button"
          className={process === 'cerakote' ? 'on' : ''}
          onClick={() => onProcess('cerakote')}
        >
          Cerakote
        </button>
      </div>
      <div className="swatches" role="list">
        {colors.map((c) => (
          <button
            key={c.id}
            type="button"
            role="listitem"
            className={c.id === colorId ? 'swatch on' : 'swatch'}
            onClick={() => onColor(c.id)}
            title={c.name}
          >
            <span className="chip" style={{ background: c.hex }} />
            {c.name}
          </button>
        ))}
      </div>
      <div className="seg small">
        {(['satin', 'gloss', process === 'powder' ? 'wrinkle' : null] as const)
          .filter((s): s is Sheen => s !== null)
          .map((s) => (
            <button key={s} type="button" className={sheen === s ? 'on' : ''} onClick={() => onSheen(s)}>
              {s}
            </button>
          ))}
      </div>
      <label className="field">
        <span>Longest side (inches)</span>
        <input
          type="number"
          min={1}
          max={96}
          step={0.25}
          value={longest}
          onChange={(e) => onLongest(Number(e.target.value) || 1)}
        />
      </label>
      <label className="field">
        <span>Complexity</span>
        <select value={complexity} onChange={(e) => onComplexity(e.target.value as Complexity)}>
          <option value="simple">Simple — flat sign, bracket</option>
          <option value="standard">Standard — several surfaces</option>
          <option value="complex">Complex — masking, disassembly, tight spots</option>
        </select>
      </label>
      <label className="field">
        <span>Prep</span>
        <select value={prep} onChange={(e) => onPrep(e.target.value as Prep)}>
          <option value="clean">Already clean / bare metal</option>
          <option value="strip">Needs strip and blast</option>
        </select>
      </label>
    </section>
  )
}
