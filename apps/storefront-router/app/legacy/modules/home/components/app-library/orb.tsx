"use client"

import { Environment, Lightformer } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { APPS, type SelfHostedApp } from "@lib/data/self-hosted-apps"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"

/**
 * Twenty-eight applications as a sphere of glass tiles.
 *
 * The section's problem has always been that twenty-eight of anything is
 * list-shaped: enumerate them in a grid, in six grids, or in a launcher and a
 * reader still meets a catalogue. A sphere has no first item and no last one.
 * It also does the thing a list cannot — it makes the marks the picture, at a
 * size where the colour in them is the point.
 *
 * The geometry is one extruded rounded slab per ring, so the scene holds seven
 * geometries and about 120 draws.
 *
 * It sits on paper, not on the dark ground these objects are usually shot
 * against, and that one fact settles how the glass has to be built. Physical
 * `transmission` is the correct way to render glass and it is useless here: it
 * refracts what is behind the mesh, and what is behind the mesh is a white
 * page, so every tile came out as a pale lozenge no matter how it was tuned.
 * The tiles use ordinary alpha instead — a fifth opacity, one pale blue for all
 * of them, lit by a high-contrast environment so the bevels keep a hard
 * highlight. Seeing the far side of the sphere through the near side is the
 * only cue that reads as glass, and alpha is the only thing that delivers it.
 *
 * The colour of the glass is deliberately not the project's. The marks carry
 * the borrowed colour; the glass is the material they are set in.
 *
 * Nothing here is fetched. The marks are the same 24×24 paths the rest of the
 * site draws, painted to a canvas at load; the environment is built from
 * light shapes in the scene rather than from an HDRI on a CDN, so the orb
 * costs one shader compile and no network at all.
 */

/** Sphere radius, in scene units. The camera is framed around this. */
const RADIUS = 2.05

/** Slab thickness. Width and height come from each tile's own ring. */
const DEPTH = 0.17

/**
 * Latitude rings, not a scattered distribution.
 *
 * An even scatter across the sphere — the golden-angle arrangement these things
 * usually use — has no rows in it, and the result reads as spilled rather than
 * built. Rings give the object a grain: columns that carry round the equator
 * and rows that stack toward the poles, which is what makes a thing made of
 * tiles look made rather than sprinkled.
 *
 * Every tile is cut to its own cell. A globe's grid is not made of identical
 * squares: a cell at sixty degrees north is half as wide as one at the equator,
 * because the parallel it sits on is half as long. Tiling a sphere with one
 * size means either gaps at the equator or tiles ploughing through each other
 * near the poles, and the first version of this did both. Here the ring counts
 * divide into each other — twelve, twelve, six — so every tile keeps a meridian
 * of its own, and each ring's tile is sized from its own circumference so
 * nothing overlaps anything.
 *
 * Fifty slots, not twenty-eight. Twenty-eight tiles is not enough to skin a
 * sphere — spaced far enough apart to reach the poles they stop being a surface
 * and become a mobile. So the sphere is built at the density it needs and the
 * catalogue is laid into it: each of the twenty-eight gets one primary tile,
 * evenly spaced through the sequence, and the slots between them are either a
 * second showing of another mark or left as clear glass. Repeats read as
 * abundance, and the blanks let the glass be glass — which is the whole reason
 * for building it out of glass.
 */
const RINGS = [
  { latitude: 90, count: 1 },
  { latitude: 60, count: 12 },
  { latitude: 30, count: 12 },
  { latitude: 0, count: 12 },
  { latitude: -30, count: 12 },
  { latitude: -60, count: 12 },
  { latitude: -90, count: 1 },
]

/**
 * The rings that carry a first showing of an application.
 *
 * Twelve columns hold at every latitude, so a tile at sixty degrees is half the
 * width of one at the equator — which is what a cell on a globe actually is,
 * and the price of a grid that truly lines up. It also means the tiles up there
 * are too narrow to carry a mark at a readable size, so the twenty-eight
 * primaries all live in the three wide rings and the narrow ones take repeats
 * and blanks.
 */
const PRIMARY_RINGS = [2, 3, 4]

/** Degrees between one ring and the next. Sets every tile's height. */
const RING_STEP = 30

/** Proportion of its own cell a tile fills. The remainder is the grout. */
const FILL = 0.88

/** One slot in five carries no mark, so the glass has somewhere to show. */
const BLANK_EVERY = 5



type Tile = {
  direction: THREE.Vector3
  /** Which ring it belongs to, and therefore what size it is cut to. */
  ring: number
  /** Null on a blank: clear glass, no mark, and not a target for the tour. */
  app: SelfHostedApp | null
  /** True on the one tile that represents this application to the tour. */
  primary: boolean
}

/**
 * Where every tile sits and what, if anything, is on it.
 *
 * The order matters as much as the positions. Primaries are spread at an even
 * stride through a sequence that walks ring by ring, so stepping through the
 * catalogue turns the sphere smoothly on its own axis for a dozen tiles at a
 * time before it tips to the next row — which is what makes a steered orb read
 * as a spinning one. Alternate rings are offset half a step so the tiles
 * interlock rather than stacking into columns with gaps between them.
 */
const layout = (): Tile[] => {
  const cells: { direction: THREE.Vector3; ring: number }[] = []

  RINGS.forEach((ring, index) => {
    const phi = (ring.latitude * Math.PI) / 180
    const y = Math.sin(phi)
    const radius = Math.cos(phi)

    for (let i = 0; i < ring.count; i += 1) {
      /* No half-step offset. Twelve over twelve over six means every tile in
       * every ring stands on one of twelve meridians, and the sphere reads as
       * ruled rather than as scattered. */
      const theta = (i / ring.count) * Math.PI * 2
      cells.push({
        direction: new THREE.Vector3(
          Math.cos(theta) * radius,
          y,
          Math.sin(theta) * radius
        ).normalize(),
        ring: index,
      })
    }
  })

  /* Primaries go only where a mark can be read, spread at an even stride so
   * that stepping through the catalogue walks round a ring rather than jumping
   * across the sphere. */
  const eligible = cells
    .map((cell, i) => ({ cell, i }))
    .filter(({ cell }) => PRIMARY_RINGS.includes(cell.ring))
    .map(({ i }) => i)

  const primaryOf = new Map<number, number>()
  APPS.forEach((_, app) => {
    primaryOf.set(
      eligible[Math.round((app * eligible.length) / APPS.length) % eligible.length],
      app
    )
  })

  return cells.map((cell, i) => {
    const primary = primaryOf.get(i)
    if (primary !== undefined) {
      return { ...cell, app: APPS[primary], primary: true }
    }
    if (i % BLANK_EVERY === 2) {
      return { ...cell, app: null, primary: false }
    }
    /* A second showing for somebody, on a stride coprime with the catalogue so
     * the repeats spread out instead of clustering. */
    return { ...cell, app: APPS[(i * 11 + 5) % APPS.length], primary: false }
  })
}

/** The width and height of one ring's tile, from that ring's own geometry. */
const cellSize = (index: number) => {
  const ring = RINGS[index]
  const phi = (ring.latitude * Math.PI) / 180
  const height = RADIUS * ((RING_STEP * Math.PI) / 180) * FILL

  if (ring.count === 1) {
    /* A pole cap has no circumference to divide, so it takes the smallest
     * width on the sphere and stays square. */
    return { width: height * 0.82, height: height * 0.82 }
  }

  const width =
    ((2 * Math.PI * RADIUS * Math.cos(phi)) / ring.count) * FILL
  return { width, height }
}

/**
 * A rounded, bevelled slab, cut to a given cell.
 *
 * One geometry per ring rather than one for the whole sphere, because the rings
 * are not the same shape as each other. Seven rings, seven geometries, fifty
 * meshes referencing them.
 */
const slabGeometry = (width: number, height: number) => {
  const hw = width / 2
  const hh = height / 2
  const radius = Math.min(width, height) * 0.22
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
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3,
    curveSegments: 10,
  })
  geometry.center()
  return geometry
}

const UP = new THREE.Vector3(0, 1, 0)
const EAST_REFERENCE = new THREE.Vector3(0, 0, 1)
const X_AXIS = new THREE.Vector3(1, 0, 0)

/**
 * How a tile is turned within its own cell.
 *
 * `setFromUnitVectors` gives the shortest arc from one direction to another,
 * which points the tile outward and then leaves its roll to chance — so every
 * square sat at its own arbitrary angle and sixty of them together read as
 * scattered debris rather than as a grid. A tile has to be built from a basis
 * instead: outward for its face, east along its parallel, north along its
 * meridian. Then every edge in the sphere runs along a line of latitude or
 * longitude, which is the whole reason for laying it out on a globe.
 */
const tileQuaternion = (direction: THREE.Vector3) => {
  const forward = direction.clone()
  /* At the poles the world up is parallel to the face normal and the cross
   * product collapses; any perpendicular will do there. */
  const reference = Math.abs(forward.y) > 0.999 ? EAST_REFERENCE : UP
  const east = new THREE.Vector3().crossVectors(reference, forward).normalize()
  const north = new THREE.Vector3().crossVectors(forward, east)

  return new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(east, north, forward)
  )
}

/**
 * How the sphere is turned to put one tile in front of the reader.
 *
 * Also not a shortest arc. The shortest rotation between two directions rolls
 * the sphere about the view axis by whatever the arc happens to require, so the
 * north pole wandered and the rows came out at a different diagonal for every
 * application. This is the rotation a globe on a stand can actually make: swing
 * about the vertical to bring the tile's meridian round to the front, then tip
 * about the horizontal to bring its parallel up to eye level. No roll, so the
 * grid stays level whatever is being shown.
 */
const facingQuaternion = (direction: THREE.Vector3) => {
  const azimuth = Math.atan2(direction.x, direction.z)
  const latitude = Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1))

  const swing = new THREE.Quaternion().setFromAxisAngle(UP, -azimuth)
  const tip = new THREE.Quaternion().setFromAxisAngle(X_AXIS, latitude)
  /* `tip * swing` applies the swing first. */
  return tip.multiply(swing)
}

/**
 * The glass itself. One colour for the whole sphere.
 *
 * A pale blue reads as glass on a white page the way green reads as glass on a
 * bottle: it is what people expect the material to be, so the tile is read as
 * transparent before anything else about it registers.
 */
const GLASS = "#8fc4e6"

/**
 * The mark, painted to a canvas.
 *
 * The same path data the DOM sprite uses, so a tile and its row in the dock are
 * the same drawing. Simple Icons paths fill with the nonzero rule, which is
 * `fill()`'s default, so the counters in Nextcloud's and Ollama's marks come
 * out right without any per-icon handling.
 */
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

type OrbProps = {
  /** The application that should be facing the reader. */
  slug: string
  /** Called when a drag settles on a different tile, or a tile is clicked. */
  onSettle: (slug: string) => void
  /** Whether the tour is running. Kept for the caller's own bookkeeping. */
  drift: boolean
}

const Tiles = ({ slug, onSettle }: OrbProps) => {
  const group = useRef<THREE.Group>(null)
  const { gl } = useThree()

  /* One slab and one mark plane per ring, shared by every tile in it. */
  const cut = useMemo(
    () =>
      RINGS.map((_, index) => {
        const { width, height } = cellSize(index)
        const mark = Math.min(width, height) * 0.66
        return {
          slab: slabGeometry(width, height),
          plane: new THREE.PlaneGeometry(mark, mark),
        }
      }),
    []
  )
  const tiles = useMemo(layout, [])
  const textures = useMemo(() => {
    const cache = new Map<string, THREE.Texture | null>()
    APPS.forEach((app) => cache.set(app.slug, markTexture(app)))
    return cache
  }, [])

  /** Where each application's own tile sits, for the tour and the dock. */
  const primaryOf = useMemo(() => {
    const map = new Map<string, number>()
    tiles.forEach((tile, i) => {
      if (tile.primary && tile.app) map.set(tile.app.slug, i)
    })
    return map
  }, [tiles])

  /* The tile currently being brought to the front. Held in a ref rather than
   * state because it is read every frame and changing it must not re-render
   * sixty meshes. */
  const front = useRef(primaryOf.get(slug) ?? 0)
  const seen = useRef(slug)

  const target = useMemo(() => new THREE.Quaternion(), [])
  const drag = useRef({ active: false, moved: 0, x: 0, y: 0 })

  useEffect(
    () => () => {
      cut.forEach((ring) => {
        ring.slab.dispose()
        ring.plane.dispose()
      })
      textures.forEach((texture) => texture?.dispose())
    },
    [cut, textures]
  )

  /* Pointer handling lives on the canvas rather than on a raycast target: the
   * reader is dragging the whole sphere, not any tile in it, and a DOM handler
   * keeps working over the gaps between tiles. */
  useEffect(() => {
    const canvas = gl.domElement
    const state = drag.current

    const down = (event: PointerEvent) => {
      state.active = true
      state.moved = 0
      state.x = event.clientX
      state.y = event.clientY
      canvas.setPointerCapture(event.pointerId)
    }

    const move = (event: PointerEvent) => {
      if (!state.active || !group.current) return
      const dx = event.clientX - state.x
      const dy = event.clientY - state.y
      state.x = event.clientX
      state.y = event.clientY
      state.moved += Math.abs(dx) + Math.abs(dy)

      group.current.quaternion.premultiply(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(dy * 0.005, dx * 0.005, 0, "XYZ")
        )
      )
    }

    const up = (event: PointerEvent) => {
      if (!state.active) return
      state.active = false
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId)
      }
      if (!group.current || state.moved < 6) return

      /* Settle on whichever marked tile the reader left nearest the front. A
       * blank cannot win: stopping the sphere on a piece of empty glass would
       * leave the panel beside it showing the last thing selected, which reads
       * as a fault rather than as a choice. */
      const facing = new THREE.Vector3()
      let best = -Infinity
      let index = front.current

      tiles.forEach((tile, i) => {
        if (!tile.app) return
        facing.copy(tile.direction).applyQuaternion(group.current!.quaternion)
        if (facing.z > best) {
          best = facing.z
          index = i
        }
      })

      front.current = index
      const settled = tiles[index].app
      if (settled) {
        seen.current = settled.slug
        onSettle(settled.slug)
      }
    }

    canvas.addEventListener("pointerdown", down)
    canvas.addEventListener("pointermove", move)
    canvas.addEventListener("pointerup", up)
    canvas.addEventListener("pointercancel", up)
    return () => {
      canvas.removeEventListener("pointerdown", down)
      canvas.removeEventListener("pointermove", move)
      canvas.removeEventListener("pointerup", up)
      canvas.removeEventListener("pointercancel", up)
    }
  }, [gl, tiles, onSettle])

  useFrame((_, delta) => {
    if (!group.current || drag.current.active) return

    /* A selection made anywhere else — the dock, the tour, a keyboard — moves
     * the sphere to that application's own tile. */
    if (seen.current !== slug) {
      seen.current = slug
      front.current = primaryOf.get(slug) ?? front.current
    }

    /*
     * Steered, not free-spinning. A sphere turning on a fixed axis never brings
     * its poles to the front, so the tiles nearest them would simply never be
     * seen. Easing toward each tile in turn keeps the whole thing in slow
     * constant motion and guarantees every application its moment.
     */
    target.copy(facingQuaternion(tiles[front.current].direction))
    group.current.quaternion.slerp(target, 1 - Math.pow(0.04, delta))
  })

  return (
    <group ref={group}>
      {tiles.map((tile, i) => {
        const position = tile.direction.clone().multiplyScalar(RADIUS)
        const quaternion = tileQuaternion(tile.direction)
        const texture = tile.app ? textures.get(tile.app.slug) : null

        return (
          <group
            key={i}
            position={position}
            quaternion={quaternion}
            onClick={(event) => {
              if (!tile.app || drag.current.moved > 6) return
              event.stopPropagation()
              front.current = i
              seen.current = tile.app.slug
              onSettle(tile.app.slug)
            }}
            onPointerOver={() => {
              if (tile.app) document.body.style.cursor = "pointer"
            }}
            onPointerOut={() => (document.body.style.cursor = "")}
          >
            {texture && (
              /*
               * The mark sits just proud of the outer face, inset far enough
               * that the bevel frames it. Suspending it inside the slab is the
               * prettier idea and it does not survive a paper ground: behind
               * even lightly frosted glass, on white, the mark disappears.
               */
              <mesh
                geometry={cut[tile.ring].plane}
                position={[0, 0, DEPTH / 2 + 0.055]}
              >
                <meshBasicMaterial
                  map={texture}
                  transparent
                  toneMapped={false}
                  depthWrite={false}
                />
              </mesh>
            )}

            <mesh geometry={cut[tile.ring].slab}>
              <meshPhysicalMaterial
                /*
                 * Alpha, not transmission.
                 *
                 * `transmission` is the physically correct way to render glass,
                 * and it cannot work here: it refracts whatever is behind the
                 * mesh, and what is behind this mesh is a white page. Every
                 * tuning pass produced the same result — a pale lozenge — and
                 * calling it frosted did not make it transparent. Ordinary
                 * alpha blending does what the eye actually wants: at a fifth
                 * opacity you see the far side of the sphere through the near
                 * side, and seeing through a thing is the only cue that says
                 * glass.
                 *
                 * One colour for all of them, not each project's own. Sixty
                 * tiles tinted sixty different brand colours is a bag of
                 * sweets — the marks already carry the colour, and the glass
                 * should be the thing they are set in.
                 */
                color={GLASS}
                transparent
                opacity={tile.app ? 0.22 : 0.13}
                roughness={0.05}
                metalness={0}
                ior={1.5}
                reflectivity={0.55}
                clearcoat={1}
                clearcoatRoughness={0.03}
                envMapIntensity={1.5}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/**
 * The scene's own light, built from shapes in front of and behind the sphere.
 *
 * An HDRI preset would be one network request to a CDN for a file measured in
 * megabytes, on a page whose argument is that it should paint immediately — and
 * on a site that does not send its readers to third-party hosts. Four
 * rectangles give glass everything it needs: something bright to refract and
 * something dark to find an edge against.
 */
const Studio = () => (
  <Environment resolution={256}>
    {/* Everything the lightformers do not cover stays black, which is the
     * point: a frosted slab on a white page is only legible by the darker
     * bands it reflects. */}
    <Lightformer
      form="rect"
      intensity={6}
      position={[0, 4.5, 4]}
      scale={[9, 3, 1]}
      color="#ffffff"
    />
    <Lightformer
      form="rect"
      intensity={3.2}
      position={[-5, 0.5, 3]}
      scale={[2.4, 9, 1]}
      color="#f2f6fb"
    />
    <Lightformer
      form="rect"
      intensity={2.4}
      position={[5, -1, 2.5]}
      scale={[2, 9, 1]}
      color="#ffffff"
    />
    <Lightformer
      form="rect"
      intensity={1.6}
      position={[0, -4.5, 2]}
      scale={[9, 2.2, 1]}
      color="#dbe3ec"
    />
    <Lightformer
      form="ring"
      intensity={2.2}
      position={[-1.6, 2.4, 5.5]}
      scale={3}
      color="#ffffff"
    />
  </Environment>
)

const AppOrb = (props: OrbProps) => {
  const [running, setRunning] = useState(false)
  const host = useRef<HTMLDivElement>(null)

  /* A WebGL context painting a sphere nobody is looking at is a battery bill. */
  useEffect(() => {
    const node = host.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => setRunning(entry.isIntersecting),
      { threshold: 0.15 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={host} className="h-full w-full touch-none">
      <Canvas
        frameloop={running ? "always" : "never"}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 8.6], fov: 40 }}
      >
        <Studio />
        <Tiles {...props} />
      </Canvas>
    </div>
  )
}

export default AppOrb
