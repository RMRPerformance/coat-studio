import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  LatheGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { SamplePart } from '../types'

export function createSampleGeometry(kind: SamplePart): BufferGeometry {
  if (kind === 'sign') {
    const plate = new BoxGeometry(14, 10, 0.22)
    plate.computeVertexNormals()
    return plate
  }
  if (kind === 'tumbler') {
    return tumbler()
  }
  return header()
}

function header(): BufferGeometry {
  const geos: BufferGeometry[] = []
  const starts: [number, number, number][] = [
    [-3.2, 2.4, -5],
    [-1.1, 2.6, -5.2],
    [1.1, 2.6, -5.2],
    [3.2, 2.4, -5],
  ]
  const collector: [number, number, number] = [0, 0.5, 6]

  for (const s of starts) {
    const curve = new CatmullRomCurve3([
      new Vector3(s[0], s[1], s[2]),
      new Vector3(s[0] * 0.7, s[1] + 1.4, s[2] * 0.35),
      new Vector3(s[0] * 0.25, 0.9, collector[2] * 0.55),
      new Vector3(collector[0], collector[1], collector[2]),
    ])
    geos.push(new TubeGeometry(curve, 56, 0.52, 14, false))
    const flange = new CylinderGeometry(0.82, 0.82, 0.2, 22)
    flange.rotateX(Math.PI / 2)
    flange.translate(s[0], s[1], s[2] - 0.12)
    geos.push(flange)
  }

  const outlet = new CylinderGeometry(1.35, 1.45, 0.4, 28)
  outlet.rotateX(Math.PI / 2)
  outlet.translate(0, 0.5, 6.35)
  geos.push(outlet)

  const merged = mergeGeometries(geos, false)
  for (const g of geos) g.dispose()
  if (!merged) throw new Error('Could not build header')
  merged.center()
  merged.computeVertexNormals()
  return merged
}

function tumbler(): BufferGeometry {
  const profile = [
    new Vector2(1.55, -3.4),
    new Vector2(1.62, -2.6),
    new Vector2(1.7, -0.4),
    new Vector2(1.68, 2.2),
    new Vector2(1.55, 3.0),
    new Vector2(1.35, 3.15),
    new Vector2(1.2, 3.35),
    new Vector2(0.2, 3.4),
  ]
  const g = new LatheGeometry(profile, 48)
  g.computeVertexNormals()
  g.center()
  return g
}
