import AfterYouOrder from "@modules/home/components/after-you-order"
import AppLibrary from "@modules/home/components/app-library"
import Arithmetic from "@modules/home/components/arithmetic"
import AssuranceStrip from "@modules/home/components/assurance-strip"
import Faq from "@modules/home/components/faq"
import Hero from "@modules/home/components/hero"
import PartsProof from "@modules/home/components/parts-proof"
import { Section, SectionHeading } from "@modules/home/components/section"
import TheRange from "@modules/home/components/the-range"
import { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Run twenty-eight apps on a machine you own",
  description:
    "Immich, Jellyfin, Home Assistant, Pi-hole, Frigate, Proxmox and twenty-two more — free, open source, and installed before the machine ships. Built to order, burned in for 48 hours, GST invoiced, three-year warranty serviced in India.",
}

/**
 * The homepage makes one argument in two halves: that the software worth
 * running at home is free and excellent, and that the reason most people never
 * run it is an evening of work nobody wants to do.
 *
 * So the order is why, then what, then how much, then what the work is, then
 * which machine. The two sections that read live — the services and the lineup
 * — sit fifth and sixth, well past where anyone has read to by the time they
 * land, and each streams behind its own boundary. Everything above them is
 * static, so the argument paints with the first frame.
 *
 * The grounds alternate deliberately rather than by rota: paper, ink, paper,
 * red, paper, surface, paper, surface, ink, paper. The two dark chapters and
 * the one red one are the three places the page raises its voice — what you get
 * for the money, what renting costs, and what happens when it breaks — and
 * everything between them is quiet on purpose so those three land.
 */
export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  return (
    <>
      <Hero />
      <AssuranceStrip />
      <AppLibrary />
      <Arithmetic />

      <Suspense fallback={<RangeFallback />}>
        <TheRange countryCode={countryCode} />
      </Suspense>

      <PartsProof />
      <AfterYouOrder />
      <Faq />
    </>
  )
}

/**
 * Both fallbacks are the real section — the same ground, the same rule, the
 * same heading at the same size — with only the priced rows pending. The page
 * does not reflow when the catalogue answers; a block of grey turns into text.
 */

const RangeFallback = () => (
  <Section ground="surface" rule="accent">
    <SectionHeading
      title="Three sizes, named after how far you have got."
      lede="Every one is built to order, burned in for 48 hours and configured before it ships. The bays and the processor are what separate them; the warranty and the work do not change."
    />
    <div className="mt-14 grid grid-cols-1 border-t-2 border-ink lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="border-b border-line py-8 lg:border-b-0 lg:border-l lg:px-7 lg:first:border-l-0 lg:first:pl-0"
        >
          <div className="h-[24rem] animate-pulse rounded bg-paper" />
        </div>
      ))}
    </div>
  </Section>
)
