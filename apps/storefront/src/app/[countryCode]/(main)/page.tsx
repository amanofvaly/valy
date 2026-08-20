import { Metadata } from "next"
import { Suspense } from "react"

import AssuranceStrip from "@modules/home/components/assurance-strip"
import FeaturedProductsSection from "@modules/home/components/featured-products/section"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
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
      {/* The only part of this page that needs the API. Everything above renders
          immediately; this streams in behind its skeleton rather than holding
          the whole page back. */}
      <Suspense
        fallback={
          <div className="content-container py-12">
            <SkeletonProductGrid numberOfProducts={4} />
          </div>
        }
      >
        <FeaturedProductsSection countryCode={countryCode} />
      </Suspense>
      <BuildDesk />
    </>
  )
}
