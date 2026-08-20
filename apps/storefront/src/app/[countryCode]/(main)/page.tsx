import { Metadata } from "next"

import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import AssuranceStrip from "@modules/home/components/assurance-strip"
import FeaturedProducts from "@modules/home/components/featured-products"
import BuildProcess from "@modules/home/components/build-process"
import BuildDesk from "@modules/home/components/build-desk"
import Configurations from "@modules/home/components/configurations"
import Faq from "@modules/home/components/faq"
import Hero from "@modules/home/components/hero"
import ReadyToShip from "@modules/home/components/ready-to-ship"
import OwnerNotes from "@modules/home/components/owner-notes"
import SoftwareStack from "@modules/home/components/software-stack"
import UseCases from "@modules/home/components/use-cases"

export const metadata: Metadata = {
  title: "Valy Homelabs — Homelab servers built and burned in for India",
  description:
    "NAS boxes, Plex and Jellyfin media servers, and Proxmox nodes assembled in Bengaluru. GST invoice, 48-hour burn-in, three-year warranty serviced in India.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  return (
    <>
      <Hero />
      <AssuranceStrip />
      <UseCases />
      <ReadyToShip countryCode={countryCode} />
      <Configurations />
      <SoftwareStack />
      <BuildProcess />
      <OwnerNotes />
      <Faq />
      {region && collections?.length > 0 && (
        <ul className="flex flex-col">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      )}
      <BuildDesk />
    </>
  )
}
