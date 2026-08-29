import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * What to do next, on the page a customer lands on straight after paying —
 * which is where "when does it arrive" and "how do I change the address" are
 * actually asked.
 *
 * Three short lines. It used to spell out Memtest, SMART long tests, write
 * soaks, a 2 PM cutoff, the returns window and the warranty term, all in the
 * first minute after someone spent their money — none of which they had asked
 * for yet, and all of which lives on the pages linked below.
 */
const Help = () => (
  <section
    aria-labelledby="what-happens-next"
    className="rounded-lg border border-line bg-surface p-5"
  >
    <h2 id="what-happens-next" className="text-base font-semibold text-ink">
      What happens next
    </h2>

    <ol className="mt-3 flex flex-col gap-2 text-sm leading-6 text-muted">
      <li>We build your machine and test it for 48 hours.</li>
      <li>We email you a tracking number when it ships.</li>
      <li>It arrives, tested, with the results in the box.</li>
    </ol>

    <p className="mt-4 text-sm leading-6 text-muted">
      Need to change something?{" "}
      <a
        href="mailto:support@valy.in"
        className="text-accent hover:text-accent-strong"
      >
        support@valy.in
      </a>{" "}
      · Find this again in{" "}
      <LocalizedClientLink
        href="/account/orders"
        className="text-accent hover:text-accent-strong"
      >
        your orders
      </LocalizedClientLink>
    </p>
  </section>
)

export default Help
