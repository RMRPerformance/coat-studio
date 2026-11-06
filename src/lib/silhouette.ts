export type Mask = {
  width: number
  height: number
  data: Uint8Array
  coverage: number
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

export function extractMask(
  source: CanvasImageSource,
  size: number,
  threshold: number,
): Mask {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('No 2D context')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  const sw = 'width' in source ? Number(source.width) : size
  const sh = 'height' in source ? Number(source.height) : size
  const scale = Math.min(size / Math.max(sw, 1), size / Math.max(sh, 1))
  const dw = sw * scale
  const dh = sh * scale
  ctx.drawImage(source, (size - dw) / 2, (size - dh) / 2, dw, dh)

  const img = ctx.getImageData(0, 0, size, size)
  const px = img.data

  let br = 0
  let bg = 0
  let bb = 0
  let bn = 0
  const border = 6
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x >= border && x < size - border && y >= border && y < size - border) continue
      const i = (y * size + x) * 4
      br += px[i]
      bg += px[i + 1]
      bb += px[i + 2]
      bn++
    }
  }
  br /= bn
  bg /= bn
  bb /= bn

  const data = new Uint8Array(size * size)
  const cut = 18 + threshold * 90
  for (let i = 0, p = 0; i < data.length; i++, p += 4) {
    const dr = px[p] - br
    const dg = px[p + 1] - bg
    const db = px[p + 2] - bb
    const dist = Math.sqrt(dr * dr + dg * dg + db * db)
    data[i] = dist > cut ? 1 : 0
  }

  erode(data, size, size)
  dilate(data, size, size)
  dilate(data, size, size)
  keepLargest(data, size, size)

  let opaque = 0
  for (let i = 0; i < data.length; i++) opaque += data[i]
  return { width: size, height: size, data, coverage: opaque / data.length }
}

function dilate(data: Uint8Array, w: number, h: number) {
  const next = new Uint8Array(data)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      if (data[i]) continue
      if (
        data[i - 1] ||
        data[i + 1] ||
        data[i - w] ||
        data[i + w]
      ) {
        next[i] = 1
      }
    }
  }
  data.set(next)
}

function erode(data: Uint8Array, w: number, h: number) {
  const next = new Uint8Array(data)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      if (!data[i]) continue
      if (
        !data[i - 1] ||
        !data[i + 1] ||
        !data[i - w] ||
        !data[i + w]
      ) {
        next[i] = 0
      }
    }
  }
  data.set(next)
}

function keepLargest(data: Uint8Array, w: number, h: number) {
  const seen = new Uint8Array(data.length)
  let best: number[] = []
  const q = new Int32Array(data.length)

  for (let start = 0; start < data.length; start++) {
    if (!data[start] || seen[start]) continue
    let qs = 0
    let qe = 0
    q[qe++] = start
    seen[start] = 1
    const cells: number[] = []
    while (qs < qe) {
      const i = q[qs++]
      cells.push(i)
      const x = i % w
      const y = (i / w) | 0
      const nbs = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]
      for (const n of nbs) {
        if (n < 0 || seen[n] || !data[n]) continue
        seen[n] = 1
        q[qe++] = n
      }
    }
    if (cells.length > best.length) best = cells
  }

  data.fill(0)
  for (const i of best) data[i] = 1
}

export function traceContour(mask: Mask): { x: number; y: number }[] {
  const { width: w, height: h, data } = mask
  let sx = -1
  let sy = -1
  outer: for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (data[y * w + x] && !data[y * w + x - 1]) {
        sx = x
        sy = y
        break outer
      }
    }
  }
  if (sx < 0) return []

  const dirs = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ]
  const points: { x: number; y: number }[] = []
  let x = sx
  let y = sy
  let dir = 0
  for (let step = 0; step < w * h; step++) {
    points.push({ x, y })
    let found = false
    for (let k = 0; k < 8; k++) {
      const nd = (dir + 6 + k) % 8
      const nx = x + dirs[nd][0]
      const ny = y + dirs[nd][1]
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
      if (!data[ny * w + nx]) continue
      x = nx
      y = ny
      dir = nd
      found = true
      break
    }
    if (!found) break
    if (x === sx && y === sy && points.length > 8) break
  }

  return simplify(points, 1.6)
}

function simplify(points: { x: number; y: number }[], eps: number) {
  if (points.length < 4) return points
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1
  const stack: [number, number][] = [[0, points.length - 1]]
  while (stack.length) {
    const [s, e] = stack.pop()!
    const a = points[s]
    const b = points[e]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    let maxD = 0
    let maxI = s
    for (let i = s + 1; i < e; i++) {
      const p = points[i]
      const d = Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len
      if (d > maxD) {
        maxD = d
        maxI = i
      }
    }
    if (maxD > eps) {
      keep[maxI] = 1
      stack.push([s, maxI], [maxI, e])
    }
  }
  return points.filter((_, i) => keep[i])
}

export function maskBounds(mask: Mask) {
  let minX = mask.width
  let minY = mask.height
  let maxX = 0
  let maxY = 0
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      if (!mask.data[y * mask.width + x]) continue
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  if (maxX < minX) {
    return { minX: 0, minY: 0, maxX: mask.width - 1, maxY: mask.height - 1, w: mask.width, h: mask.height }
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  }
}

export { clamp }
