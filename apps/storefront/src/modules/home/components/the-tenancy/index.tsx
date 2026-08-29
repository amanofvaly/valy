/**
 * The story, stated once, immediately after the headline.
 *
 * This band was four cells — a GST note, a burn-in schedule, a warranty term
 * and a return window — and then four differently-worded cells that were still
 * about the transaction: what arrives, what it costs, who to call. Both
 * versions answered questions a visitor has not asked yet. A person who has
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
 *
 * One statement, centred, on ink. Not a grid: four short cells side by side is
 * a specification sheet whatever is written in them, and the eye reads the
 * shape before it reads a word of it.
 */
const TheTenancy = () => (
  <section className="bg-ink">
    <div className="container-page flex flex-col items-center gap-6 py-16 text-center sm:gap-8 lg:py-24">
      {/*
       * The hero says "home". This says what you have instead, in the same
       * vocabulary, so the two sentences are one thought split across the fold.
       */}
      <h2 className="max-w-[20ch] text-balance text-3xl font-semibold leading-[1.08] tracking-tight text-paper sm:text-4xl lg:text-5xl">
        Exit your <span className="text-accent-inverse">rented</span> digital life.
      </h2>

      <p className="max-w-[54ch] text-pretty text-base leading-7 text-paper/70 sm:text-lg sm:leading-8">
        The photographs sit on one company&apos;s computer, the films on
        another&apos;s, the backups on a plan that renews on the 4th. Twenty
        years of your life, and not one shelf of it in your house. A Valy is the
        shelf — and it keeps holding all of it whether or not anybody remembers
        to pay.
      </p>
    </div>
  </section>
)

export default TheTenancy
