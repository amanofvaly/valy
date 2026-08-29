"use client"

import { signup } from "@lib/data/customer-actions"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState } from "react"

/**
 * Create an account.
 *
 * The consent line linked to `/content/privacy-policy`, which does not exist.
 * It points at the real page now.
 */
const Register = ({
  setCurrentView,
}: {
  setCurrentView: (view: LOGIN_VIEW) => void
}) => {
  const [message, formAction] = useActionState(signup, null)

  return (
    <div
      className="flex w-full max-w-sm flex-col gap-6"
      data-testid="register-page"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Create an account
        </h1>
        <p className="text-sm leading-6 text-muted">
          So your orders, invoices and test sheets stay in one place. Not
          required to buy anything.
        </p>
      </div>

      {message?.state === "verification_required" && (
        <p
          className="rounded border border-line bg-surface p-3 text-sm leading-6 text-ink"
          data-testid="register-verification-message"
        >
          We sent a verification link to <strong>{message.email}</strong>. Check
          your inbox to verify your email, then sign in.
        </p>
      )}

      <form className="flex flex-col gap-4" action={formAction}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label="Last name"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
        </div>
        <Input
          label="Email"
          name="email"
          required
          type="email"
          autoComplete="email"
          data-testid="email-input"
        />
        <Input
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          hint="Only used for the delivery, by the courier."
          data-testid="phone-input"
        />
        <Input
          label="Password"
          name="password"
          required
          type="password"
          autoComplete="new-password"
          data-testid="password-input"
        />

        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="register-error"
        />

        <p className="text-xs leading-5 text-muted">
          Creating an account means you accept our{" "}
          <LocalizedClientLink
            href="/privacy"
            className="text-accent hover:text-accent-strong"
          >
            privacy policy
          </LocalizedClientLink>{" "}
          and{" "}
          <LocalizedClientLink
            href="/terms"
            className="text-accent hover:text-accent-strong"
          >
            terms of sale
          </LocalizedClientLink>
          .
        </p>

        <SubmitButton
          variant="action"
          size="large"
          className="w-full"
          data-testid="register-button"
        >
          Create account
        </SubmitButton>
      </form>

      <p className="text-sm text-muted">
        Already have one?{" "}
        <button
          type="button"
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="pressable rounded text-accent hover:text-accent-strong"
        >
          Sign in
        </button>
        .
      </p>
    </div>
  )
}

export default Register
