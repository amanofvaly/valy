const assurances = [
  { value: "GST", label: "Invoice on every order, input credit ready" },
  { value: "48 h", label: "Burn-in and SMART pass before dispatch" },
  { value: "3 yr", label: "Warranty with service inside India" },
  { value: "7 day", label: "Return window, no questions asked" },
]

const AssuranceStrip = () => {
  return (
    <section className="border-b border-zinc-200 bg-zinc-50">
      <div className="content-container grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4">
        {assurances.map((item) => (
          <div
            key={item.value}
            className="flex items-baseline gap-3 border-b border-zinc-200 py-5 last:border-b-0 lg:border-b-0 lg:border-r lg:pr-6 lg:last:border-r-0"
          >
            <span className="font-mono text-sm font-medium uppercase tracking-[0.14em] text-zinc-900">
              {item.value}
            </span>
            <span className="text-sm leading-6 text-zinc-600">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default AssuranceStrip
