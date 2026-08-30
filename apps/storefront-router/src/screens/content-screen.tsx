import { PageShell } from "../../app/components/page-shell"
import Shipping from "../../app/legacy/next-pages/[countryCode]/(main)/shipping-delivery/page"
import GettingStarted from "../../app/legacy/next-pages/[countryCode]/(main)/getting-started/page"
import Refunds from "../../app/legacy/next-pages/[countryCode]/(main)/refund-cancellations/page"
import Terms from "../../app/legacy/next-pages/[countryCode]/(main)/terms/page"
import Privacy from "../../app/legacy/next-pages/[countryCode]/(main)/privacy/page"
import Compatibility from "../../app/legacy/next-pages/[countryCode]/(main)/compatibility/page"
import Contact from "../../app/legacy/next-pages/[countryCode]/(main)/contact/page"

const pages = { Shipping, GettingStarted, Refunds, Terms, Privacy, Compatibility, Contact }

export function ContentScreen({ page }: { page: keyof typeof pages }) {
  const Component = pages[page]
  return <PageShell><Component /></PageShell>
}
