import { useQuery } from "@tanstack/react-query"
import { useLocation } from "@tanstack/react-router"
import { PageShell } from "../../app/components/page-shell"
import { countryFromPath } from "../../app/lib/market"
import AppLibrary from "@modules/home/components/app-library"
import Arithmetic from "@modules/home/components/arithmetic"
import Faq from "@modules/home/components/faq"
import Hero from "@modules/home/components/hero"
import PartsProof from "@modules/home/components/parts-proof"
import TheTenancy from "@modules/home/components/the-tenancy"
import { flowPriceQuery } from "../data/catalogue"

export default function HomeScreen() {
  const countryCode = countryFromPath(useLocation().pathname)
  const { data: price } = useQuery(flowPriceQuery(countryCode))
  return (
    <PageShell>
      <Hero price={price} />
      <TheTenancy />
      <AppLibrary />
      <Arithmetic />
      <PartsProof />
      <Faq />
    </PageShell>
  )
}
