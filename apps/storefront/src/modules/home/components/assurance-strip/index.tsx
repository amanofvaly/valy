/**
 * The four commitments.
 *
 * The wording is a promise to customers and is reused verbatim — in the footer,
 * on the product pages and here. Only the presentation changed.
 */
const assurances = [
  { value: "GST", label: "Invoice on every order, input credit ready" },
  { value: "48 h", label: "Burn-in and SMART pass before dispatch" },
  { value: "3 yr", label: "Warranty with service inside India" },
  { value: "7 day", label: "Return window, no questions asked" },
]

const AssuranceStrip = () => (
  <section className="border-t border-line bg-ink">
    <ul className="container-page grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
      {assurances.map((item, i) => (
        <li
          key={item.value}
          className={`flex items-baseline gap-3 py-4 sm:py-5 ${
            i < assurances.length - 1 ? "border-b border-paper/10 lg:border-b-0" : ""
          }`}
        >
          <span className="shrink-0 font-mono text-xs uppercase tracking-[0.14em] text-paper">
            {item.value}
          </span>
          <span className="text-sm leading-6 text-paper/70">{item.label}</span>
        </li>
      ))}
    </ul>
  </section>
)

export default AssuranceStrip
