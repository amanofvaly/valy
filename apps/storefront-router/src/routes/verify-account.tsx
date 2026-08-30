import { createFileRoute } from "@tanstack/react-router"
import { PageShell } from "../../app/components/page-shell"
import VerifyAccount from "@modules/account/components/verify-account"

export const Route = createFileRoute("/verify-account")({
  head: () => ({ meta: [
    { title: "Verify your email · Valy" },
    { name: "description", content: "Verify your email address to complete your registration." },
  ] }),
  component: VerifyAccountRoute,
})

function VerifyAccountRoute() {
  return (
    <PageShell>
      <div className="container-page flex justify-center py-12 lg:py-20">
        <VerifyAccount />
      </div>
    </PageShell>
  )
}
