import AfterYouOrder from "@modules/home/components/after-you-order"
import Arithmetic from "@modules/home/components/arithmetic"
import AssuranceStrip from "@modules/home/components/assurance-strip"
import Faq from "@modules/home/components/faq"
import Hero from "@modules/home/components/hero"
import PartsProof from "@modules/home/components/parts-proof"
import TheRange from "@modules/home/components/the-range"
import WhatItReplaces from "@modules/home/components/what-it-replaces"
import WhoBuildsIt from "@modules/home/components/who-builds-it"
import { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Homelab servers built in Bengaluru",
  description:
    "Small, quiet servers that hold your photographs, films and work on hardware you own. Built to order, burned in for 48 hours, GST invoiced, three-year warranty serviced in India.",
}

/**
 * The homepage makes one argument: that the files should be yours, and that
 * this is a practical thing to arrange rather than a hobby.
 *
 * Everything except the lineup is static — no API call, nothing to wait for, so
 * the argument is on screen in the first frame. The lineup reads live prices
 * and streams in behind its own boundary; it sits four sections down, which is
 * well past where anyone has read to by the time it lands.
 */
export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  return (
    <>
      <Hero />
      <AssuranceStrip />
      <Arithmetic />
      <WhatItReplaces />

      <Suspense fallback={<RangeFallback />}>
        <TheRange countryCode={countryCode} />
      </Suspense>

      <PartsProof />
      <AfterYouOrder />
      <WhoBuildsIt />
      <Faq />
    </>
  )
}

/**
 * The lineup's own shape while its prices arrive: the section heading is
 * already real, and only the three cards are pending. Matched to the real
 * card's height so the page does not jump when they land.
 */
const RangeFallback = () => (
  <section className="border-t border-line bg-surface py-14 sm:py-20 lg:py-24">
    <div className="container-page">
      <div className="flex flex-col gap-4">
        <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
          The range
        </p>
        <h2 className="max-w-2xl text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Three sizes, named after how far you have got.
        </h2>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-72 animate-pulse rounded-lg border border-line bg-paper"
          />
        ))}
      </div>
    </div>
  </section>
)
