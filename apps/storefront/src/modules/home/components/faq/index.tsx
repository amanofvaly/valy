"use client"

import { ChevronDownMini } from "@medusajs/icons"
import * as Accordion from "@radix-ui/react-accordion"
import { Section, SectionHeading } from "@modules/home/components/section"

/**
 * The questions that arrive every week.
 *
 * The answers are commercial commitments — warranty terms, measured noise
 * figures, the return window, GST invoicing — and are reused word for word. The
 * only edit is the machine names: the copy predates the range being called
 * Flow, Hike and Summit and referred to Nano, Core and Vault. Every figure is
 * unchanged, and the lineup's own metadata was reconciled to match these
 * numbers rather than the other way round.
 */
const questions = [
  {
    q: "Do the drives come with the machine?",
    a: "Only if you want them to. Drives are priced separately at the day's rate because prices move weekly, and plenty of buyers bring their own. Either way the bays are populated, the pool is created, and the drives are burned in before dispatch.",
  },
  {
    q: "Will it survive Indian power?",
    a: "Every build ships with a wide-range 90 to 264 V supply and is tested at 230 V. We size a UPS for the configuration and can add it to the order. On the Hike and Summit, the OS is set to shut down cleanly on a UPS low-battery signal.",
  },
  {
    q: "How loud is it, really?",
    a: "The Flow measures 19 dB(A) at one metre, the Hike 24, and the Summit 31 under a sustained write. The Flow and Hike are quiet enough for a bedroom cupboard. Measured figures ship on the test sheet with the machine.",
  },
  {
    q: "Do I get a GST invoice?",
    a: "Yes, on every order, with your GSTIN if you add it at checkout. Input credit works normally, and studios buying under a company name get the invoice in that name.",
  },
  {
    q: "What does the warranty cover, and who services it?",
    a: "Three years on parts and labour, handled by us in India rather than an overseas RMA queue. In the metros we collect and return the unit. Elsewhere we ship a replacement part with instructions, or the whole chassis if that is faster.",
  },
  {
    q: "Can I open it up and upgrade it myself?",
    a: "Please do. Adding drives, memory, or cards does not void anything. The machine is standard hardware with no proprietary parts, and the parts list ships with it.",
  },
]

const Faq = () => (
  <Section ground="surface">
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
      <SectionHeading
        eyebrow="Before you order"
        title="The questions we get every week."
      />

      <Accordion.Root type="single" collapsible className="flex flex-col">
        {questions.map((item) => (
          <Accordion.Item
            key={item.q}
            value={item.q}
            className="border-t border-line last:border-b"
          >
            <Accordion.Header>
              <Accordion.Trigger className="pressable group flex w-full items-center justify-between gap-6 py-5 text-left focus-visible:outline-none">
                <span className="text-base font-medium text-ink">{item.q}</span>
                <ChevronDownMini
                  aria-hidden
                  className="shrink-0 text-muted transition-transform duration-200 group-radix-state-open:rotate-180"
                />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="overflow-hidden radix-state-closed:animate-accordion-close radix-state-open:animate-accordion-open">
              <p className="max-w-prose pb-6 pr-10 text-sm leading-6 text-muted">
                {item.a}
              </p>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  </Section>
)

export default Faq
