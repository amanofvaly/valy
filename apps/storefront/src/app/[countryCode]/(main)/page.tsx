import AppLibrary from "@modules/home/components/app-library"
import Arithmetic from "@modules/home/components/arithmetic"
import AssuranceStrip from "@modules/home/components/assurance-strip"
import Faq from "@modules/home/components/faq"
import Hero from "@modules/home/components/hero"
import PartsProof from "@modules/home/components/parts-proof"
import TheRange from "@modules/home/components/the-range"
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
 * The grounds alternate deliberately rather than by rota: paper, ink, paper,
 * red, paper, surface, paper, surface, ink, paper. The two dark chapters and
 * the one red one are the three places the page raises its voice — what you get
 * for the money, what renting costs, and what happens when it breaks — and
 * everything between them is quiet on purpose so those three land.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <AssuranceStrip />
      <AppLibrary />
      <Arithmetic />

      <TheRange />
      <PartsProof />
      <Faq />
    </>
  )
}
