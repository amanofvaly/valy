import { Clause, PageHeader } from "@modules/content/components/prose"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Metadata } from "next"

/**
 * Privacy policy.
 *
 * A shop whose entire argument is that data belongs to the person it is about
 * cannot then run a page of boilerplate about "trusted partners". This says
 * what is collected, why, how long it is kept, and what is not collected —
 * which for a hardware shop is most of it.
 */

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What we collect, why, how long we keep it, and the long list of things we do not do with it.",
}

export const dynamic = "force-static"

const UPDATED = "21 August 2026"

const NOT_DONE = [
  "Sell or rent your details to anyone",
  "Run advertising trackers or third-party analytics on this site",
  "Build a profile of you across other websites",
  "Email you marketing you did not ask for",
  "Read, index or back up anything on a machine you bought",
]

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Privacy"
        title="We hold as little as an order needs."
        lede="Selling machines whose point is that your files stay yours, while quietly building a profile of the people who buy them, would be an odd way to run a business."
        updated={UPDATED}
      />

      <div className="container-page max-w-3xl py-8 lg:py-12">
        <section className="rounded-lg border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-base font-medium text-ink">
            Things we do not do
          </h2>
          <ul className="mt-3 flex flex-col divide-y divide-line border-y border-line">
            {NOT_DONE.map((item) => (
              <li
                key={item}
                className="flex items-baseline gap-2.5 py-2.5 text-sm text-muted"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal"
                />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <Clause id="collect" number="1" title="What we collect, and why">
          <p>
            <strong>To fulfil an order:</strong> your name, delivery address,
            email address and phone number. The courier needs the address and
            the phone number; you need the email for the confirmation and the
            invoice. There is no version of shipping a parcel that works without
            these.
          </p>
          <p>
            <strong>If you give us one:</strong> your GSTIN, which goes on the
            invoice so input credit works. Optional, and only used for that.
          </p>
          <p>
            <strong>If you create an account:</strong> the same details, kept so
            you do not have to type them again, plus your order history so you
            can find an invoice or a test sheet later. An account is never
            required to buy anything.
          </p>
          <p>
            <strong>Payment:</strong> handled by the payment provider. Card
            numbers reach them, not us. We are told whether a payment succeeded
            and, for a card, the last four digits so you can recognise it on the
            order.
          </p>
        </Clause>

        <Clause id="cookies" number="2" title="Cookies">
          <p>
            Four, all of them functional. One remembers which cart is yours. One
            keeps you signed in if you have an account. One holds your language
            preference. One carries your details briefly between signing up and
            verifying your email, and is deleted the moment that finishes.
          </p>
          <p>
            None of them track you, and there are no third-party cookies on this
            site — which is why there is no consent banner. There is nothing to
            consent to.
          </p>
        </Clause>

        <Clause id="sharing" number="3" title="Who else sees it">
          <p>Three parties, each for one job:</p>
          <ul>
            <li>
              <strong>The courier</strong> gets your name, address and phone
              number, because that is how a parcel arrives.
            </li>
            <li>
              <strong>The payment provider</strong> gets what it needs to take
              the payment.
            </li>
            <li>
              <strong>Our accountant and the tax authorities</strong> get the
              invoice, because GST records are a legal requirement.
            </li>
          </ul>
          <p>
            That is the complete list. Nobody else, for any reason, including
            money.
          </p>
        </Clause>

        <Clause id="keeping" number="4" title="How long we keep it">
          <p>
            Invoices and order records for <strong>eight years</strong>, because
            GST law requires it. That one is not our choice.
          </p>
          <p>
            Account details for as long as you have an account. Delete the
            account and they go, except the invoices above, which have to stay
            but are no longer linked to a login.
          </p>
          <p>
            A cart you never checked out with expires after a week and is gone.
          </p>
        </Clause>

        <Clause id="machine" number="5" title="The machine itself">
          <p>
            Worth stating plainly, because it is the whole point: a Valy machine
            does not report to us. It has no account with us, sends us no
            telemetry, and does not check in. We cannot see what is on it, how
            much space is used, or whether it is switched on.
          </p>
          <p>
            If you buy a setup service, we access the machine for as long as the
            work takes, with credentials you create and revoke. If you ask us to
            migrate a photo library, we handle those files for the duration of
            that job and delete our copies when it is signed off.
          </p>
        </Clause>

        <Clause id="rights" number="6" title="What you can ask for">
          <p>
            A copy of everything we hold about you, a correction to any of it, or
            its deletion. Email{" "}
            <a href="mailto:privacy@valy.in">privacy@valy.in</a> and we will
            answer within thirty days — usually the same week, because there is
            not much to look through.
          </p>
          <p>
            If you are unhappy with how we handled a request, you can escalate it
            under the Digital Personal Data Protection Act, 2023.
          </p>
        </Clause>

        <Clause id="changes" number="7" title="Changes">
          <p>
            If this policy changes in a way that affects what we collect or who
            sees it, the date at the top changes and anyone with an account is
            emailed. Small clarifications get a new date and nothing more.
          </p>
          <p>
            Warranty, returns and delivery are covered separately in the{" "}
            <LocalizedClientLink href="/terms">
              terms of sale
            </LocalizedClientLink>
            .
          </p>
        </Clause>
      </div>
    </>
  )
}
