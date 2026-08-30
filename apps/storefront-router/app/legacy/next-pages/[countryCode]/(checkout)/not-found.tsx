import StatusPage from "@modules/common/components/status-page"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page not found",
}

export default function NotFound() {
  return (
    <StatusPage eyebrow="404" title="There is nothing to check out.">
      <p>
        Your cart is empty, or the session it belonged to has expired. Nothing
        has been charged.
      </p>
    </StatusPage>
  )
}
