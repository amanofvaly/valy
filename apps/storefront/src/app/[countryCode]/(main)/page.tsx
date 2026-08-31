import AppLibrary from "@modules/home/components/app-library"
import Arithmetic from "@modules/home/components/arithmetic"
import Faq from "@modules/home/components/faq"
import Hero from "@modules/home/components/hero"
import PartsProof from "@modules/home/components/parts-proof"
// import TheRange from "@modules/home/components/the-range"
import TheTenancy from "@modules/home/components/the-tenancy"
import { Metadata } from "next"

export const metadata: Metadata = {
  description:
    "Photo backup and sync, media streaming, home automation, network monitoring, virtualization and more - all on a machine you own. Free and open source apps to run your home on your terms.",
}


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

      {/* <TheRange /> */}
      <PartsProof />
      <Faq />
    </>
  )
}
