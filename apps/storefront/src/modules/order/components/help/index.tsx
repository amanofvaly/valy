import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * What to do next, on the page a customer lands on straight after paying —
 * which is where "when does it arrive" and "how do I change the address" are
 * actually asked.
 */
const Help = () => (
  <section
    aria-labelledby="need-help"
    className="rounded-lg border border-line bg-surface p-5"
  >
    <h2 id="need-help" className="text-base font-medium text-ink">
      What happens now
    </h2>

    <ol className="mt-3 flex flex-col gap-2 text-sm leading-6 text-muted">
      <li>
        We build it, then run it on the bench for 48 hours — Memtest, a full
        SMART long test on every disk, and a sustained write soak.
      </li>
      <li>
        You get an email with the test sheet and a tracking number when it
        ships. Orders placed before 2 PM IST on a working day leave the bench
        the same evening.
      </li>
      <li>
        Seven days from delivery to send it back if you change your mind, and
        three years of warranty serviced in India.
      </li>
    </ol>

    <p className="mt-4 text-sm text-muted">
      Something wrong with the order?{" "}
      <a
        href="mailto:support@valy.in"
        className="text-accent hover:text-accent-strong"
      >
        support@valy.in
      </a>
      , or find it again under{" "}
      <LocalizedClientLink
        href="/account/orders"
        className="text-accent hover:text-accent-strong"
      >
        your orders
      </LocalizedClientLink>
      .
    </p>
  </section>
)

export default Help
