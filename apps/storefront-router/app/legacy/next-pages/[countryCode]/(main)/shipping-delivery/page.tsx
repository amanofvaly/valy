import { Clause, PageHeader } from "@modules/content/components/prose"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description:
    "How we build, pack, and ship your orders across India.",
}

export const dynamic = "force-static"

const UPDATED = "21 August 2026"

export default function ShippingDeliveryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Shipping"
        title="Shipping & Delivery"
        lede="Everything you need to know about how your order gets from our bench to your desk."
        updated={UPDATED}
      />

      <div className="container-page py-8 lg:py-12">
        <Clause id="dispatch" number="1" title="Building and dispatch">
          <p>
            Machines are built to order. Before any machine leaves, it runs{" "}
            <strong>48 hours on the bench</strong>: Memtest, a full SMART long
            test on every disk, and a sustained write soak. Thermals and noise
            are measured at one metre and recorded on the test sheet that ships
            with it.
          </p>
          <p>
            Orders placed before <strong>2 PM IST</strong> on a working day
            leave the bench the same evening, once the burn-in above is
            complete.
          </p>
        </Clause>

        <Clause id="transit" number="2" title="Transit and Delivery Time">
          <p>
            Delivery anywhere in India is handled by insured, tracked courier.
            It normally takes <strong>three to six days</strong> after dispatch,
            depending on your location. We share the tracking details with you
            as soon as the parcel is handed over.
          </p>
        </Clause>

        <Clause id="packaging" number="3" title="Packaging and Damage">
          <p>
            Machines are packed securely to survive Indian logistics. Drives
            ship in place with custom foam blocks in the bays to prevent movement.
          </p>
          <p>
            If a courier damages a parcel in transit, that is our responsibility to
            resolve, not yours. Tell us immediately at{" "}
            <a href="mailto:support@valy.in">support@valy.in</a>, and we will replace it.
          </p>
        </Clause>

        <Clause id="locations" number="4" title="Where we ship">
          <p>
            We currently ship across India. All orders are invoiced from
            New Delhi, with GST included. We do not offer international
            shipping at this time.
          </p>
        </Clause>
      </div>
    </>
  )
}
