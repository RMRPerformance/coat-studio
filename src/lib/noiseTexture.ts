import { CanvasTexture, RepeatWrapping } from 'three'

let cached: CanvasTexture | null = null

export function wrinkleTexture() {
  if (cached) return cached
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No 2D context')
  const img = ctx.createImageData(size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 90 + Math.random() * 80
    img.data[i] = n
    img.data[i + 1] = n
    img.data[i + 2] = n
    img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  const tex = new CanvasTexture(canvas)
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.repeat.set(6, 6)
  cached = tex
  return tex
}
