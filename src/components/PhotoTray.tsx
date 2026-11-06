import type { ChangeEvent } from 'react'
import { PHOTO_SLOTS } from '../data/finishes'
import type { Photo, PhotoSlotId } from '../types'

type Props = {
  photos: Photo[]
  onAdd: (id: PhotoSlotId, file: File) => void
  onRemove: (id: PhotoSlotId) => void
  threshold: number
  onThreshold: (n: number) => void
}

export function PhotoTray({ photos, onAdd, onRemove, threshold, onThreshold }: Props) {
  const byId = new Map(photos.map((p) => [p.id, p]))

  function handle(id: PhotoSlotId, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) onAdd(id, file)
  }

  return (
    <section className="panel">
      <header className="panel-h">
        <h2>1. Photos</h2>
        <p>Shoot 3–4 sides on a plain background. Phone photos are fine.</p>
      </header>
      <div className="slots">
        {PHOTO_SLOTS.map((slot) => {
          const photo = byId.get(slot.id)
          return (
            <label key={slot.id} className={photo ? 'slot filled' : 'slot'}>
              {photo ? (
                <img src={photo.url} alt={`${slot.label} of part`} />
              ) : (
                <span className="slot-empty">
                  <strong>{slot.label}</strong>
                  <em>{slot.hint}</em>
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handle(slot.id, e)}
              />
              {photo ? (
                <button
                  type="button"
                  className="slot-x"
                  aria-label={`Remove ${slot.label} photo`}
                  onClick={(e) => {
                    e.preventDefault()
                    onRemove(slot.id)
                  }}
                >
                  ×
                </button>
              ) : null}
            </label>
          )
        })}
      </div>
      <label className="slider">
        <span>Background cut</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={threshold}
          onChange={(e) => onThreshold(Number(e.target.value))}
        />
      </label>
    </section>
  )
}
