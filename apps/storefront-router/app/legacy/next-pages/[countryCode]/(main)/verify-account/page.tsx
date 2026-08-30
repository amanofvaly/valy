import { Metadata } from "next"
import { Suspense } from "react"

import VerifyAccount from "@modules/account/components/verify-account"

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Verify your email address to complete your registration.",
}

export default function VerifyAccountPage() {
  return (
    <div className="container-page flex justify-center py-12 lg:py-20">
      <Suspense
        fallback={
          <p className="text-base text-muted">Checking that link…</p>
        }
      >
        <VerifyAccount />
      </Suspense>
    </div>
  )
}
