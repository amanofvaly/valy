/*
 * `next/image`, backed by Vercel's image optimizer.
 *
 * The old store set `formats: ["image/avif", "image/webp"]` in `next.config.js`
 * and let Next resize every image to the width it was actually rendered at.
 * Without that, a 1,254px 2MB PNG is downloaded in full to fill a 320px card,
 * which is the single largest thing on most of these pages.
 *
 * `/_vercel/image` is the same optimizer Next uses on Vercel, addressed
 * directly. The allowed widths and remote hosts must match what is written into
 * `.vercel/output/config.json` by `scripts/vercel-images.mjs` — a width that is
 * not in that list is rejected with a 400, so the two lists are generated from
 * the same constants.
 *
 * Off outside Vercel (`__IMAGE_OPTIMIZER__` is false), where no optimizer
 * exists to answer: a local production run then serves the original file
 * rather than a broken link.
 */
declare const __IMAGE_OPTIMIZER__: boolean

export const IMAGE_SIZES = [16, 32, 48, 64, 96, 128, 256, 384]
export const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
const ALL_SIZES = [...IMAGE_SIZES, ...DEVICE_SIZES]

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | { src: string }
  fill?: boolean
  priority?: boolean
  quality?: number
}

const enabled = typeof __IMAGE_OPTIMIZER__ !== "undefined" && __IMAGE_OPTIMIZER__

const optimize = (src: string, width: number, quality: number) =>
  `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`

/** The next allowed width at or above the one asked for. */
const snap = (width: number) =>
  ALL_SIZES.find((size) => size >= width) ?? ALL_SIZES[ALL_SIZES.length - 1]

function buildSrcSet(src: string, quality: number, sizes?: string, width?: number) {
  // A `sizes` hint (or `fill`) means the rendered width varies with viewport,
  // so the candidates are the device widths and the browser picks.
  if (sizes) {
    return DEVICE_SIZES.map((w) => `${optimize(src, w, quality)} ${w}w`).join(", ")
  }
  // A fixed width needs only 1x and 2x.
  if (width) {
    return [snap(width), snap(width * 2)]
      .map((w, i) => `${optimize(src, w, quality)} ${i + 1}x`)
      .join(", ")
  }
  return undefined
}

export default function Image({
  src,
  fill,
  priority,
  quality = 75,
  alt = "",
  style,
  sizes,
  width,
  ...props
}: Props) {
  const resolved = typeof src === "string" ? src : src.src
  const numericWidth = typeof width === "number" ? width : Number(width) || undefined
  // Data and blob URLs have nothing to optimise and the optimizer rejects them.
  const optimizable = enabled && !/^data:|^blob:/.test(resolved)
  const effectiveSizes = sizes ?? (fill ? "100vw" : undefined)

  return (
    <img
      src={optimizable ? optimize(resolved, snap(numericWidth ?? 1920), quality) : resolved}
      srcSet={optimizable ? buildSrcSet(resolved, quality, effectiveSizes, numericWidth) : undefined}
      sizes={effectiveSizes}
      alt={alt}
      width={width}
      loading={priority ? "eager" : props.loading || "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : props.fetchPriority}
      style={fill ? { position: "absolute", width: "100%", height: "100%", inset: 0, ...style } : style}
      {...props}
    />
  )
}
