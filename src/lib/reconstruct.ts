import { BufferAttribute, BufferGeometry, ExtrudeGeometry, Shape } from 'three'
import type { Photo, PhotoSlotId } from '../types'
import { extractMask, maskBounds, traceContour, type Mask } from './silhouette'

const SIZE = 192
const GRID = 56

export type ReconstructResult = {
  geometry: BufferGeometry
  warning: string | null
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read photo'))
    img.src = url
  })
}

export async function reconstructFromPhotos(
  photos: Photo[],
  longestInches: number,
  threshold: number,
): Promise<ReconstructResult> {
  const byId = new Map<PhotoSlotId, Mask>()
  for (const photo of photos) {
    const img = await loadImage(photo.url)
    const mask = extractMask(img, SIZE, threshold)
    byId.set(photo.id, mask)
  }

  const front = byId.get('front') ?? [...byId.values()][0]
  if (!front || front.coverage < 0.01) {
    throw new Error(
      'Could not separate the part from the background. Use a plain wall or floor, or raise the cut slider.',
    )
  }
  if (front.coverage > 0.92) {
    throw new Error(
      'The photo looks like the whole frame is the part. Back up a bit and shoot against a plain background.',
    )
  }

  const usableViews = [...byId.entries()].filter(([, m]) => m.coverage > 0.02 && m.coverage < 0.92)
  if (usableViews.length >= 2) {
    try {
      const geometry = visualHull(byId, longestInches)
      return {
        geometry,
        warning:
          usableViews.length < 3
            ? 'A third and fourth angle (side and top) will make the shape more accurate.'
            : null,
      }
    } catch {
      // fall through to extrusion
    }
  }

  const geometry = extrudeMask(front, longestInches, thicknessFrom(byId, front, longestInches))
  return {
    geometry,
    warning:
      photos.length < 2
        ? 'Add a side photo so thickness is measured instead of guessed.'
        : 'Used the front silhouette. Side photos help if the shape looks too flat.',
  }
}

function thicknessFrom(byId: Map<PhotoSlotId, Mask>, front: Mask, longest: number) {
  const side = byId.get('left') ?? byId.get('right')
  if (!side) return Math.max(0.18, longest * 0.12)
  const fb = maskBounds(front)
  const sb = maskBounds(side)
  const frontW = fb.w || 1
  const sideW = sb.w || 1
  const ratio = sideW / frontW
  return Math.max(0.12, Math.min(longest * 0.6, longest * ratio))
}

function extrudeMask(mask: Mask, longest: number, thickness: number) {
  const contour = traceContour(mask)
  if (contour.length < 6) throw new Error('Could not trace the outline of the part.')
  const b = maskBounds(mask)
  const span = Math.max(b.w, b.h, 1)
  const shape = new Shape()
  contour.forEach((p, i) => {
    const x = ((p.x - b.minX - b.w / 2) / span) * longest
    const y = ((b.maxY - p.y - b.h / 2) / span) * longest
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  })
  shape.closePath()
  const geo = new ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: Math.min(0.08, thickness * 0.2),
    bevelSize: Math.min(0.06, thickness * 0.15),
    bevelSegments: 1,
    curveSegments: 1,
  })
  geo.center()
  geo.computeVertexNormals()
  return geo
}

function sampleMask(mask: Mask, u: number, v: number) {
  const x = Math.round(u * (mask.width - 1))
  const y = Math.round((1 - v) * (mask.height - 1))
  if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) return 0
  return mask.data[y * mask.width + x]
}

function visualHull(byId: Map<PhotoSlotId, Mask>, longest: number) {
  const N = GRID
  const occ = new Uint8Array(N * N * N)
  const front = byId.get('front')
  const left = byId.get('left')
  const right = byId.get('right')
  const top = byId.get('top')

  for (let z = 0; z < N; z++) {
    const vz = (z + 0.5) / N
    for (let y = 0; y < N; y++) {
      const vy = (y + 0.5) / N
      for (let x = 0; x < N; x++) {
        const vx = (x + 0.5) / N
        let solid = 1
        if (front && !sampleMask(front, vx, vy)) solid = 0
        if (left && !sampleMask(left, vz, vy)) solid = 0
        if (right && !sampleMask(right, 1 - vz, vy)) solid = 0
        if (top && !sampleMask(top, vx, 1 - vz)) solid = 0
        occ[(z * N + y) * N + x] = solid
      }
    }
  }

  let filled = 0
  for (let i = 0; i < occ.length; i++) filled += occ[i]
  if (filled < 40) throw new Error('Visual hull empty')

  const geo = voxelQuads(occ, N, longest)
  geo.computeVertexNormals()
  return geo
}

function voxelQuads(occ: Uint8Array, N: number, longest: number) {
  const positions: number[] = []
  const normals: number[] = []
  const cell = longest / N
  const origin = -longest / 2

  const faces = [
    { dx: 1, dy: 0, dz: 0, n: [1, 0, 0], corners: [1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1] },
    { dx: -1, dy: 0, dz: 0, n: [-1, 0, 0], corners: [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0] },
    { dx: 0, dy: 1, dz: 0, n: [0, 1, 0], corners: [0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0] },
    { dx: 0, dy: -1, dz: 0, n: [0, -1, 0], corners: [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1] },
    { dx: 0, dy: 0, dz: 1, n: [0, 0, 1], corners: [0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1] },
    { dx: 0, dy: 0, dz: -1, n: [0, 0, -1], corners: [1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0] },
  ]

  const idx = (x: number, y: number, z: number) => (z * N + y) * N + x
  const empty = (x: number, y: number, z: number) =>
    x < 0 || y < 0 || z < 0 || x >= N || y >= N || z >= N || occ[idx(x, y, z)] === 0

  for (let z = 0; z < N; z++) {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (!occ[idx(x, y, z)]) continue
        for (const f of faces) {
          if (!empty(x + f.dx, y + f.dy, z + f.dz)) continue
          const ox = origin + x * cell
          const oy = origin + y * cell
          const oz = origin + z * cell
          const c = f.corners
          const verts = [
            [c[0], c[1], c[2]],
            [c[3], c[4], c[5]],
            [c[6], c[7], c[8]],
            [c[9], c[10], c[11]],
          ]
          const order = [0, 1, 2, 0, 2, 3]
          for (const vi of order) {
            positions.push(ox + verts[vi][0] * cell, oy + verts[vi][1] * cell, oz + verts[vi][2] * cell)
            normals.push(f.n[0], f.n[1], f.n[2])
          }
        }
      }
    }
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geo.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  return geo
}
