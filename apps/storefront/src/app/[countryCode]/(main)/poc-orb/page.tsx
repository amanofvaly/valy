"use client"

import { Environment, Lightformer, OrbitControls } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { useMemo, useRef, useState, useEffect } from "react"
import * as THREE from "three"
import { APPS, type SelfHostedApp } from "@lib/data/self-hosted-apps"

const RADIUS = 2.05
const DEPTH = 0.17
const TILE_SIZE = 0.64

// Create uniform tile geometry
const slabGeometry = () => {
  const hw = TILE_SIZE / 2
  const hh = TILE_SIZE / 2
  const radius = TILE_SIZE * 0.22
  const shape = new THREE.Shape()

  shape.moveTo(-hw + radius, -hh)
  shape.lineTo(hw - radius, -hh)
  shape.quadraticCurveTo(hw, -hh, hw, -hh + radius)
  shape.lineTo(hw, hh - radius)
  shape.quadraticCurveTo(hw, hh, hw - radius, hh)
  shape.lineTo(-hw + radius, hh)
  shape.quadraticCurveTo(-hw, hh, -hw, hh - radius)
  shape.lineTo(-hw, -hh + radius)
  shape.quadraticCurveTo(-hw, -hh, -hw + radius, -hh)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
    curveSegments: 12,
  })
  geometry.center()
  return geometry
}

const UP = new THREE.Vector3(0, 1, 0)

const tileQuaternion = (direction: THREE.Vector3) => {
  const m = new THREE.Matrix4()
  m.lookAt(new THREE.Vector3(0, 0, 0), direction, UP)
  return new THREE.Quaternion().setFromRotationMatrix(m)
}

const markTexture = (app: SelfHostedApp) => {
  const size = 512
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  const pad = size * 0.2
  const scale = (size - pad * 2) / 24
  ctx.translate(pad, pad)
  ctx.scale(scale, scale)
  ctx.fillStyle = app.brand
  ctx.fill(new Path2D(app.path))

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

const Tiles = () => {
  const group = useRef<THREE.Group>(null)
  const geometry = useMemo(() => slabGeometry(), [])
  const planeGeometry = useMemo(() => new THREE.PlaneGeometry(TILE_SIZE * 1.0, TILE_SIZE * 1.0), [])
  
  const textures = useMemo(() => {
    const cache = new Map<string, THREE.Texture | null>()
    APPS.forEach((app) => cache.set(app.slug, markTexture(app)))
    return cache
  }, [])
  
  const points = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(RADIUS, 1)
    const positions = ico.attributes.position.array
    const uniquePoints: THREE.Vector3[] = []
    const threshold = 0.01

    for (let i = 0; i < positions.length; i += 3) {
      const v = new THREE.Vector3(positions[i], positions[i+1], positions[i+2])
      if (!uniquePoints.some(p => p.distanceTo(v) < threshold)) {
        uniquePoints.push(v)
      }
    }
    return uniquePoints
  }, [])

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.2
      group.current.rotation.x += delta * 0.01
    }
  })

  return (
    <group ref={group}>
      {points.map((point, i) => {
        const direction = point.clone().normalize()
        const quaternion = tileQuaternion(direction)
        const app = APPS[i % APPS.length]
        const tex = textures.get(app.slug)

        return (
          <group key={i} position={point} quaternion={quaternion}>
            {/* The 3D Glass Tile - Transmission material (fast and smooth) */}
            <mesh geometry={geometry}>
              <meshPhysicalMaterial
                transmission={0.9}
                roughness={1}
                thickness={0.1}
                ior={1.5}
                color="#242424"
                clearcoat={0.5}
                clearcoatRoughness={0.1}
                attenuationColor="#ffffff"
                attenuationDistance={2}
                transparent={true}
              />
            </mesh>
            {/* Actual App Logo properly facing outwards inside the glass */}
            <mesh position={[0, 0, -(DEPTH / 2) - 0.025]} rotation={[0, Math.PI, 0]} geometry={planeGeometry}>
              {tex && <meshBasicMaterial map={tex} alphaTest={0.5} side={THREE.FrontSide} />}
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

const Studio = () => (
  <Environment resolution={256}>
    <Lightformer form="rect" intensity={6} position={[0, 4.5, 4]} scale={[9, 3, 1]} color="#ffffff" />
    <Lightformer form="rect" intensity={3.2} position={[-5, 0.5, 3]} scale={[2.4, 9, 1]} color="#f2f6fb" />
    <Lightformer form="rect" intensity={2.4} position={[5, -1, 2.5]} scale={[2, 9, 1]} color="#ffffff" />
    <Lightformer form="rect" intensity={1.6} position={[0, -4.5, 2]} scale={[9, 2.2, 1]} color="#dbe3ec" />
    <Lightformer form="ring" intensity={2.2} position={[-1.6, 2.4, 5.5]} scale={3} color="#ffffff" />
  </Environment>
)

export default function PocOrb() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className="flex h-screen w-full items-center justify-center bg-paper">
      <div className="relative mx-auto aspect-square w-full max-w-[40rem]">
        <div
          className="pointer-events-none absolute inset-[4%] rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgb(var(--line-strong) / 0.55) 0%, rgb(var(--line) / 0.4) 45%, rgb(var(--surface) / 0.5) 72%, transparent 100%)",
          }}
        />
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ position: [0, 0, 8.6], fov: 40 }}
        >
          <Studio />
          <Tiles />
          <OrbitControls enableZoom={false} />
        </Canvas>
      </div>
    </div>
  )
}
