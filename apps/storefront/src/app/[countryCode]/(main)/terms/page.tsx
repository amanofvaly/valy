import { Clause, PageHeader } from "@modules/content/components/prose"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Metadata } from "next"

/**
 * Terms of sale.
 *
 * Every commitment here is one the site already makes somewhere a customer sees
 * it — the assurance strip, the FAQ, the order confirmation — restated in one
 * place so it is a document rather than a set of claims scattered across
 * marketing copy. The numbers are the same numbers.
 *
 * Written to be read. A term nobody can get through is a term nobody agreed to.
 */

export const metadata: Metadata = {
  title: "Terms of sale",
  description:
    "Warranty, returns, delivery, GST invoicing and what happens when something breaks. Written to be read.",
}

export const dynamic = "force-static"

const UPDATED = "21 August 2026"

export default function TermsPage() {
  return (
    <>
      <PageHeader
        
        title="Terms of sale and service"
        lede="These are the terms every order is sold under. They are short on purpose, and they say the same things the rest of the site says."
        updated={UPDATED}
      />

      <div className="container-page py-8 lg:py-12">
        <Clause id="who" number="1" title="Who you are buying from">
          <p>
            Valy builds and sells computer hardware from Bengaluru, Karnataka,
            India, and ships across India. Every order is invoiced from here,
            with GST, in rupees.
          </p>
          <p>
            Questions about an order, before or after it ships, go to{" "}
            <a href="mailto:support@valy.in">support@valy.in</a>. A real person
            answers within one working day.
          </p>
        </Clause>

        <Clause id="prices" number="2" title="Prices and GST">
          <p>
            Every price shown on this site includes GST, as required. The figure
            on the product page is the figure you pay for that item; nothing is
            added at checkout except delivery, which is shown before you
            confirm.
          </p>
          <p>
            Add your GSTIN at checkout and the invoice is raised against your
            business, so input credit works normally. Billing and delivery
            addresses can differ; if you enter a GSTIN against both, the billing
            one is used, because that is the entity being invoiced.
          </p>
          <p>
            Component prices — drives especially — move week to week. The price
            you are charged is the price shown when you place the order.
          </p>
        </Clause>

        <Clause id="building" number="3" title="Building and dispatch">
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
            complete. Delivery anywhere in India is by insured, tracked courier
            and normally takes three to six days after dispatch.
          </p>
          <p>
            Drives ship in place with foam blocks in the bays. If a courier
            damages a parcel in transit, that is ours to resolve, not yours —
            tell us and we replace it.
          </p>
        </Clause>

        <Clause id="returns" number="4" title="Returns">
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
          <p>
            Parts bought separately are returnable inside the same seven days if
            unopened. Services already carried out are not refundable once the
            work is done — if we got it wrong, we redo it.
          </p>
        </Clause>

        <Clause id="warranty" number="5" title="Warranty">
          <p>
            Machines carry <strong>three years on parts and labour</strong>,
            handled by us in India rather than an overseas RMA queue. In the
            metros we collect and return the unit. Elsewhere we ship a
            replacement part with instructions, or the whole chassis if that is
            faster.
          </p>
          <p>
            Drives, memory and cards bought on their own carry the
            manufacturer&apos;s own warranty, which is stated on each product
            page. We handle the claim for you rather than sending you to them.
          </p>
          <p>
            <strong>Opening the machine does not void anything.</strong> Adding
            drives, memory or cards is expected. If a part you fitted yourself is
            what failed, that part is not ours to replace — but the rest of the
            machine stays covered, and we will help you work out which it was.
          </p>
          <p>
            Not covered: physical damage, liquid, power surges beyond what the
            supply is rated for, and the ordinary wear that eventually ends every
            spinning drive&apos;s life.
          </p>
        </Clause>

        <Clause id="data" number="6" title="Your data is yours">
          <p>
            Nothing on a Valy machine reports to us. There is no account to
            register, no telemetry, no cloud service that can be discontinued.
            The software is open source and the hardware is standard — if we
            stopped trading tomorrow, the machine would keep working exactly as
            it does today.
          </p>
          <p>
            We cannot recover data for you, because we have no access to it.
            Redundancy protects against a drive failing; it is not a backup. Keep
            a second copy somewhere else.
          </p>
        </Clause>

        <Clause id="liability" number="7" title="What we are liable for">
          <p>
            We are liable for the machine: replacing it, repairing it, or
            refunding it under the terms above. We are not liable for data loss,
            for time, or for consequential losses arising from a machine being
            unavailable, and our total liability on any order is limited to what
            you paid for it.
          </p>
          <p>
            None of this limits rights you have under the Consumer Protection
            Act, 2019, which apply regardless of anything written here.
          </p>
        </Clause>

        <Clause id="changes" number="8" title="Changes">
          <p>
            These terms may change. The version that applies to your order is the
            one published when you placed it, and the date at the top of this
            page tells you which that is. Changes are never applied backwards.
          </p>
          <p>
            How we handle personal information is covered separately in the{" "}
            <LocalizedClientLink href="/privacy">
              privacy policy
            </LocalizedClientLink>
            .
          </p>
        </Clause>
      </div>
    </>
  )
}
