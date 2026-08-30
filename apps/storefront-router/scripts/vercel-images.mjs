/*
 * Teach the Vercel build output about image optimization.
 *
 * The Build Output API only optimizes images if `config.json` carries an
 * `images` block, and it rejects any width or host not named there with a 400.
 * The widths below are the same list the `next/image` shim generates URLs
 * from; the hosts are the `remotePatterns` the old `next.config.js` allowed,
 * including the backend derived from NEXT_PUBLIC_MEDUSA_BACKEND_URL.
 */
import { readFile, writeFile } from "node:fs/promises"

const CONFIG = ".vercel/output/config.json"

const IMAGE_SIZES = [16, 32, 48, 64, 96, 128, 256, 384]
const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]

const backendPattern = (() => {
  const url = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  if (!url) return []
  try {
    const { protocol, hostname, port } = new URL(url)
    return [{ protocol: protocol.replace(":", ""), hostname, ...(port ? { port } : {}) }]
  } catch {
    console.warn(`[vercel-images] ignoring unparseable NEXT_PUBLIC_MEDUSA_BACKEND_URL: ${url}`)
    return []
  }
})()

const images = {
  sizes: [...IMAGE_SIZES, ...DEVICE_SIZES],
  formats: ["image/avif", "image/webp"],
  minimumCacheTTL: 60,
  remotePatterns: [
    { protocol: "http", hostname: "localhost" },
    { protocol: "https", hostname: "api.valy.in", pathname: "/static/**" },
    { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
    { protocol: "https", hostname: "*.s3.amazonaws.com" },
    { protocol: "https", hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com" },
    { protocol: "https", hostname: "images.unsplash.com" },
    ...backendPattern,
  ],
}

let raw
try {
  raw = await readFile(CONFIG, "utf8")
} catch (error) {
  // Loud on purpose: without this block every optimized URL 400s in production.
  console.error(`[vercel-images] could not read ${CONFIG} — image optimization NOT configured.`)
  process.exit(1)
}

const config = JSON.parse(raw)
config.images = images
await writeFile(CONFIG, JSON.stringify(config, null, 2))
console.log(`[vercel-images] wrote images config (${images.sizes.length} widths, ${images.remotePatterns.length} hosts)`)
