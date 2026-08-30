import type { AppScreen, ScreenRow } from "@lib/data/app-screens"
import type { SelfHostedApp } from "@lib/data/self-hosted-apps"
import { cn } from "@lib/util/cn"
import { AppIcon } from "@modules/common/components/app-icon"
import Image from "next/image"

/**
 * One application, drawn as the screen it actually is.
 *
 * Everything here is inert markup. The panel it sits in is hidden with
 * `display: none` until its tab is selected, and a browser restarts CSS
 * animations when an element goes from `none` to visible — so the entry
 * stagger below needs no JavaScript, no key, and no observer. Selecting a tab
 * plays it; selecting away resets it.
 *
 * The application's own colour is allowed inside this frame and nowhere near
 * the type. It fills picture cells, draws bars, marks a live state and carries
 * the mark itself. It is never a text colour, because `brand` is tuned to clear
 * 3:1 as a shape and several of the twenty-eight would fail 4.5:1 as a word.
 */

/** Entry stagger, in ms per element. Short enough to read as one movement. */
const STEP = 26

/*
 * The picture sets, committed under `public/apps`. Thirty photographs, ten
 * two-by-three crops and six camera views, indexed with a stride so that two
 * panels drawing from the same set do not open on the same three pictures.
 */
const PHOTOS = 30
const POSTERS = 10
const CAMERAS = 6

const photo = (i: number) =>
  `/apps/photos/${String((i % PHOTOS) + 1).padStart(2, "0")}.webp`
const poster = (i: number) =>
  `/apps/posters/${String((i % POSTERS) + 1).padStart(2, "0")}.webp`
const camera = (i: number) =>
  `/apps/cameras/${String((i % CAMERAS) + 1).padStart(2, "0")}.webp`

const step = (i: number) => ({ animationDelay: `${i * STEP}ms` })

/**
 * A picture cell. There are no photographs to ship and faking one would be a
 * lie about a product that has not been built yet, so a cell is a two-stop
 * wash of the application's own colour: unmistakably a drawing, dense enough at
 * eighteen cells to read as a library rather than as a placeholder.
 *
 * `color-mix` fails to parse on a browser that lacks it, which drops the
 * gradient and leaves the precomputed `wash` behind it. Nothing else is needed.
 */
const scatter = (i: number, salt: number) => {
  const v = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453
  return v - Math.floor(v)
}

const cellPaint = (i: number) =>
  /*
   * Scatter, not a modulus. The first attempt stepped the tint by `i * 37 % 34`,
   * which is very nearly periodic at twelve columns: every cell sat within two
   * points of the one directly above it, and thirty-six cells painted twelve
   * flat stripes. A hash gives neighbours that actually differ.
   *
   * Whole percentages only: the mix itself happens in the stylesheet, and a
   * fractional one would serialise differently on the two sides of hydration.
   */
  ({
    "--app-c1": `${Math.round(6 + scatter(i, 1) * 58)}%`,
    "--app-c2": `${Math.round(4 + scatter(i, 2) * 46)}%`,
  } as React.CSSProperties)

const DOT: Record<NonNullable<ScreenRow["state"]>, string> = {
  on: "bg-signal",
  warn: "bg-warn",
  off: "bg-line-strong",
}

const Rows = ({
  rows,
  head,
}: {
  rows: ScreenRow[]
  head?: [string, string]
}) => (
  <div className="flex h-full flex-col">
    {head && (
      <div className="flex animate-screen-in items-baseline justify-between border-b border-line pb-2 font-mono text-2xs uppercase tracking-[0.12em] text-muted">
        <span>{head[0]}</span>
        <span>{head[1]}</span>
      </div>
    )}
    {rows.map((row, i) => (
      <div
        key={row.label}
        style={step(i + 1)}
        className="flex min-h-[3.25rem] flex-1 animate-screen-in items-center gap-4 border-b border-line py-3 last:border-b-0"
      >
        {row.done !== undefined ? (
          <span
            aria-hidden
            className={cn(
              "grid h-4 w-4 shrink-0 place-items-center rounded-sm border",
              row.done ? "app-fill border-transparent" : "border-line-strong"
            )}
          >
            {row.done && (
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-paper">
                <path
                  d="M2.5 6.2 4.8 8.5 9.5 3.8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="square"
                />
              </svg>
            )}
          </span>
        ) : (
          <span
            aria-hidden
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              row.state ? DOT[row.state] : "app-fill"
            )}
          />
        )}

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-base font-medium text-ink",
              row.done && "text-muted line-through decoration-line-strong"
            )}
          >
            {row.label}
          </p>
          {row.meta && (
            <p className="mt-0.5 truncate text-xs text-muted">{row.meta}</p>
          )}
          {row.progress !== undefined && (
            <span
              aria-hidden
              className="mt-2 block h-[3px] w-full max-w-[220px] bg-surface-strong"
            >
              <span
                className="app-fill block h-full origin-left animate-screen-grow"
                style={{
                  width: `${Math.round(row.progress * 100)}%`,
                  animationDelay: `${(i + 2) * STEP}ms`,
                }}
              />
            </span>
          )}
        </div>

        {row.value && (
          <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
            {row.value}
          </span>
        )}
      </div>
    ))}
  </div>
)

/**
 * Real photographs, at the size a library shows them.
 *
 * These live in `public/apps/photos` and they are the point. Two earlier
 * versions of this panel drew the photo library as a grid of tinted rectangles,
 * on the reasoning that inventing a screenshot would be dishonest — which
 * confused two different things. Fabricating a *screenshot of a Valy machine*
 * would be a claim about a product. Showing photographs inside a picture of a
 * photo library is showing what a photo library is for. The first is a lie and
 * the second is the illustration.
 *
 * They are stand-ins, and they are meant to be replaced by photographs from a
 * real bench machine. Until then they are at least photographs.
 */
const Photos = ({
  body,
}: {
  body: Extract<AppScreen["body"], { kind: "photos" }>
}) => (
  <div className="flex h-full flex-col gap-3">
    <div className="flex animate-screen-in items-baseline justify-between border-b border-line pb-2 font-mono text-2xs uppercase tracking-[0.12em] text-muted">
      <span>{body.album}</span>
      <span>{body.count_label}</span>
    </div>

    <div className="grid min-h-0 flex-1 grid-cols-8 gap-1.5 overflow-hidden">
      {Array.from({ length: body.count }).map((_, i) => (
        <div
          key={i}
          style={step(i)}
          className="relative animate-screen-in overflow-hidden rounded-sm bg-surface"
        >
          <Image
            src={photo(i)}
            alt=""
            fill
            sizes="(max-width: 640px) 22vw, (max-width: 1024px) 15vw, 9vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  </div>
)

/**
 * Cover art, with the thing it belongs to named under it.
 *
 * The covers are photographs cropped to two-by-three rather than real film or
 * book jackets, which belong to other people. What matters is that a media
 * library reads as a shelf of pictures and not as a table of filenames.
 */
const Covers = ({
  body,
}: {
  body: Extract<AppScreen["body"], { kind: "covers" }>
}) => (
  <div className="flex h-full flex-col gap-4">
    {body.playing && (
      <p className="animate-screen-in font-mono text-2xs uppercase tracking-[0.12em] text-muted">
        {body.playing}
      </p>
    )}

    <div className="grid min-h-0 flex-1 grid-cols-5 gap-4">
      {body.items.map((item, i) => (
        <figure
          key={item.title}
          style={step(i)}
          className="flex animate-screen-in flex-col gap-2"
        >
          <div className="relative min-h-0 flex-1 overflow-hidden rounded bg-surface">
            <Image
              src={poster(i)}
              alt=""
              fill
              sizes="(max-width: 640px) 30vw, 18vw"
              className="object-cover"
            />
            {item.progress !== undefined && (
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-[3px] bg-ink/25"
              >
                <span
                  className="app-fill block h-full origin-left animate-screen-grow"
                  style={{
                    width: `${Math.round(item.progress * 100)}%`,
                    animationDelay: `${(i + 2) * STEP}ms`,
                  }}
                />
              </span>
            )}
          </div>
          <figcaption className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink">
              {item.title}
            </span>
            <span className="block truncate text-xs text-muted">
              {item.meta}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  </div>
)

/** What the cameras at a house are actually pointed at. */
const Cameras = ({
  body,
}: {
  body: Extract<AppScreen["body"], { kind: "cameras" }>
}) => (
  <div className="grid h-full grid-cols-3 grid-rows-2 gap-4">
    {body.tags.map((tag, i) => (
      <figure
        key={tag}
        style={step(i)}
        className="flex min-h-0 animate-screen-in flex-col"
      >
        <div className="relative min-h-0 flex-1 overflow-hidden rounded bg-surface">
          <Image
            src={camera(i)}
            alt=""
            fill
            sizes="(max-width: 640px) 46vw, 22vw"
            className="object-cover saturate-[0.7]"
          />
          {body.detect && i === 0 && (
            <span
              aria-hidden
              className="absolute left-[32%] top-[18%] h-[58%] w-[24%] animate-screen-in rounded-[2px] border-2 border-accent"
              style={{ animationDelay: "420ms" }}
            >
              <span className="absolute -top-[17px] left-0 bg-accent px-1 font-mono text-[9px] leading-[16px] tracking-wide text-paper">
                person
              </span>
            </span>
          )}
        </div>
        <figcaption className="mt-2 truncate font-mono text-2xs tracking-wide text-muted">
          {tag}
        </figcaption>
      </figure>
    ))}
  </div>
)

/**
 * A room, and what the house knows about it.
 *
 * Home Assistant on its own is a board of numbers, and a board of numbers is
 * what the last version of this panel showed. The numbers only mean anything
 * against the place they describe, so the place is the panel and the numbers
 * sit on it.
 */
const Room = ({
  body,
}: {
  body: Extract<AppScreen["body"], { kind: "room" }>
}) => (
  <div className="relative h-full min-h-[18rem] animate-screen-in overflow-hidden rounded-lg bg-surface">
    <Image
      src={photo(body.photo)}
      alt=""
      fill
      sizes="(max-width: 1024px) 92vw, 46vw"
      className="object-cover"
    />
    {/* Enough scrim to hold white type, not enough to hide the room. */}
    <div
      aria-hidden
      className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-ink/10"
    />

    <ul className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-3 p-5">
      {body.chips.map((chip, i) => (
        <li
          key={chip.label}
          style={step(i + 1)}
          className="animate-screen-in rounded-md border border-white/15 bg-black/35 px-3 py-2 backdrop-blur-md"
        >
          <p className="font-mono text-2xs uppercase tracking-[0.12em] text-white/65">
            {chip.label}
          </p>
          <p className="mt-0.5 flex items-center gap-2 truncate text-base font-medium tabular-nums text-white">
            {chip.on && (
              <span
                aria-hidden
                className="app-fill h-1.5 w-1.5 shrink-0 rounded-full"
              />
            )}
            {chip.value}
          </p>
        </li>
      ))}
    </ul>
  </div>
)

const Meter = ({
  body,
}: {
  body: Extract<AppScreen["body"], { kind: "meter" }>
}) => (
  <div className="flex h-full flex-col gap-6">
    <div>
      <p className="flex animate-screen-in flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-5xl font-semibold tabular-nums tracking-tight text-ink">
          {body.value}
        </span>
        <span className="text-sm text-muted">{body.unit}</span>
      </p>
      <p
        style={step(1)}
        className="mt-2 max-w-prose animate-screen-in text-sm leading-6 text-muted"
      >
        {body.caption}
      </p>
    </div>

    {/*
     * The history under the figure. Bars grow from the baseline on a scale
     * transform, which is one composited property and stays smooth at thirty
     * bars on a phone.
     */}
    <div aria-hidden className="flex h-32 min-h-0 flex-1 items-end gap-[3px]">
      {body.bars.map((v, i) => (
        <span
          key={i}
          className="app-fill h-full flex-1 origin-bottom animate-screen-rise"
          style={
            {
              "--h": Math.max(v, 0.04).toFixed(2),
              opacity: (0.28 + v * 0.72).toFixed(2),
              animationDelay: `${120 + i * 14}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>

    <dl
      className="grid animate-screen-in grid-cols-3 gap-4 border-t border-line pt-4"
      style={step(2)}
    >
      {body.foot.map(([label, value]) => (
        <div key={label}>
          <dt className="font-mono text-2xs uppercase tracking-[0.12em] text-muted">
            {label}
          </dt>
          <dd className="mt-1 text-sm font-medium tabular-nums text-ink">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  </div>
)

const Tiles = ({
  body,
}: {
  body: Extract<AppScreen["body"], { kind: "tiles" }>
}) => (
  <div className="grid h-full grid-cols-3 grid-rows-2 gap-px overflow-hidden rounded border border-line bg-line">
    {body.tiles.map((tile, i) => (
      <div
        key={tile.label}
        style={step(i)}
        className={cn(
          "relative flex animate-screen-in flex-col justify-between gap-6 p-5",
          tile.on ? "app-tile-on" : "bg-paper"
        )}
      >
        <p className="font-mono text-2xs uppercase tracking-[0.12em] text-muted">
          {tile.label}
        </p>
        <p
          className={cn(
            "truncate text-2xl font-medium tabular-nums tracking-tight",
            tile.on ? "text-ink" : "text-muted"
          )}
        >
          {tile.value}
        </p>
        {tile.on && (
          <span
            aria-hidden
            className="app-fill absolute right-4 top-4 h-1.5 w-1.5 rounded-full"
          />
        )}
      </div>
    ))}
  </div>
)

/**
 * The connection diagram, for the two applications whose whole subject is what
 * is joined to what.
 *
 * The lines draw themselves once, on entry, and then stop. Nothing on this site
 * loops except a pending indicator, and a packet animation running forever
 * behind a paragraph is decoration wearing a diagram's clothes.
 */
const Graph = ({
  app,
  body,
}: {
  app: SelfHostedApp
  body: Extract<AppScreen["body"], { kind: "graph" }>
}) => {
  const left =
    body.layout === "hub" ? body.nodes.slice(0, 2) : body.nodes.slice(0, 1)
  const right =
    body.layout === "hub" ? body.nodes.slice(2) : body.nodes.slice(1)

  const W = 880
  const H = 330
  const hubX = W / 2
  const hubY = H / 2

  const yFor = (n: number, i: number) =>
    n === 1 ? hubY : H * 0.22 + (i * (H * 0.56)) / Math.max(n - 1, 1)

  const box = (
    label: string,
    meta: string,
    x: number,
    y: number,
    anchor: "start" | "end",
    i: number
  ) => (
    <g key={label} className="animate-screen-in" style={step(3 + i)}>
      <rect
        x={anchor === "start" ? x : x - 152}
        y={y - 24}
        width={152}
        height={48}
        rx={6}
        className="fill-paper stroke-line-strong"
        strokeWidth={1}
      />
      <text
        x={anchor === "start" ? x + 14 : x - 138}
        y={y - 3}
        className="fill-ink text-[13px] font-medium"
      >
        {label}
      </text>
      <text
        x={anchor === "start" ? x + 14 : x - 138}
        y={y + 14}
        className="fill-muted text-[11px]"
      >
        {meta}
      </text>
    </g>
  )

  const link = (x1: number, y1: number, x2: number, y2: number, i: number) => (
    <path
      key={`${x1}-${y1}-${i}`}
      d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${
        (x1 + x2) / 2
      } ${y2}, ${x2} ${y2}`}
      fill="none"
      stroke={app.brand}
      strokeWidth={1.5}
      pathLength={1}
      strokeDasharray={1}
      className="animate-screen-draw"
      style={{ animationDelay: `${180 + i * 90}ms` }}
    />
  )

  return (
    <div className="flex h-full items-center">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-full max-h-[22rem] w-full"
        role="img"
        aria-label={`${body.hub} connected to ${body.nodes
          .map((n) => n.label)
          .join(", ")}`}
      >
        {left.map((_, i) =>
          link(158, yFor(left.length, i), hubX - 86, hubY, i)
        )}
        {right.map((_, i) =>
          link(hubX + 86, hubY, W - 158, yFor(right.length, i), left.length + i)
        )}

        {left.map((n, i) =>
          box(n.label, n.meta, 6, yFor(left.length, i), "start", i)
        )}
        {right.map((n, i) =>
          box(
            n.label,
            n.meta,
            W - 6,
            yFor(right.length, i),
            "end",
            left.length + i
          )
        )}

        <g className="animate-screen-in" style={step(1)}>
          <rect
            x={hubX - 86}
            y={hubY - 26}
            width={172}
            height={52}
            rx={6}
            fill={app.brand}
          />
          <text
            x={hubX}
            y={hubY + 5}
            textAnchor="middle"
            className="fill-paper text-[13px] font-semibold"
          >
            {body.hub.length > 22 ? body.hub.split(",")[0] : body.hub}
          </text>
        </g>
      </svg>
    </div>
  )
}

/**
 * Something playing, and what is behind it.
 *
 * A shelf of blank posters was the first attempt and it was the one screen here
 * that read as a loading state rather than as software: five soft rectangles
 * standing in for content, which is the failure this whole section exists to
 * undo. A player says what a media server does — this film, at this quality,
 * on that television, without a transcode — and the poster is one supporting
 * shape rather than five empty ones.
 */
const Player = ({
  body,
}: {
  body: Extract<AppScreen["body"], { kind: "player" }>
}) => (
  <div className="flex h-full flex-col justify-between gap-6">
    <div className="flex animate-screen-in gap-7">
      <div
        style={cellPaint(3)}
        className="app-cell block aspect-[2/3] w-36 shrink-0 rounded"
      />
      <div className="flex min-w-0 flex-col gap-3">
        <p className="font-mono text-2xs uppercase tracking-[0.12em] text-muted">
          Now playing · {body.where}
        </p>
        <p className="text-3xl font-semibold tracking-tight text-ink">
          {body.title}
        </p>
        <ul className="flex flex-wrap gap-2">
          {body.chips.map((chip) => (
            <li
              key={chip}
              className="rounded border border-line bg-surface px-2 py-1 font-mono text-2xs tracking-wide text-muted"
            >
              {chip}
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div style={step(2)} className="animate-screen-in">
      <span aria-hidden className="block h-[3px] w-full bg-surface-strong">
        <span
          className="app-fill block h-full origin-left animate-screen-grow"
          style={{
            width: `${Math.round(body.progress * 100)}%`,
            animationDelay: "180ms",
          }}
        />
      </span>
      <p className="mt-2 flex justify-between font-mono text-2xs tabular-nums text-muted">
        <span>{body.elapsed}</span>
        <span>{body.total}</span>
      </p>
    </div>

    <div>
      <p className="font-mono text-2xs uppercase tracking-[0.12em] text-muted">
        Up next
      </p>
      <ul className="mt-3 grid grid-cols-4 gap-5">
        {body.queue.map((item, i) => (
          <li
            key={item.title}
            style={step(3 + i)}
            className="flex animate-screen-in items-center gap-3"
          >
            <span
              style={cellPaint(i + 11)}
              className="app-cell h-16 w-11 shrink-0 rounded-sm"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink">
                {item.title}
              </span>
              <span className="block truncate text-xs text-muted">
                {item.meta}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  </div>
)

const Chat = ({
  app,
  body,
}: {
  app: SelfHostedApp
  body: Extract<AppScreen["body"], { kind: "chat" }>
}) => (
  <div className="mx-auto flex h-full w-full max-w-3xl flex-col justify-center gap-4">
    {body.turns.map((turn, i) => (
      <div
        key={turn.text}
        style={step(i)}
        className={cn(
          "flex animate-screen-in gap-3",
          turn.you ? "justify-end" : "items-start"
        )}
      >
        {!turn.you && <AppIcon app={app} className="mt-1 h-5 w-5" />}
        <p
          className={cn(
            "max-w-[38ch] rounded-lg px-4 py-3 text-sm leading-6",
            turn.you
              ? "bg-surface-strong text-ink"
              : "border border-line bg-paper text-ink"
          )}
        >
          {turn.text}
        </p>
      </div>
    ))}
  </div>
)

const Body = ({ app, screen }: { app: SelfHostedApp; screen: AppScreen }) => {
  const body = screen.body
  switch (body.kind) {
    case "photos":
      return <Photos body={body} />
    case "covers":
      return <Covers body={body} />
    case "cameras":
      return <Cameras body={body} />
    case "room":
      return <Room body={body} />
    case "rows":
      return <Rows rows={body.rows} head={body.head} />
    case "meter":
      return <Meter body={body} />
    case "tiles":
      return <Tiles body={body} />
    case "player":
      return <Player body={body} />
    case "graph":
      return <Graph app={app} body={body} />
    case "chat":
      return <Chat app={app} body={body} />
  }
}

export const AppScreenView = ({
  app,
  screen,
}: {
  app: SelfHostedApp
  screen: AppScreen
}) => (
  <div
    style={
      {
        "--app-brand": app.brand,
        "--app-wash": app.wash,
      } as React.CSSProperties
    }
    className="flex h-full min-h-0 flex-col"
  >
    {/*
     * The application's own title bar: what it is, what it stands in for, and
     * the address it answers on inside your house. The address is the quietest
     * argument on the page — `photos.home` is not a URL anyone else can reach.
     */}
    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-7 py-5">
      <div className="flex min-w-0 items-center gap-3">
        <AppIcon app={app} className="h-8 w-8 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold tracking-tight text-ink">
            {app.name}
          </p>
          <p className="truncate text-sm text-muted">{app.line}</p>
        </div>
      </div>
      <span className="inline-block shrink-0 rounded border border-line bg-surface px-2 py-1 font-mono text-2xs tracking-wide text-muted">
        {screen.host}
      </span>
    </div>

    <div className="min-h-0 flex-1 overflow-hidden px-7 py-6">
      <Body app={app} screen={screen} />
    </div>

    <p className="shrink-0 border-t border-line px-7 py-3.5 text-sm leading-5 text-muted">
      {screen.strip}
    </p>
  </div>
)
