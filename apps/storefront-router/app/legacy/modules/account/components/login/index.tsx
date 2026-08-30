"use client"

import { login } from "@lib/data/customer-actions"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useParams } from "next/navigation"
import { useActionState } from "react"

/**
 * Sign in.
 *
 * The old copy offered "an enhanced shopping experience", which is not a
 * reason. The reasons are that the address fills itself in and the orders stay
 * findable, so those are what it says.
 */
const Login = ({
  setCurrentView,
  redirectTo,
}: {
  setCurrentView: (view: LOGIN_VIEW) => void
  /** A path on this site, without the country prefix. */
  redirectTo?: string
}) => {
  const { countryCode } = useParams() as { countryCode?: string }
  const [message, formAction] = useActionState(login, null)

  return (
    <div
      className="flex w-full max-w-sm flex-col gap-6"
      data-testid="login-page"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Sign in
        </h1>
        <p className="text-sm leading-6 text-muted">
          Your orders, your saved addresses, and the test sheet for every
          machine you have bought.
        </p>
      </div>

      {message?.state === "verification_required" && (
        <p
          className="rounded border border-line bg-surface p-3 text-sm leading-6 text-ink"
          data-testid="login-verification-message"
        >
          We sent a verification link to <strong>{message.email}</strong>.
          Verify your email, then sign in.
        </p>
      )}

      <form className="flex flex-col gap-4" action={formAction}>
        {/*
         * Localised here rather than by the caller: the prompt that sent us
         * knows which page it wants back, and this form knows which country's
         * copy of it the customer is in.
         */}
        {redirectTo && (
          <input
            type="hidden"
            name="redirect"
            value={countryCode ? `/${countryCode}${redirectTo}` : redirectTo}
          />
        )}

        <Input
          label="Email"
          name="email"
          type="email"
          title="Enter a valid email address."
          autoComplete="email"
          required
          data-testid="email-input"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          data-testid="password-input"
        />

        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="login-error-message"
        />

        <SubmitButton
          variant="action"
          size="large"
          data-testid="sign-in-button"
          className="w-full"
        >
          Sign in
        </SubmitButton>
      </form>

      <p className="text-sm text-muted">
        No account yet?{" "}
        <button
          type="button"
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="pressable rounded text-accent hover:text-accent-strong"
          data-testid="register-button"
        >
          Create one
        </button>
        . You can also check out without one.
      </p>
    </div>
  )
}

export default Login
