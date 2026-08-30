"use client"

import { cn } from "@lib/util/cn"
import { useMemo, useState } from "react"

/**
 * The RAID calculator, and the capacity translator under it.
 *
 * Synology's version of this is one of the genuinely good things on their site,
 * and it suits a shop selling to people who have never run a server: the
 * question "how many drives do I need" is unanswerable until someone shows you
 * that redundancy costs capacity.
 *
 * Everything is computed in the browser from two numbers, so every control
 * responds on the press with no network involved at all.
 */

type Layout = {
  id: string
  name: string
  /** Drives lost to redundancy. */
  parity: number
  minDrives: number
  survives: string
  note: string
}

const LAYOUTS: Layout[] = [
  {
    id: "stripe",
    name: "No redundancy",
    parity: 0,
    minDrives: 1,
    survives: "Nothing",
    note: "Every byte of every drive is usable, and one failure loses all of it. Only sensible for things you can download again.",
  },
  {
    id: "mirror",
    name: "Mirror",
    parity: 1,
    minDrives: 2,
    survives: "One drive",
    note: "Half the capacity, and the simplest thing to recover. What a two-bay machine does by default.",
  },
  {
    id: "raidz1",
    name: "RAID-Z1",
    parity: 1,
    minDrives: 3,
    survives: "One drive",
    note: "One drive of the array goes to parity. The usual choice at four bays.",
  },
  {
    id: "raidz2",
    name: "RAID-Z2",
    parity: 2,
    minDrives: 4,
    survives: "Two drives",
    note: "Two drives of parity. Worth it from six bays up, because a rebuild is exactly when a second drive tends to die.",
  },
]

const DRIVE_SIZES = [4, 6, 8, 12, 16, 20]

/**
 * A terabyte of drive is not a terabyte of files. Manufacturers count in powers
 * of ten and the filesystem counts in powers of two, and ZFS keeps some back
 * for itself. This is the number people actually end up with.
 */
const USABLE_FRACTION = 0.91

/** Rough, and labelled as rough. Enough to turn "12TB" into a decision. */
const EQUIVALENTS = [
  { unit: "photographs from a phone", perTb: 200_000 },
  { unit: "raw photographs from a camera", perTb: 25_000 },
  { unit: "hours of 4K home video", perTb: 25 },
  { unit: "films at Blu-ray quality", perTb: 40 },
]

/**
 * "4.4 million", not "4,368k". These figures exist to be understood at a
 * glance, and a number nobody can read at a glance is doing the opposite of
 * what this control is for — so they are rounded to the precision they deserve.
 */
const humanCount = (value: number): string => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value < 10_000_000 ? 1 : 0)} million`
  }
  if (value >= 10_000) {
    return `${Math.round(value / 1_000)},000`
  }
  return Math.round(value).toLocaleString("en-IN")
}

const RaidCalculator = () => {
  const [driveCount, setDriveCount] = useState(4)
  const [driveSize, setDriveSize] = useState(8)
  const [layoutId, setLayoutId] = useState("raidz1")

  const layout = LAYOUTS.find((l) => l.id === layoutId) ?? LAYOUTS[2]

  const { rawTb, usableTb, valid } = useMemo(() => {
    const raw = driveCount * driveSize
    const dataDrives = Math.max(driveCount - layout.parity, 0)

    // A mirror is not "n minus one" — it is half, however many drives there
    // are. Treating it as parity would overstate a six-drive mirror by 2 drives.
    const data =
      layout.id === "mirror" ? Math.floor(driveCount / 2) : dataDrives

    return {
      rawTb: raw,
      usableTb: data * driveSize * USABLE_FRACTION,
      valid: driveCount >= layout.minDrives,
    }
  }, [driveCount, driveSize, layout])

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-line p-5 sm:p-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="How many drives" value={`${driveCount}`}>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={driveCount}
            onChange={(e) => setDriveCount(Number(e.target.value))}
            aria-label="Number of drives"
            className="w-full accent-accent"
          />
          <div className="mt-1 flex justify-between font-mono text-2xs tabular text-muted">
            <span>1</span>
            <span>8</span>
          </div>
        </Field>

        <Field label="Size of each" value={`${driveSize} TB`}>
          <div className="flex flex-wrap gap-1.5">
            {DRIVE_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setDriveSize(size)}
                aria-pressed={size === driveSize}
                className={cn(
                  "pressable rounded border px-2.5 py-1.5 font-mono text-2xs tabular",
                  size === driveSize
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-paper text-ink hover:border-line-strong active:bg-surface"
                )}
              >
                {size}TB
              </button>
            ))}
          </div>
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2.5 text-sm font-medium text-ink">
          How to arrange them
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {LAYOUTS.map((option) => {
            const possible = driveCount >= option.minDrives
            const active = option.id === layoutId

            return (
              <label
                key={option.id}
                className={cn(
                  "pressable flex cursor-pointer flex-col gap-1 rounded-lg border p-3",
                  active
                    ? "border-accent bg-accent-wash"
                    : "border-line hover:border-line-strong",
                  !possible && "opacity-50"
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-ink">
                    {option.name}
                  </span>
                  <span className="font-mono text-2xs tabular text-muted">
                    survives {option.survives.toLowerCase()}
                  </span>
                </span>
                <span className="text-xs leading-5 text-muted">
                  {possible
                    ? option.note
                    : `Needs at least ${option.minDrives} drives.`}
                </span>
                <input
                  type="radio"
                  name="raid-layout"
                  className="sr-only"
                  checked={active}
                  onChange={() => setLayoutId(option.id)}
                />
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
        <Readout label="Drives you buy" value={`${rawTb} TB`} muted />
        <Readout
          label="Space you get"
          value={valid ? `${usableTb.toFixed(1)} TB` : "—"}
        />
        <Readout label="Can lose" value={valid ? layout.survives : "—"} muted />
      </div>

      {!valid ? (
        <p className="text-sm text-muted">
          {layout.name} needs at least {layout.minDrives} drives. Add more, or
          pick a different arrangement.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">
            {usableTb.toFixed(1)} TB holds roughly:
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-1.5">
            {EQUIVALENTS.map((eq) => (
              <li key={eq.unit} className="text-sm text-muted">
                <span className="font-mono tabular text-ink">
                  {humanCount(usableTb * eq.perTb)}
                </span>{" "}
                {eq.unit}
              </li>
            ))}
          </ul>
          <p className="text-2xs leading-5 text-muted">
            Approximate. The usable figure already allows for the difference
            between how drives are sold and how filesystems count, and for what
            ZFS keeps back. Leave 20% free for the array to stay quick.
          </p>
        </div>
      )}
    </div>
  )
}

const Field = ({
  label,
  value,
  children,
}: {
  label: string
  value: string
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm font-medium text-ink">{label}</span>
      <span className="font-mono text-sm tabular text-muted">{value}</span>
    </div>
    {children}
  </div>
)

const Readout = ({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) => (
  <div className="flex flex-col gap-1 bg-paper p-4">
    <span className="text-xs text-muted">{label}</span>
    <span
      className={cn(
        "font-mono text-2xl font-medium tabular",
        muted ? "text-muted" : "text-ink"
      )}
    >
      {value}
    </span>
  </div>
)

export default RaidCalculator
