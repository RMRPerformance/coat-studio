import { Canvas } from '@react-three/fiber'
import { Bounds, ContactShadows, OrbitControls, useBounds } from '@react-three/drei'
import { useLayoutEffect, useMemo } from 'react'
import {
  Box3,
  Color,
  DoubleSide,
  type BufferGeometry,
  type MeshPhysicalMaterialParameters,
} from 'three'
import type { ProcessKind, Sheen } from '../types'
import { wrinkleTexture } from '../lib/noiseTexture'

type Props = {
  geometry: BufferGeometry | null
  color: string
  metallic?: boolean
  process: ProcessKind
  sheen: Sheen
  building: boolean
}

function CoatMesh({
  geometry,
  color,
  metallic = false,
  process,
  sheen,
}: {
  geometry: BufferGeometry
  color: string
  metallic?: boolean
  process: ProcessKind
  sheen: Sheen
}) {
  const materialProps: MeshPhysicalMaterialParameters = useMemo(() => {
    const wrinkle = sheen === 'wrinkle'
    const gloss = sheen === 'gloss'
    return {
      color: new Color(color),
      metalness: process === 'powder' ? (metallic ? 0.55 : 0.12) : metallic ? 0.35 : 0.06,
      roughness: wrinkle ? 0.84 : gloss ? (process === 'powder' ? 0.22 : 0.28) : 0.46,
      clearcoat: wrinkle ? 0.05 : gloss ? (process === 'powder' ? 0.85 : 0.4) : 0.18,
      clearcoatRoughness: gloss ? 0.18 : 0.45,
      sheen: process === 'cerakote' ? 0.18 : 0,
      sheenColor: new Color(color),
      bumpMap: wrinkle ? wrinkleTexture() : undefined,
      bumpScale: wrinkle ? 0.22 : 0,
      envMapIntensity: 0.8,
      side: DoubleSide,
    }
  }, [color, metallic, process, sheen])

  const offset = useMemo(() => {
    geometry.computeBoundingBox()
    const box = geometry.boundingBox ?? new Box3()
    const cx = (box.min.x + box.max.x) / 2
    const cy = box.min.y
    const cz = (box.min.z + box.max.z) / 2
    return [-cx, -cy, -cz] as const
  }, [geometry])

  useLayoutEffect(() => {
    geometry.computeVertexNormals()
  }, [geometry])

  return (
    <mesh geometry={geometry} position={offset} castShadow receiveShadow>
      <meshPhysicalMaterial {...materialProps} />
    </mesh>
  )
}

function Fit({ token }: { token: string }) {
  const bounds = useBounds()
  useLayoutEffect(() => {
    bounds.refresh().clip().fit()
  }, [token, bounds])
  return null
}

export function Viewer({ geometry, color, metallic, process, sheen, building }: Props) {
  return (
    <div className="viewer">
      <Canvas
        shadows
        camera={{ position: [18, 12, 22], fov: 35 }}
        gl={{ antialias: true }}
        dpr={[1, 1.8]}
      >
        <color attach="background" args={['#141516']} />
        <hemisphereLight args={['#fff1e0', '#2a2c30', 0.7]} />
        <directionalLight
          position={[12, 18, 10]}
          intensity={1.6}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-10, 6, -8]} intensity={0.35} color="#8ab4ff" />
        <spotLight position={[0, 20, 0]} intensity={0.4} angle={0.6} penumbra={0.8} />
        <Bounds fit clip observe margin={1.35}>
          {geometry ? (
            <>
              <CoatMesh
                geometry={geometry}
                color={color}
                metallic={metallic}
                process={process}
                sheen={sheen}
              />
              <Fit token={geometry.uuid} />
            </>
          ) : null}
        </Bounds>
        <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={48} blur={2.2} far={16} />
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={4}
          maxDistance={60}
          maxPolarAngle={Math.PI / 2.05}
          autoRotate
          autoRotateSpeed={0.6}
        />
      </Canvas>
      {building ? <div className="viewer-status">Building 3D from photos…</div> : null}
      {!geometry && !building ? <div className="viewer-status">No part loaded</div> : null}
    </div>
  )
}
