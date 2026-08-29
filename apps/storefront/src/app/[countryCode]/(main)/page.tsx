import AppLibrary from "@modules/home/components/app-library"
import Arithmetic from "@modules/home/components/arithmetic"
import Faq from "@modules/home/components/faq"
import Hero from "@modules/home/components/hero"
import PartsProof from "@modules/home/components/parts-proof"
import TheRange from "@modules/home/components/the-range"
import TheTenancy from "@modules/home/components/the-tenancy"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Easy homelabs and NAS - Valy",
  description:
    "Photo backup and sync, media streaming, home automation, network monitoring, virtualization and more - all on a machine you own. Free and open source apps to run your home on your terms.",
}

/**
 * The homepage makes one argument in two halves: that the software worth
 * running at home is free and excellent, and that the reason most people never
 * run it is an evening of work nobody wants to do.
 *
 * So the order is why, then what, then how much, then which machine. The range
 * and parts chapters use fixed explanatory imagery; catalogue size and ordering
 * cannot change what the homepage chooses to show.
 *
 * The grounds alternate deliberately rather than by rota, and the two loud
 * chapters sit close together on purpose: the ink band names the tenancy and
 * the accent band prices it. Everything after them — the software, the range,
 * the parts, the questions — is quiet paper and surface, because the argument
 * has already been made and the rest of the page is evidence.
 */
export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  return (
    <>
      <Hero countryCode={countryCode} />
      <TheTenancy />
      <AppLibrary />
      <Arithmetic />

      <TheRange />
      <PartsProof />
      <Faq />
    </>
  )
}
