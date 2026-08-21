import StatusPage from "@modules/common/components/status-page"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page not found",
}

export default function NotFound() {
  return (
    <StatusPage eyebrow="404" title="That page is not here.">
      <p>
        The link may be old, or the thing it pointed at may have been renamed.
        Both of the routes below still work.
      </p>
    </StatusPage>
  )
}
