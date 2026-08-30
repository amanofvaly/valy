import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"

/**
 * Offered, not required. Checkout works without an account; signing in saves
 * the address and keeps the order visible afterwards, which is the actual
 * reason to bother.
 */
const SignInPrompt = ({
  /** Path to return to after signing in, without the country prefix. */
  redirectTo,
}: {
  redirectTo?: string
} = {}) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-2.5">
    <p className="min-w-0 text-sm leading-5 text-muted">
      <span className="text-ink">Ordered before?</span> Sign in and your address
      fills itself in.
    </p>
    <Button asChild variant="secondary" size="small" className="shrink-0">
      <LocalizedClientLink
        href={
          redirectTo
            ? `/account?redirect=${encodeURIComponent(redirectTo)}`
            : "/account"
        }
        data-testid="sign-in-button"
      >
        Sign in
      </LocalizedClientLink>
    </Button>
  </div>
)

export default SignInPrompt
