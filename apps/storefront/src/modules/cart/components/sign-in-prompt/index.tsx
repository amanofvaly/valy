import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"

/**
 * Offered, not required. Checkout works without an account; signing in saves
 * the address and keeps the order visible afterwards, which is the actual
 * reason to bother.
 */
const SignInPrompt = () => (
  <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-medium text-ink">Already ordered from us?</p>
      <p className="text-sm text-muted">
        Sign in and your address fills itself in. You can check out without one.
      </p>
    </div>
    <Button asChild variant="secondary" className="shrink-0">
      <LocalizedClientLink href="/account" data-testid="sign-in-button">
        Sign in
      </LocalizedClientLink>
    </Button>
  </div>
)

export default SignInPrompt
