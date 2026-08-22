import { Clause, PageHeader } from "@modules/content/components/prose"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refunds & Cancellations",
  description:
    "Our refund and cancellation policy. Clear terms for returning machines and parts.",
}

export const dynamic = "force-static"

const UPDATED = "21 August 2026"

export default function RefundCancellationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Returns"
        title="Refunds & Cancellations"
        lede="If you need to send something back, here is how it works. No complicated RMA processes, just straightforward returns."
        updated={UPDATED}
      />

      <div className="container-page py-8 lg:py-12">
        <Clause id="returns" number="1" title="Seven-Day Returns">
          <p>
            You have <strong>seven days from delivery</strong> to send a machine
            back, no questions asked, for a full refund. We pay the return
            courier. It needs to come back with everything it arrived with, and
            in a condition that is not damaged beyond ordinary use.
          </p>
          <p>
            Drives you have written to are still returnable inside that window.
            We wipe them; we do not read them.
          </p>
        </Clause>

        <Clause id="parts" number="2" title="Parts and Services">
          <p>
            Parts bought separately are returnable inside the same seven days if
            unopened. Services already carried out are not refundable once the
            work is done — if we got it wrong, we redo it.
          </p>
        </Clause>

        <Clause id="cancellations" number="3" title="Order Cancellations">
          <p>
            You can cancel an order at any time before it ships for a full
            refund. Since machines are built to order and burn-in takes 48
            hours, there is usually a window to cancel before dispatch. Just
            email us at <a href="mailto:support@valy.in">support@valy.in</a>.
          </p>
        </Clause>

        <Clause id="process" number="4" title="The Refund Process">
          <p>
            Once we receive and inspect the returned item, we initiate the
            refund immediately. It is credited back to your original payment
            method. Depending on your bank or card provider, it usually takes
            5-7 working days to reflect in your account.
          </p>
        </Clause>
      </div>
    </>
  )
}
