import StatusPage from "@modules/common/components/status-page"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cart not found",
}

export default function NotFound() {
  return (
    <StatusPage eyebrow="Cart" title="We could not find that cart.">
      <p>
        It has probably expired — an untouched cart is cleared after a week.
        Nothing was charged and nothing was reserved.
      </p>
    </StatusPage>
  )
}
