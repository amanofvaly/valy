import { RENTED_LIFE_ICONS } from "@lib/data/streamline-icons"

/**
 * A person who has
 * read "A home for your digital life" and nothing else does not want the terms
 * of sale. They want to be told what is wrong with how they live now, because
 * until somebody says it out loud, nothing is wrong: paying four companies
 * every month for the right to look at your own photographs is simply how
 * things are, and a machine that fixes it is a solution to a problem the
 * reader does not have.
 *
 * So this is the only chapter on the page that sells nothing. No feature, no
 * figure, no button. It names the tenancy, and every chapter under it — the
 * software, the arithmetic, the machines, the parts — is the answer to it.
 */

/**
 * The streak along the bottom edge.
 *
 * The eleven marks are the tenancy itself, in order: the photographs, the
 * films, the music, the books, the cloud they are kept in, the database behind
 * it, the subscription, the card it is charged to, the receipt, and then — at
 * the end, larger than the rest — the vault and the drive that are the way out.
 * They are the only colour in a chapter that is otherwise ink and paper, and
 * they arrive at the moment the reader is being told what is wrong.
 *
 * Every mark carries its own size, its own height, its own place along the
 * band and its own tilt, and no two share a value.
 *
 * The first version of this was a flex row with `justify-between`, which is
 * exactly the thing it should not be: eleven marks at even intervals sitting
 * on one baseline is a row, and varying only how deep each one is cut leaves
 * it a row with a ragged bottom. What breaks a row is the other axis. So the
 * marks are placed rather than flowed — `left` at irregular intervals that
 * cluster and gap, `bottom` anywhere from a quarter under the edge to two
 * thirds of the way up the band.
 *
 * `bottom` is a percentage of the field's own height, which is why the field
 * has an explicit one. Negative values push a mark under the section's bottom
 * edge to be cut off; positive values float it clear, and four of the eleven
 * are never clipped at all. That range is the point: marks at every height
 * from untouched to nearly gone read as a drift through the frame, where a
 * single depth reads as a border with pictures in it.
 *
 * `tilt` is small and never repeated — between 3 and 20 degrees, both
 * directions. Enough that no two sit square to each other, not so much that
 * any one reads as fallen over.
 *
 * `dim` is the fourth axis, and no mark is at full strength. That is not a
 * softening pass: it is what keeps the sentence the brightest thing in a band
 * where eleven saturated gradients are competing with it. The scale runs with
 * the geometry — a mark cut by the floor can hold 70 or 80% because it is
 * mostly gone anyway, while the ones that cross the type's measure sit at 25
 * to 45%, low enough to read as ground rather than as something in the way.
 * Varying it also does what varying size and height do: eleven marks at one
 * opacity would be a watermark, which is a single object.
 */
const STREAK = [
  /* photographs — a third under the edge */
  {
    at: "left-[1%] bottom-[-6%]",
    size: "size-14 sm:size-16",
    tilt: "-rotate-12",
    dim: "opacity-70",
  },
  /*
   * films — high and clear, the largest thing floating.
   *
   * The one mark that lands inside the type's measure. On a wide screen it
   * sits in the empty left margin at 55%, but a phone's paragraph runs the
   * full width and the sentence crosses straight over it, so it drops to 25%
   * for that case — the lowest value in the field.
   */
  {
    at: "left-[10%] bottom-[26%]",
    size: "size-16 sm:size-20",
    tilt: "rotate-6",
    dim: "opacity-25 sm:opacity-55",
  },
  /* music — nearly gone, tucked close to the films */
  {
    at: "left-[18%] bottom-[-10%]",
    size: "size-10 sm:size-12",
    tilt: "rotate-[14deg]",
    dim: "opacity-45",
  },
  /* books — low, barely lifted */
  {
    at: "left-[3%] bottom-[58%]",
    size: "size-14 sm:size-[4.5rem]",
    tilt: "-rotate-3",
    dim: "opacity-60",
  },
  /*
   * the cloud — the biggest mark, half of it under.
   *
   * Same problem as the films and a worse one, because this is the largest
   * thing in the field: on a phone the paragraph comes down to meet it. It
   * drops to 10% there — present as a shape in the ink and nothing more — and
   * keeps its 80% on any screen where the type has a column of its own.
   */
  {
    at: "left-[33%] bottom-[-4%]",
    size: "size-20 sm:size-24",
    tilt: "rotate-[8deg]",
    dim: "opacity-10 sm:opacity-80",
  },
  /* the database behind it — small, and the highest of all */
  {
    at: "left-[45%] bottom-[16%]",
    size: "size-10 sm:size-12",
    tilt: "-rotate-[18deg]",
    dim: "opacity-35",
  },
  /* the subscription — the deepest cut */
  {
    at: "left-[56%] bottom-[-12%]",
    size: "size-14 sm:size-[4.5rem]",
    tilt: "rotate-3",
    dim: "opacity-55",
  },
  /* the card — mid-air, after the widest gap in the field */
  {
    at: "left-[69%] bottom-[11%]",
    size: "size-12 sm:size-14",
    tilt: "-rotate-[10deg]",
    dim: "opacity-40",
  },
  /* the receipt — a sliver */
  {
    at: "left-[77%] bottom-[-8%]",
    size: "size-10 sm:size-12",
    tilt: "rotate-[20deg]",
    dim: "opacity-65",
  },
  /* the vault — sitting on the edge, whole */
  {
    at: "left-[90%] bottom-[62%]",
    size: "size-16 sm:size-20",
    tilt: "-rotate-6",
    dim: "opacity-50",
  },
  /* the drive — high, and off the right edge */
  {
    at: "left-[94%] bottom-[4%]",
    size: "size-12 sm:size-16",
    tilt: "rotate-[12deg]",
    dim: "opacity-75",
  },
]

/** The five kept on a phone: photographs, films, cloud, card, drive. */
const ON_PHONE = new Set([0, 1, 4, 7, 10])

const TheTenancy = () => (
  /*
   * `overflow-hidden` is the whole effect. The marks are pushed past the
   * section's bottom edge and the section cuts them off, so the band ends in a
   * row of half-marks rather than in a border — the ink stops, and the things
   * it was talking about are still going.
   */
  <section className="relative isolate overflow-hidden bg-ink">
    <div className="container-page relative flex flex-col items-center gap-6 py-16 text-center sm:gap-8 lg:py-24">
      {/*
       * The hero says "home". This says what you have instead, in the same
       * vocabulary, so the two sentences are one thought split across the fold.
       */}
      <h2 className="max-w-[20ch] text-balance text-3xl font-semibold leading-[1.08] tracking-tight text-paper sm:text-4xl lg:text-5xl">
        Exit your <span className="text-accent-inverse">rented</span> digital
        life.
      </h2>

      <p className="max-w-[54ch] text-pretty text-base leading-7 text-paper/70 sm:text-lg sm:leading-8">
        Most families don’t really know where their digital history lives. The
        photos are in one account, the videos in another, and the backups keep
        working only as long as someone keeps paying. <br />
        <span className="text-accent-inverse !font-bold">
          Valy brings it all home and keeps it there.
        </span>
      </p>
    </div>

    {/*
     * The marks are the chapter's background, not a strip along the foot of it.
     *
     * `inset-0` and `-z-10`: they occupy the whole section and sit behind the
     * type, so the band reserves no space for them and is exactly as tall as
     * its own sentence. Two earlier versions gave them a row of their own — a
     * flex line, then a fixed-height field with the padding grown to clear it —
     * and both made a second section that happened to contain pictures.
     *
     * Every position is a percentage of the section box, so the drift rescales
     * with the chapter instead of being pinned to its floor, and the ones with
     * a negative `bottom` are cut by the section's own edge.
     *
     * Decorative and inert: the sentence above already names every one of these
     * things, so announcing eleven icon names would be the same paragraph read
     * twice, and nothing here is clickable.
     */}
    <ul
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
    >
      {RENTED_LIFE_ICONS.map((icon, index) => (
        <li
          key={icon.name}
          className={[
            "absolute",
            STREAK[index].at,
            STREAK[index].size,
            STREAK[index].tilt,
            STREAK[index].dim,
            ON_PHONE.has(index) ? "" : "hidden sm:block",
          ].join(" ")}
          dangerouslySetInnerHTML={{ __html: icon.svg }}
        />
      ))}
    </ul>
  </section>
)

export default TheTenancy
