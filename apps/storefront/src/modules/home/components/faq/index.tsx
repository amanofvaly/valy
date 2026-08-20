"use client"

import * as Accordion from "@radix-ui/react-accordion"

import SectionHeading from "@modules/home/components/section-heading"

const questions = [
  {
    q: "Do the drives come with the machine?",
    a: "Only if you want them to. Drives are priced separately at the day's rate because prices move weekly, and plenty of buyers bring their own. Either way the bays are populated, the pool is created, and the drives are burned in before dispatch.",
  },
  {
    q: "Will it survive Indian power?",
    a: "Every build ships with a wide-range 90 to 264 V supply and is tested at 230 V. We size a UPS for the configuration and can add it to the order. On the Core and Vault, the OS is set to shut down cleanly on a UPS low-battery signal.",
  },
  {
    q: "How loud is it, really?",
    a: "The Nano measures 19 dB(A) at one metre, the Core 24, and the Vault 31 under a sustained write. The Nano and Core are quiet enough for a bedroom cupboard. Measured figures ship on the test sheet with the machine.",
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

const Faq = () => {
  return (
    <section className="border-t border-zinc-200 bg-zinc-50 py-16 lg:py-24">
      <div className="content-container grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SectionHeading
          eyebrow="Before you order"
          title="The questions we get every week."
        />

        <Accordion.Root type="single" collapsible className="flex flex-col">
          {questions.map((item) => (
            <Accordion.Item
              key={item.q}
              value={item.q}
              className="border-t border-zinc-200 last:border-b"
            >
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
                  <span className="font-display text-lg tracking-tight text-zinc-900">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className="font-mono text-lg leading-none text-zinc-400 transition-transform duration-200 group-radix-state-open:rotate-45"
                  >
                    +
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden radix-state-open:animate-accordion-open radix-state-closed:animate-accordion-close">
                <p className="max-w-2xl pb-6 pr-10 text-sm leading-6 text-zinc-600">
                  {item.a}
                </p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  )
}

export default Faq
