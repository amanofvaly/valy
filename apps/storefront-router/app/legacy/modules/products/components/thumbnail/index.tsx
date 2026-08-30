import { cn } from "@lib/util/cn"
import { headlineSpecs, ProductMetadata } from "@lib/util/specs"
import Image from "next/image"

/**
 * The product image frame.
 *
 * Two rules it did not follow before, both of which made a grid look broken:
 *
 * `shrink-0`, because this sits in a flex column and flex items shrink by
 * default — a card whose title ran to two lines squeezed its own image, so a
 * row of four cards had four different image heights.
 *
 * And the image fills the frame. It used to be `object-contain` with `p-6` for
 * anything that was not a machine, which rendered a small square floating in a
 * large bordered box. The card is the image.
 *
 * Where there is no photograph — which is most of the catalogue, and an open
 * item — the frame carries a specification readout instead. Not the product's
 * name: that is already printed directly underneath, and saying it twice is how
 * a placeholder starts looking like a mistake.
 */

type ThumbnailProps = {
  thumbnail?: string | null
  images?: { url?: string }[] | null
  size?: "small" | "medium" | "large" | "full"
  /** 4:3 rather than square, for a hero or a featured rail. */
  isFeatured?: boolean
  title?: string
  /** Feeds the readout when there is no photograph. */
  metadata?: ProductMetadata
  priority?: boolean
  /** Cart lines and order rows, where there is no room for a readout. */
  compactPlate?: boolean
  className?: string
  "data-testid"?: string
}

const Thumbnail = ({
  thumbnail,
  images,
  size = "full",
  isFeatured,
  title,
  metadata,
  priority,
  compactPlate,
  className,
  "data-testid": dataTestid,
}: ThumbnailProps) => {
  const image = thumbnail || images?.[0]?.url

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg bg-surface",
        isFeatured ? "aspect-[4/3]" : "aspect-square",
        size === "small" && "w-[72px]",
        size === "medium" && "w-[120px]",
        size === "large" && "w-[280px]",
        size === "full" && "w-full",
        className
      )}
      data-testid={dataTestid}
    >
      {image ? (
        <Image
          src={image}
          alt={title ?? ""}
          className="object-cover object-center"
          draggable={false}
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
          fill
        />
      ) : (
        <SpecPlate metadata={metadata} title={title} compact={compactPlate} />
      )}
    </div>
  )
}

/**
 * What a product without a photograph shows: the figures a homelab buyer scans
 * anyway, in the monospace the spec block uses everywhere else.
 */
export const SpecPlate = ({
  metadata,
  title,
  compact,
}: {
  metadata?: ProductMetadata
  title?: string
  compact?: boolean
}) => {
  const rows = headlineSpecs(metadata, 3)

  // At cart-line scale there is room for a name and nothing else.
  if (compact) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-surface p-2">
        <span className="line-clamp-3 text-center text-2xs font-medium leading-tight text-muted">
          {title}
        </span>
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-surface">
        <span className="font-mono text-2xs uppercase tracking-[0.14em] text-line-strong">
          No photograph yet
        </span>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col justify-end gap-2 bg-surface p-4">
      <span className="font-mono text-2xs uppercase tracking-[0.14em] text-line-strong">
        No photograph yet
      </span>
      <dl className="flex flex-col gap-1 border-t border-line-strong pt-2">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-baseline justify-between gap-3"
          >
            <dt className="shrink-0 text-2xs text-muted">{row.label}</dt>
            <dd className="truncate font-mono text-2xs tabular text-ink">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default Thumbnail
