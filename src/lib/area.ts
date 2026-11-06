import { BufferGeometry, Triangle, Vector3 } from 'three'

const _a = new Vector3()
const _b = new Vector3()
const _c = new Vector3()
const _t = new Triangle()

export function surfaceArea(geo: BufferGeometry): number {
  const pos = geo.getAttribute('position')
  if (!pos) return 0
  const idx = geo.getIndex()
  let area = 0
  if (idx) {
    for (let i = 0; i < idx.count; i += 3) {
      _a.fromBufferAttribute(pos, idx.getX(i))
      _b.fromBufferAttribute(pos, idx.getX(i + 1))
      _c.fromBufferAttribute(pos, idx.getX(i + 2))
      _t.set(_a, _b, _c)
      area += _t.getArea()
    }
  } else {
    for (let i = 0; i < pos.count; i += 3) {
      _a.fromBufferAttribute(pos, i)
      _b.fromBufferAttribute(pos, i + 1)
      _c.fromBufferAttribute(pos, i + 2)
      _t.set(_a, _b, _c)
      area += _t.getArea()
    }
  }
  return area
}

export function longestAxis(geo: BufferGeometry): number {
  geo.computeBoundingBox()
  const b = geo.boundingBox
  if (!b) return 1
  const x = b.max.x - b.min.x
  const y = b.max.y - b.min.y
  const z = b.max.z - b.min.z
  return Math.max(x, y, z, 0.001)
}
