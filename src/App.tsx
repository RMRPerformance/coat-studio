import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BufferGeometry } from 'three'
import { FinishPanel } from './components/FinishPanel'
import { PhotoTray } from './components/PhotoTray'
import { QuoteCard } from './components/QuoteCard'
import { Viewer } from './components/Viewer'
import { CERAKOTE_COLORS, POWDER_COLORS } from './data/finishes'
import { loadRates, saveRates } from './data/pricing'
import { longestAxis, surfaceArea } from './lib/area'
import { computeQuote } from './lib/quote'
import { reconstructFromPhotos } from './lib/reconstruct'
import { createSampleGeometry } from './lib/samples'
import type {
  Complexity,
  Photo,
  PhotoSlotId,
  Prep,
  ProcessKind,
  SamplePart,
  Sheen,
  ShopRates,
} from './types'

const SAMPLE_SIZE: Record<SamplePart, number> = {
  header: 18,
  sign: 14,
  tumbler: 7,
}

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [geometry, setGeometry] = useState<BufferGeometry | null>(() => createSampleGeometry('header'))
  const [process, setProcess] = useState<ProcessKind>('cerakote')
  const [colorId, setColorId] = useState(CERAKOTE_COLORS[6].id)
  const [sheen, setSheen] = useState<Sheen>('satin')
  const [complexity, setComplexity] = useState<Complexity>('standard')
  const [prep, setPrep] = useState<Prep>('clean')
  const [longest, setLongest] = useState(18)
  const [threshold, setThreshold] = useState(0.35)
  const [building, setBuilding] = useState(false)
  const [warning, setWarning] = useState<string | null>(
    'Sample part — swap in your photos for a shape based on the real item.',
  )
  const [error, setError] = useState<string | null>(null)
  const [rates, setRates] = useState<ShopRates>(loadRates)
  const [sample, setSample] = useState<SamplePart>('header')

  const applyGeometry = useCallback((geo: BufferGeometry) => {
    setGeometry((prev) => {
      prev?.dispose()
      return geo
    })
  }, [])

  const loadSample = useCallback(
    (kind: SamplePart) => {
      const size = SAMPLE_SIZE[kind]
      setSample(kind)
      setLongest(size)
      setPhotos((prev) => {
        for (const p of prev) URL.revokeObjectURL(p.url)
        return []
      })
      setError(null)
      setWarning('Sample part — swap in your photos for a shape based on the real item.')
      applyGeometry(createSampleGeometry(kind))
    },
    [applyGeometry],
  )

  useEffect(() => {
    if (photos.length === 0) return
    let cancelled = false
    const t = window.setTimeout(() => {
      setBuilding(true)
      setError(null)
      reconstructFromPhotos(photos, longest, threshold)
        .then((result) => {
          if (cancelled) {
            result.geometry.dispose()
            return
          }
          applyGeometry(result.geometry)
          setWarning(result.warning)
        })
        .catch((err: unknown) => {
          if (cancelled) return
          setError(err instanceof Error ? err.message : 'Could not build a 3D shape from those photos.')
        })
        .finally(() => {
          if (!cancelled) setBuilding(false)
        })
    }, 280)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [photos, longest, threshold, applyGeometry])

  function addPhoto(id: PhotoSlotId, file: File) {
    const url = URL.createObjectURL(file)
    if (photos.length === 0) setLongest(12)
    setPhotos((prev) => {
      const old = prev.find((p) => p.id === id)
      if (old) URL.revokeObjectURL(old.url)
      return [...prev.filter((p) => p.id !== id), { id, name: file.name, url }]
    })
  }

  function removePhoto(id: PhotoSlotId) {
    setPhotos((prev) => {
      const old = prev.find((p) => p.id === id)
      if (old) URL.revokeObjectURL(old.url)
      return prev.filter((p) => p.id !== id)
    })
  }

  function changeProcess(next: ProcessKind) {
    setProcess(next)
    const palette = next === 'powder' ? POWDER_COLORS : CERAKOTE_COLORS
    if (!palette.some((c) => c.id === colorId)) setColorId(palette[0].id)
    if (next === 'cerakote' && sheen === 'wrinkle') setSheen('satin')
  }

  function changeRates(next: ShopRates) {
    setRates(next)
    saveRates(next)
  }

  const palette = process === 'powder' ? POWDER_COLORS : CERAKOTE_COLORS
  const finish = palette.find((c) => c.id === colorId) ?? palette[0]

  const meshSpan = geometry ? longestAxis(geometry) : 1
  const meshArea = geometry ? surfaceArea(geometry) : 0
  const areaSqIn = meshArea * (longest / meshSpan) ** 2

  const quote = useMemo(() => {
    if (areaSqIn <= 0) return null
    return computeQuote({
      areaSqIn,
      process,
      colorName: finish.name,
      longestInches: longest,
      complexity,
      prep,
      rates,
    })
  }, [areaSqIn, process, finish.name, longest, complexity, prep, rates])

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="mark">RMR</span>
          <div>
            <p className="kicker">RMR Performance</p>
            <h1>Coat Studio</h1>
          </div>
        </div>
        <p className="lede">
          Photograph a part, see it in powder coat or Cerakote, and get a ballpark price before it hits
          the booth.
        </p>
      </header>

      <div className="stage">
        <Viewer
          geometry={geometry}
          color={finish.hex}
          metallic={finish.metallic}
          process={process}
          sheen={sheen}
          building={building}
        />
        <div className="samples" role="group" aria-label="Sample parts">
          <span>Try a sample</span>
          <button type="button" className={sample === 'header' && photos.length === 0 ? 'on' : ''} onClick={() => loadSample('header')}>
            Header
          </button>
          <button type="button" className={sample === 'sign' && photos.length === 0 ? 'on' : ''} onClick={() => loadSample('sign')}>
            Metal sign
          </button>
          <button type="button" className={sample === 'tumbler' && photos.length === 0 ? 'on' : ''} onClick={() => loadSample('tumbler')}>
            Tumbler
          </button>
        </div>
      </div>

      <div className="cols">
        <PhotoTray
          photos={photos}
          onAdd={addPhoto}
          onRemove={removePhoto}
          threshold={threshold}
          onThreshold={setThreshold}
        />
        <FinishPanel
          process={process}
          onProcess={changeProcess}
          colorId={finish.id}
          onColor={setColorId}
          sheen={sheen}
          onSheen={setSheen}
          complexity={complexity}
          onComplexity={setComplexity}
          prep={prep}
          onPrep={setPrep}
          longest={longest}
          onLongest={setLongest}
        />
        <QuoteCard
          quote={quote}
          complexity={complexity}
          prep={prep}
          warning={warning}
          error={error}
          rates={rates}
          onRates={changeRates}
        />
      </div>

      <footer className="foot">
        <p>
          Four photos are not a CMM scan. Coat Studio builds a stand-in 3D shape from silhouettes so
          customers can preview a finish and you can talk price. Final quotes still come from the shop
          after you see the part.
        </p>
        <p>
          <a href="https://www.rmrperformance.com">rmrperformance.com</a>
          {' · '}
          <a href="mailto:info@rmrperformance.com">info@rmrperformance.com</a>
        </p>
      </footer>
    </div>
  )
}
