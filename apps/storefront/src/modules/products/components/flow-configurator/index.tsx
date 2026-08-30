"use client"

import { addFlowBuildToCart } from "@lib/data/cart-actions"
import {
  bayCount,
  BuildLine,
  buildLines,
  buildSummary,
  buildTotal,
  CAPACITY_FOOTNOTE,
  drivesLabel,
  FLOW_STAGES,
  FlowProducts,
  FlowSelection,
  FlowStage,
  FlowStageId,
  INITIAL_SELECTION,
  isComplete,
  poolLayouts,
  priceOf,
  setupAvailable,
  totalTb,
  usableTb,
} from "@lib/data/flow-config"
import { SETUP_APPS } from "@lib/data/flow-setup-apps"
import { setHeaderStatus } from "@modules/layout/components/header-status"
import { cn } from "@lib/util/cn"
import { convertToLocale } from "@lib/util/money"
import { useOptimisticCart } from "@modules/cart/context/optimistic-cart"
import { AppIcon, AppIconSprite } from "@modules/common/components/app-icon"
import { Button } from "@modules/common/components/ui"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Choice, ChoiceGroup } from "./choice"

/**
 * The Valy Flow configurator.
 *
 * Structurally this is Apple's buy page: a picture that stays put on the left,
 * a narrow column of decisions on the right, a running price pinned under the
 * navigation, and the picture and its caption changing as the reader moves from
 * one decision to the next. The reasons it is worth copying are that the price
 * is never off screen, the reader never loses their place, and each decision is
 * a full-width row that has room for the sentence explaining it.
 *
 * Two things are ours rather than Apple's.
 *
 * The sections are named after functions. "Media transcoding", not "Graphics".
 * A homelab buyer is choosing an outcome and only incidentally a part, and the
 * part number is still there, one line down, for the reader who wants it.
 *
 * And the storage section reasons rather than lists. Drive count, bay count and
 * pool layout are one interlocking decision — a third drive only exists on the
 * i5, mirroring only means anything on identical drives, and what a pool leaves
 * you is arithmetic the buyer should not be doing in their head — so the
 * section computes it and shows its working.
 */

type FlowConfiguratorProps = {
  products: FlowProducts
  currencyCode: string
}

/* -------------------------------------------------------------------------- */
/*  Price formatting                                                           */
/* -------------------------------------------------------------------------- */

/*
 * Deliberately the site's own formatter with no options. Indian digit grouping
 * — 1,61,999 rather than 161,999 — would be the better format for a store that
 * only sells in one country, but it belongs in `convertToLocale` where the cart
 * and the order confirmation would pick it up too. Setting it here alone put
 * two different renderings of the same number on the configurator and the
 * checkout summary the buyer lands on from it.
 */
const money = (amount: number, currency_code: string) =>
  convertToLocale({ amount, currency_code })

/** What a row says on its right edge. Free options say so in words. */
const delta = (amount: number, currency_code: string) =>
  amount === 0 ? "Included" : `+ ${money(amount, currency_code)}`

const tb = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)}TB`

/* -------------------------------------------------------------------------- */

export default function FlowConfigurator({
  products,
  currencyCode,
}: FlowConfiguratorProps) {
  const router = useRouter()
  const countryCode = useParams().countryCode as string
  const { addOptimistic, isPending } = useOptimisticCart()

  const [selection, setSelection] = useState<FlowSelection>(INITIAL_SELECTION)
  const [activeStage, setActiveStage] = useState<FlowStageId>("kit")
  const [error, setError] = useState<string | null>(null)
  const [barReady, setBarReady] = useState(false)

  const set = useCallback(
    <K extends keyof FlowSelection>(key: K, value: FlowSelection[K]) =>
      setSelection((prev) => ({ ...prev, [key]: value })),
    []
  )

  /* ---- what the chosen kit allows -------------------------------------- */

  const kitVariant = products["valy-flow"]?.variants?.find(
    (v) => v.title === selection.kit
  )
  const bays = bayCount(kitVariant)

  /*
   * Dropping from the i5 to the i3 removes a bay that may currently hold a
   * drive, and a pool layout that only exists at three. Clamping here rather
   * than in the click handler means the invariant holds however the selection
   * was reached — including a future deep link that restores a saved build.
   */
  useEffect(() => {
    setSelection((prev) => {
      if (prev.driveCount <= bays) {
        return prev
      }
      const driveCount = bays
      const layouts = poolLayouts(driveCount)
      return {
        ...prev,
        driveCount,
        pool: layouts.some((l) => l.id === prev.pool)
          ? prev.pool
          : layouts.find((l) => l.recommended)?.id ?? layouts[0]?.id ?? null,
      }
    })
  }, [bays])

  /* ---- the build -------------------------------------------------------- */

  const lines = useMemo(
    () => buildLines(selection, products),
    [selection, products]
  )
  const total = useMemo(() => buildTotal(lines), [lines])
  const complete = isComplete(selection)

  /* ---- which stage the reader is on ------------------------------------- */

  const stageRefs = useRef<Partial<Record<FlowStageId, HTMLElement | null>>>({})

  useEffect(() => {
    const nodes = Object.entries(stageRefs.current).filter(([, el]) => el) as [
      FlowStageId,
      HTMLElement
    ][]

    if (!nodes.length || typeof IntersectionObserver === "undefined") {
      return
    }

    /*
     * The band is the upper third of the viewport, under the sticky header. A
     * section becomes "the one being read" when its heading reaches that band,
     * which is what makes the picture change at the moment the reader arrives
     * rather than a screen early or a screen late.
     */
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible[0]) {
          const id = visible[0].target.getAttribute("data-stage")
          if (id) {
            setActiveStage(id as FlowStageId)
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    )

    nodes.forEach(([, el]) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  /*
   * The phone's price bar is fixed to the bottom of the viewport, so on a
   * phone it covers the foot of whatever is on screen. Showing it from the
   * first paint put it over the first stage's options — a reader who never
   * scrolled saw a checkout button and no evidence there was anything to
   * choose. It arrives once the last stage has been reached, by which point
   * every decision has been seen and a running total is what the reader wants
   * kept in front of them.
   *
   * Without `IntersectionObserver` it shows immediately: a phone with no way
   * to check out is a worse failure than a bar arriving early.
   */
  useEffect(() => {
    const last = FLOW_STAGES[FLOW_STAGES.length - 1]
    const node = last ? stageRefs.current[last.id] : null

    if (!node || typeof IntersectionObserver === "undefined") {
      setBarReady(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setBarReady(true)
          observer.disconnect()
        }
      },
      { threshold: 0 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  /* ---- add to cart ------------------------------------------------------ */

  const onContinue = () => {
    if (!complete || isPending) {
      return
    }
    setError(null)

    // One, not `lines.length`: the badge counts a build as a single thing, so
    // an optimistic seven would jump and then settle back to one.
    addOptimistic(1, async () => {
      try {
        await addFlowBuildToCart({
          lines: lines.map(({ variantId, quantity, role, label }) => ({
            variantId,
            quantity,
            role,
            label,
          })),
          summary: buildSummary(selection, drivesLabel(selection)),
          countryCode,
        })
        router.push(`/${countryCode}/checkout?step=address`)
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "That configuration could not be added. Try again."
        )
      }
    })
  }

  /* ---- the header ------------------------------------------------------- */

  const summary = buildSummary(selection, drivesLabel(selection))

  /*
   * On a phone this page takes the header over: the wordmark becomes the
   * machine and the cart's slot becomes the specification. Everything the
   * reader needs while deciding is then in one row they cannot scroll away
   * from, and the page does not have to stack a second bar under a first one
   * that was saying nothing they needed.
   *
   * Cleared on unmount, or the next route inherits a title for a machine it
   * knows nothing about.
   */
  useEffect(() => {
    setHeaderStatus({ title: "Valy Flow", detail: summary })
    return () => setHeaderStatus(null)
  }, [summary])

  /* ---- media ------------------------------------------------------------ */

  const stage = FLOW_STAGES.find((s) => s.id === activeStage) ?? FLOW_STAGES[0]

  /*
   * Every stage's picture is rendered at once and cross-faded, rather than one
   * `<Image>` whose `src` changes. Swapping the source remounts the element and
   * leaves an empty grey frame for as long as the new file takes to arrive,
   * which on the very interaction this layout exists for — scrolling from one
   * decision to the next — is the most visible thing on the page.
   */
  const frames = FLOW_STAGES.map((s) => ({
    id: s.id,
    src: products[s.handle]?.thumbnail ?? null,
    fit: s.fit ?? "cover",
  })).filter((f) => f.src)

  return (
    <div className="border-t border-line">
      <AppIconSprite apps={SETUP_APPS} />

      {/* The wide layout's own row. On a phone this lives in the header. */}
      <SummaryBar total={total} currencyCode={currencyCode} summary={summary} />

      <div className="container-page">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-x-12 xl:gap-x-16">
          {/*
           * The picture. Sticky on a wide screen and hidden on a phone: a
           * 4:3 image repeated above every one of seven sections is a lot of
           * scrolling for decoration, so on mobile the caption survives inside
           * each section heading and the picture does not.
           */}
          <div className="hidden lg:block">
            <div className="sticky top-32 py-12">
              <figure className="overflow-hidden rounded-lg bg-surface">
                <div className="relative aspect-[4/3]">
                  {frames.map((frame, i) => (
                    <Image
                      key={frame.id}
                      src={frame.src!}
                      alt=""
                      aria-hidden
                      fill
                      priority={i === 0}
                      sizes="(max-width: 1024px) 0px, 60vw"
                      className={cn(
                        "transition-opacity duration-500 motion-reduce:transition-none",
                        frame.fit === "contain"
                          ? "object-contain p-10"
                          : "object-cover",
                        frame.id === activeStage ? "opacity-100" : "opacity-0"
                      )}
                    />
                  ))}
                </div>
              </figure>
              <p
                aria-live="polite"
                className="mt-6 max-w-[46ch] text-lg leading-8 text-muted"
              >
                {stage.caption}
              </p>
            </div>
          </div>

          {/* The decisions. */}
          <div className="py-12 lg:py-16">
            {FLOW_STAGES.map((s) => (
              <StageSection
                key={s.id}
                stage={s}
                image={products[s.handle]?.thumbnail ?? null}
                ref={(el) => {
                  stageRefs.current[s.id] = el
                }}
              >
                {s.id === "storage" ? (
                  <StorageStage
                    products={products}
                    currencyCode={currencyCode}
                    selection={selection}
                    bays={bays}
                    set={set}
                  />
                ) : s.id === "setup" ? (
                  <SetupStage
                    products={products}
                    currencyCode={currencyCode}
                    selection={selection}
                    set={set}
                  />
                ) : (
                  <VariantStage
                    stage={s}
                    products={products}
                    currencyCode={currencyCode}
                    selection={selection}
                    set={set}
                  />
                )}
              </StageSection>
            ))}

            <BuildTotal
              lines={lines}
              total={total}
              currencyCode={currencyCode}
              complete={complete}
              pending={isPending}
              error={error}
              onContinue={onContinue}
            />
          </div>
        </div>
      </div>

      {/* The phone's running price, once the last decision has been seen. */}
      {barReady && (
        <MobileBar
          total={total}
          currencyCode={currencyCode}
          complete={complete}
          pending={isPending}
          onContinue={onContinue}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  A stage                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The two-tone heading. The section's name is set in ink and the sentence
 * continuing it is muted, on one line — not a label above a title. The house
 * style has no eyebrows and this is the same rule kept under pressure: the
 * grey half is a clause, not a caption.
 */
const StageSection = ({
  stage,
  image,
  children,
  ref,
}: {
  stage: FlowStage
  /** Only rendered on a phone, where there is no sticky picture beside it. */
  image: string | null
  children: React.ReactNode
  ref: (el: HTMLElement | null) => void
}) => (
  <section
    ref={ref}
    data-stage={stage.id}
    id={`flow-${stage.id}`}
    aria-labelledby={`flow-${stage.id}-heading`}
    className="scroll-mt-32 border-t border-line pb-12 pt-10 first:border-t-0 first:pt-0"
  >
    <h2
      id={`flow-${stage.id}-heading`}
      className="text-balance text-xl font-semibold leading-8 tracking-tight"
    >
      <span className="text-ink">{stage.name}</span>{" "}
      <span className="text-muted">{stage.lede}</span>
    </h2>
    {/*
     * On a phone the picture cannot follow the reader, so it travels with the
     * section instead: a shorter crop at the top of each one, with the caption
     * that the sticky panel carries on a wide screen. Lazy, because six of the
     * seven are below the fold on any phone.
     */}
    <div className="lg:hidden">
      {image && (
        <figure className="mt-4 overflow-hidden rounded-lg bg-surface">
          <div className="relative aspect-[16/9]">
            <Image
              src={image}
              alt=""
              aria-hidden
              fill
              loading="lazy"
              sizes="(min-width: 1024px) 0px, 100vw"
              className={
                stage.fit === "contain" ? "object-contain p-6" : "object-cover"
              }
            />
          </div>
        </figure>
      )}
      <p className="mt-3 text-sm leading-6 text-muted">{stage.caption}</p>
    </div>
    <div className="mt-6">{children}</div>
  </section>
)

/* -------------------------------------------------------------------------- */
/*  Stages that are simply a variant picker                                    */
/* -------------------------------------------------------------------------- */

type StageProps = {
  products: FlowProducts
  currencyCode: string
  selection: FlowSelection
  set: <K extends keyof FlowSelection>(key: K, value: FlowSelection[K]) => void
}

/**
 * The base price is the kit's own, so its rows show the whole figure. Every
 * other stage shows what it adds to it, which is the only number a reader
 * comparing two options in the same group actually needs.
 */
const VariantStage = ({
  stage,
  products,
  currencyCode,
  selection,
  set,
}: StageProps & { stage: FlowStage }) => {
  const product = products[stage.handle]
  const variants = product?.variants ?? []

  const key = (
    {
      kit: "kit",
      memory: "memory",
      network: "network",
      transcode: "transcode",
    } as const
  )[stage.id as "kit" | "memory" | "network" | "transcode"]

  const current = stage.locked
    ? variants[0]?.title ?? null
    : (selection[key] as string) ?? null

  const choices: Choice[] = variants.map((variant) => ({
    value: variant.title ?? "",
    name: variant.title ?? "",
    note: stage.notes?.[variant.title ?? ""],
    price:
      stage.id === "kit"
        ? money(priceOf(variant), currencyCode)
        : delta(priceOf(variant), currencyCode),
  }))

  return (
    <ChoiceGroup
      label={stage.name.replace(/\.$/, "")}
      choices={choices}
      value={current}
      locked={stage.locked}
      onSelect={(value) => {
        if (!stage.locked && key) {
          set(key, value as never)
        }
      }}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*  Storage                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Capacity, then how many bays to fill, then what the pool leaves you.
 *
 * Splitting capacity from count is what keeps this legible. Offered as one
 * list it is nine rows on the i5 — "3 x 8TB", "2 x 4TB" — where every row
 * restates the same three capacities. Split, it is four short rows and then
 * three, and the constraint that every drive is the same size stops being a
 * rule the reader has to remember and becomes something the control cannot
 * express.
 */
const StorageStage = ({
  products,
  currencyCode,
  selection,
  bays,
  set,
}: StageProps & { bays: number }) => {
  const variants = products["flow-storage-drive"]?.variants ?? []

  const capacityChoices: Choice[] = [
    {
      value: "none",
      name: "Diskless",
      note: "Install your own drives later.",
      price: "Included",
    },
    ...variants.map((variant) => ({
      value: variant.title ?? "",
      name: variant.title ?? "",
      price: delta(priceOf(variant), currencyCode),
      meta: "per drive",
    })),
  ]

  const unitPrice = priceOf(
    variants.find((v) => v.title === selection.driveCapacity)
  )

  const countChoices: Choice[] = Array.from({ length: bays }, (_, i) => {
    const count = i + 1
    const layouts = poolLayouts(count)
    const best = layouts.find((l) => l.recommended) ?? layouts[0]

    return {
      value: String(count),
      name: count === 1 ? "One drive" : `${count} drives`,
      note:
        count === 1
          ? "No redundancy. A drive failure means restoring from a backup."
          : `${best.name} keeps ${tb(
              usableTb(best, selection.driveCapacity)
            )} of ${tb(totalTb(count, selection.driveCapacity))} and survives ${
              best.tolerates === 1
                ? "one drive failing"
                : `${best.tolerates} drives failing`
            }.`,
      price: delta(unitPrice * count, currencyCode),
      meta: `${tb(totalTb(count, selection.driveCapacity))} raw`,
    }
  })

  const layouts = poolLayouts(selection.driveCount)

  return (
    <div className="flex flex-col gap-8">
      <ChoiceGroup
        label="Drive capacity"
        choices={capacityChoices}
        value={selection.driveCapacity ?? "none"}
        onSelect={(value) => {
          if (value === "none") {
            set("driveCapacity", null)
            set("driveCount", 0)
            // A pool cannot be built out of nothing, and the setup service
            // exists to build one — so declining drives declines both.
            set("setup", false)
            set("pool", null)
            return
          }
          set("driveCapacity", value)
          if (selection.driveCount === 0) {
            set("driveCount", Math.min(2, bays))
          }
        }}
      />

      {selection.driveCapacity && (
        <div>
          <h3 className="text-[0.9375rem] font-semibold leading-6 text-ink">
            How many bays to fill
          </h3>
          <p className="mb-4 mt-1 text-sm leading-6 text-muted">
            {bays === 2
              ? "The i3 holds two drives."
              : "The i5 holds three, which is what makes RAIDZ1 possible."}
          </p>
          <ChoiceGroup
            label="Number of drives"
            choices={countChoices}
            value={String(selection.driveCount)}
            onSelect={(value) => {
              const count = Number(value)
              set("driveCount", count)
              const next = poolLayouts(count)
              set(
                "pool",
                next.some((l) => l.id === selection.pool)
                  ? selection.pool
                  : next.find((l) => l.recommended)?.id ?? next[0]?.id ?? null
              )
            }}
          />
        </div>
      )}

      {/*
       * The readout. It is here whether or not the setup service is bought,
       * because the arithmetic is the same either way — what changes is only
       * who runs the command. Someone building the pool themselves still has
       * to decide what to build, and this is the table they need.
       */}
      {selection.driveCount > 0 && layouts.length > 0 && (
        <PoolTable
          layouts={layouts}
          capacity={selection.driveCapacity}
          drives={selection.driveCount}
        />
      )}
    </div>
  )
}

const PoolTable = ({
  layouts,
  capacity,
  drives,
}: {
  layouts: ReturnType<typeof poolLayouts>
  capacity: string | null
  drives: number
}) => (
  /*
   * Surface, not paper.
   *
   * Every other block in this column is a decision: a row of pickers on the
   * page's own paper ground. This one is arithmetic — nothing in it can be
   * clicked, and the layout it describes is chosen further down, in the setup
   * step, and only when we are the ones building the pool. On paper it looked
   * like a table of options that had stopped responding. On surface it reads
   * as a note, and the pickers keep paper to themselves.
   */
  <div className="rounded-lg border border-line bg-surface">
    <div className="border-b border-line px-4 py-3">
      <h3 className="text-[0.9375rem] font-semibold leading-6 text-ink">
        What {drives} × {capacity} gives you
      </h3>
      <p className="mt-0.5 text-sm leading-6 text-muted">
        {tb(totalTb(drives, capacity))} of drives, laid out one of these ways.
      </p>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th scope="col" className="px-4 py-2 font-medium">
              Layout
            </th>
            <th scope="col" className="px-4 py-2 text-right font-medium">
              Usable
            </th>
            <th scope="col" className="px-4 py-2 text-right font-medium">
              Survives
            </th>
          </tr>
        </thead>
        <tbody>
          {layouts.map((layout) => (
            <tr key={layout.id} className="border-b border-line last:border-0">
              <th scope="row" className="px-4 py-2.5 font-medium text-ink">
                {layout.name}
              </th>
              <td className="whitespace-nowrap px-4 py-2.5 text-right tabular text-ink">
                {tb(usableTb(layout, capacity))}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-right tabular text-muted">
                {layout.tolerates === 0
                  ? "no failure"
                  : layout.tolerates === 1
                  ? "1 drive"
                  : `${layout.tolerates} drives`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <p className="border-t border-line px-4 py-3 text-xs leading-5 text-muted">
      {CAPACITY_FOOTNOTE}
    </p>
  </div>
)

/* -------------------------------------------------------------------------- */
/*  Setup                                                                      */
/* -------------------------------------------------------------------------- */

const SetupStage = ({ products, currencyCode, selection, set }: StageProps) => {
  const variant = products["flow-setup"]?.variants?.[0]
  const price = priceOf(variant)
  const available = setupAvailable(selection)
  const layouts = poolLayouts(selection.driveCount)

  const choices: Choice[] = [
    {
      value: "no",
      name: "No setup",
      note: "The machine arrives with TrueNAS installed and running. The pool and the applications are yours to create.",
      price: "Included",
    },
    {
      value: "yes",
      name: "Storage pool and basic apps",
      note: "The pool built the way you choose, plus shares, snapshots and eight applications configured and checked before it ships.",
      price: delta(price, currencyCode),
      disabled: !available,
      disabledReason: available
        ? undefined
        : "Needs at least one drive. There is no pool to build without one.",
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <ChoiceGroup
        label="Setup"
        choices={choices}
        value={selection.setup ? "yes" : "no"}
        onSelect={(value) => {
          const wanted = value === "yes"
          if (wanted && !available) {
            return
          }
          set("setup", wanted)
          if (wanted && !selection.pool) {
            set(
              "pool",
              layouts.find((l) => l.recommended)?.id ?? layouts[0]?.id ?? null
            )
          }
        }}
      />

      {/*
       * The eight applications, as their own marks. A list of names would be
       * eight words nobody recognises; the marks are how someone who already
       * pays for Google Photos knows this section is about them.
       *
       * Surface for the same reason the pool table has it: this is the one
       * block in the setup step that cannot be chosen. It states what the
       * service installs; the choice about whether to buy it is the pair of
       * cards above.
       *
       * The line under each name is gone. "Follows a series and fetches each
       * new episode" is fifty characters in a column that is a quarter of a
       * phone wide, so every one of the eight was cut mid-word — eight
       * truncated sentences read as damage, not as description. The name is
       * what the row is for, and the sentence is one hover or one tab away.
       *
       * The grid stays at two columns. Dropping the second line frees vertical
       * space, not horizontal, and going four across to use it only moved the
       * clipping up onto the names, which are the one thing here that has to
       * be read. With nothing left to truncate, the names carry no truncation.
       */}
      <div className="rounded-lg border border-line bg-surface p-4">
        <h3 className="text-[0.9375rem] font-semibold leading-6 text-ink">
          What gets installed
        </h3>
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          {SETUP_APPS.map((app) => (
            <li key={app.slug} className="group relative">
              {/*
               * `tabIndex` because a description nobody can reach with a
               * keyboard is a description that does not exist. Focus opens the
               * same bubble hover does, and `aria-describedby` hands the
               * sentence to a screen reader whether or not it is visible.
               */}
              <span
                tabIndex={0}
                aria-describedby={`flow-app-${app.slug}`}
                className="flex items-center gap-2.5 rounded"
              >
                <AppIcon app={app} className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium leading-5 text-ink">
                  {app.name}
                </span>
              </span>

              {/*
               * Bottom-left rather than centred: a bubble centred on a mark in
               * the first column hangs off the panel, and one in the last
               * column hangs off the page. Anchored to the left edge it always
               * opens inwards, and `w-max` with a cap keeps it to one or two
               * lines.
               */}
              <span
                role="tooltip"
                id={`flow-app-${app.slug}`}
                className="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 hidden w-max max-w-[15rem] rounded bg-ink px-2 py-1 text-xs leading-5 text-paper shadow-[0_2px_8px_rgb(21_24_28/0.25)] group-hover:block group-focus-within:block"
              >
                {app.line}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/*
       * The pool layout is a real choice only when we are the ones building
       * it. Without the service the table in the storage section has already
       * said what each layout gives; repeating it as a control would be
       * offering a decision that nothing acts on.
       */}
      {selection.setup && layouts.length > 0 && (
        <div>
          <h3 className="text-[0.9375rem] font-semibold leading-6 text-ink">
            How to lay the pool out
          </h3>
          <p className="mb-4 mt-1 text-sm leading-6 text-muted">
            {selection.driveCount === 1
              ? "One drive can only be one thing."
              : "What the pool trades capacity for."}
          </p>
          <ChoiceGroup
            label="Pool layout"
            choices={layouts.map((layout) => ({
              value: layout.id,
              name: layout.recommended
                ? `${layout.name} (recommended)`
                : layout.name,
              note: layout.note,
              price: `${tb(usableTb(layout, selection.driveCapacity))} usable`,
              meta:
                layout.tolerates === 0
                  ? "no redundancy"
                  : `survives ${layout.tolerates}`,
            }))}
            value={selection.pool}
            onSelect={(value) => set("pool", value)}
          />
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Totals                                                                     */
/* -------------------------------------------------------------------------- */

const BuildTotal = ({
  lines,
  total,
  currencyCode,
  complete,
  pending,
  error,
  onContinue,
}: {
  lines: BuildLine[]
  total: number
  currencyCode: string
  complete: boolean
  pending: boolean
  error: string | null
  onContinue: () => void
}) => (
  <section
    aria-labelledby="flow-total-heading"
    className="scroll-mt-32 border-t border-line pt-10"
  >
    <h2
      id="flow-total-heading"
      className="text-xl font-semibold leading-8 tracking-tight text-ink"
    >
      Your Flow.
    </h2>

    <dl className="mt-6 border-t border-line">
      {lines.map((line) => (
        <div
          key={`${line.role}-${line.variantId}`}
          className="flex items-baseline justify-between gap-4 border-b border-line py-2.5"
        >
          <dt className="min-w-0 text-sm leading-6 text-ink">
            {line.label}
            {line.quantity > 1 && (
              <span className="text-muted"> × {line.quantity}</span>
            )}
          </dt>
          <dd className="shrink-0 text-sm leading-6 tabular text-muted">
            {line.unitPrice === 0
              ? "Included"
              : money(line.unitPrice * line.quantity, currencyCode)}
          </dd>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-4 py-4">
        <dt className="text-base font-semibold text-ink">Total</dt>
        <dd className="text-2xl font-semibold tabular tracking-tight text-ink">
          {money(total, currencyCode)}
        </dd>
      </div>
    </dl>

    <p className="text-sm leading-6 text-muted">
      Inclusive of GST. Shipping is calculated at checkout.
    </p>

    {error && (
      <p role="alert" className="mt-4 text-sm leading-6 text-danger">
        {error}
      </p>
    )}

    {/*
     * The action variant. The homepage's "Buy your Flow" opens this journey and
     * this closes it, so the two ends of it are the same button — a reader who
     * pressed a gradient pill to arrive here presses one to leave.
     *
     * It is also the only control on the page that is not a choice. Everything
     * above it is a picker, and pickers are ink and paper; the one thing that
     * is not reversible should not look like the seventh decision.
     */}
    <Button
      variant="action"
      size="large"
      block
      className="mt-6"
      disabled={!complete}
      isLoading={pending}
      onClick={onContinue}
      data-testid="flow-continue"
    >
      Continue to checkout
    </Button>

    {!complete && (
      <p className="mt-3 text-sm leading-6 text-muted">
        Choose how the storage pool should be laid out to continue.
      </p>
    )}
  </section>
)

/* -------------------------------------------------------------------------- */
/*  The running price                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Pinned under the navigation for the whole configuration, so the figure the
 * decisions are moving is never off screen. Hidden on a phone, where the same
 * job is done by a bar at the bottom within reach of a thumb.
 */
const SummaryBar = ({
  total,
  currencyCode,
  summary,
}: {
  total: number
  currencyCode: string
  summary: string
}) => (
  <div className="sticky top-14 z-30 hidden border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80 sm:top-16 lg:block">
    <div className="container-page flex items-center justify-between gap-8 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-5 text-ink">Valy Flow</p>
        <p className="truncate text-xs leading-5 text-muted">{summary}</p>
      </div>
      <div className="shrink-0 text-right">
        <p
          aria-live="polite"
          className="text-lg font-semibold leading-6 tabular tracking-tight text-ink"
        >
          {money(total, currencyCode)}
        </p>
        <p className="text-xs leading-4 text-muted">inclusive of GST</p>
      </div>
    </div>
  </div>
)

const MobileBar = ({
  total,
  currencyCode,
  complete,
  pending,
  onContinue,
}: {
  total: number
  currencyCode: string
  complete: boolean
  pending: boolean
  onContinue: () => void
}) => (
  <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85 lg:hidden">
    <div className="container-page flex items-center justify-between gap-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="min-w-0">
        <p
          aria-live="polite"
          className="text-base font-semibold leading-5 tabular tracking-tight text-ink"
        >
          {money(total, currencyCode)}
        </p>
        <p className="text-xs leading-4 text-muted">inclusive of GST</p>
      </div>
      {/*
       * The same button as the one at the foot of the configurator, because on
       * a phone it is the same button: this bar is how the total and the
       * checkout stay on screen while the pickers scroll past.
       */}
      <Button
        variant="action"
        size="medium"
        disabled={!complete}
        isLoading={pending}
        onClick={onContinue}
      >
        Continue
      </Button>
    </div>
  </div>
)
