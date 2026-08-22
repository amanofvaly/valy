import ContactForm from "@modules/contact/components/contact-form"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { PageHeader } from "@modules/content/components/prose"
import { Section, SectionHeading } from "@modules/home/components/section"
import { Metadata } from "next"

/**
 * Contact.
 *
 * The page is built out of the homepage's chapter grammar rather than the
 * legal pages' single column: a red rule opening the chapter that matters, a
 * heading that carries itself with no label above it, hairline rules doing the
 * dividing, and mono reserved for the things that are actually data. What it
 * does not borrow is the homepage's red register — that ground belongs to the
 * one surface arguing against a subscription, and this one is a task.
 *
 * The composition is a decision about what a contact page is for. The form is
 * seven columns wide and opens the chapter, because writing the message is the
 * errand. The rail beside it exists for the visitor who would rather not use a
 * form at all: the address is set at heading scale, not buried in a sentence,
 * and the three facts under it are the ones that decide whether writing is even
 * necessary. The last chapter is the honest admission that most of what arrives
 * in the inbox is already answered on three other pages.
 *
 * No address, no phone number, no office hours: publishing a fact nobody has
 * confirmed is worse than publishing nothing. Every figure on the page —
 * one working day, three years, seven days — is copy this site already commits
 * to in the terms and the assurance strip, restated in the same words.
 */

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Write to Valy about a machine, an order, a warranty claim or whether a part fits. A person answers within one working day, or write to support@valy.in directly.",
}

export const dynamic = "force-static"

const FACTS = [
  { label: "Reply", value: "Within one working day" },
  { label: "Warranty", value: "Three years, serviced in India" },
  { label: "Returns", value: "Seven days from delivery" },
]

const ELSEWHERE = [
  {
    href: "/compatibility",
    title: "What fits what",
    detail:
      "Which drives, cards and memory go in which machine, and what changes when you mix them.",
  },
  {
    href: "/getting-started",
    title: "Getting started",
    detail:
      "How much space you actually need, what RAID protects you from, and what it does not.",
  },
  {
    href: "/terms",
    title: "Terms of sale",
    detail:
      "Warranty, returns, dispatch and GST invoicing, in eight clauses written to be read.",
  },
]

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Write to us"
        lede="We usually respond within 1 working day. Before you buy, after it ships, or three years in when a drive starts clicking."
      />

      <Section rule="accent">
        <div className="grid grid-cols-1 gap-y-14 lg:grid-cols-12 lg:gap-x-16">
          <div className="lg:col-span-7">
            <h2 className="sr-only">Send a message</h2>
            <ContactForm />
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            {/*
             * The rail opens on a hairline where the form opens on the ink
             * rule, so both columns start on one horizontal and read as a grid
             * rather than as two stacked things beside each other. Hairline,
             * not ink: the form is the errand.
             */}
            <div className="border-t border-line pt-8 lg:sticky lg:top-24">
              <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                Or write to us directly.
              </h2>

              <a
                href="mailto:support@valy.in"
                className="pressable mt-5 inline-block rounded text-xl font-semibold tracking-tight text-ink underline decoration-line-strong decoration-1 underline-offset-[6px] hover:text-accent hover:decoration-accent sm:text-2xl"
              >
                support@valy.in
              </a>

             

              <dl className="mt-8 border-t border-line">
                {FACTS.map((fact) => (
                  <div
                    key={fact.label}
                    className="flex items-baseline justify-between gap-6 border-b border-line py-3"
                  >
                    <dt className="shrink-0 text-xs text-muted">
                      {fact.label}
                    </dt>
                    <dd className="text-right text-sm text-ink">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>

        
      </Section>

      <Section ground="surface" rule="hairline">
        <SectionHeading
          title="Get your questions answered quickly"
          lede="We have answered most common questions, and you will find your answer in seconds."
        />

        <div className="mt-14 grid grid-cols-1 border-t-2 border-ink lg:grid-cols-3">
          {ELSEWHERE.map((item) => (
            <LocalizedClientLink
              key={item.href}
              href={item.href}
              showPending
              className="pressable group flex flex-col gap-2 border-b border-line py-8 lg:border-b-0 lg:border-l lg:px-7 lg:py-9 lg:first:border-l-0 lg:first:pl-0"
            >
              <h3 className="text-xl font-semibold tracking-tight text-ink transition-colors group-hover:text-accent">
                {item.title}
              </h3>
              <p className="max-w-prose text-base leading-7 text-muted">
                {item.detail}
              </p>
            </LocalizedClientLink>
          ))}
        </div>
      </Section>
    </>
  )
}
