/**
 * The four commitments.
 *
 * The wording is a promise to customers and is reused verbatim — in the footer,
 * on the product pages and here. Only the presentation changed: the figures now
 * carry the weight they are worth, and the band is the page's first dark
 * chapter rather than a thin ink stripe.
 *
 * Set in the sans rather than the data face. "48 h" and "7 day" contain a
 * space, and a monospaced space is a full character wide — at heading scale the
 * unit drifts far enough from the number to read as a typing error.
 */
const assurances = [
  { value: "GST", label: "Invoice on every order, input credit ready" },
  { value: "48 h", label: "Burn-in and SMART pass before dispatch" },
  { value: "3 yr", label: "Warranty with service inside India" },
  { value: "7 day", label: "Return window, no questions asked" },
]

const AssuranceStrip = () => (
  <section className="bg-ink">
    {/*
     * The rules are the paper ground showing through one-pixel gaps, so the
     * cells divide horizontally on a phone and into a four-across row on a wide
     * screen without a single border declaration changing direction.
     */}
    <ul className="grid grid-cols-1 gap-px bg-paper/12 sm:grid-cols-2 lg:grid-cols-4">
      {assurances.map((item) => (
        <li
          key={item.value}
          className="flex flex-col gap-2 bg-ink px-5 py-7 sm:px-8 sm:py-9"
        >
          <span className="text-3xl font-semibold tabular tracking-tight text-paper sm:text-4xl">
            {item.value}
          </span>
          <span className="max-w-[26ch] text-sm leading-6 text-paper/60">
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  </section>
)

export default AssuranceStrip
