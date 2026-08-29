"use client"

import useToggleState from "@lib/hooks/use-toggle-state"
import { cn } from "@lib/util/cn"
import { Button } from "@modules/common/components/ui"
import { useEffect } from "react"
import { useFormStatus } from "react-dom"

/**
 * One editable field on the profile page.
 *
 * This used three separate Headless UI `Disclosure`s purely as animated boxes —
 * none of them was ever opened by its own button, and each rendered a
 * permanently-mounted panel collapsed to `max-h-0`, which keeps its contents in
 * the accessibility tree and reachable by tab while invisible. Success and error
 * messages are now conditionally rendered and announced.
 */

type AccountInfoProps = {
  label: string
  currentInfo: string | React.ReactNode
  isSuccess?: boolean
  isError?: boolean
  errorMessage?: string
  clearState: () => void
  children?: React.ReactNode
  "data-testid"?: string
}

const AccountInfo = ({
  label,
  currentInfo,
  isSuccess,
  isError,
  clearState,
  errorMessage = "That did not save. Please try again.",
  children,
  "data-testid": dataTestid,
}: AccountInfoProps) => {
  const { state, close, toggle } = useToggleState()
  const { pending } = useFormStatus()

  const handleToggle = () => {
    clearState()
    setTimeout(() => toggle(), 100)
  }

  useEffect(() => {
    if (isSuccess) {
      close()
    }
  }, [isSuccess, close])

  return (
    <div
      className="flex flex-col gap-3 border-b border-line py-5"
      data-testid={dataTestid}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs text-muted">{label}</span>
          {typeof currentInfo === "string" ? (
            <span className="text-sm text-ink" data-testid="current-info">
              {currentInfo}
            </span>
          ) : (
            currentInfo
          )}
        </div>

        <Button
          variant="secondary"
          size="small"
          onClick={handleToggle}
          type={state ? "reset" : "button"}
          data-testid="edit-button"
          data-active={state}
          className="shrink-0"
        >
          {state ? "Cancel" : "Edit"}
        </Button>
      </div>

      {isSuccess && (
        <p
          role="status"
          className="rounded border border-signal bg-signal-wash px-3 py-2 text-xs text-signal"
          data-testid="success-message"
        >
          {label} updated.
        </p>
      )}

      {isError && (
        <p
          role="alert"
          className="rounded border border-danger bg-danger-wash px-3 py-2 text-xs text-danger"
          data-testid="error-message"
        >
          {errorMessage}
        </p>
      )}

      <div className={cn("flex-col gap-4 pt-1", state ? "flex" : "hidden")}>
        {children}
        <div className="flex justify-end">
          <Button
            variant="action-outline"
            isLoading={pending}
            type="submit"
            data-testid="save-button"
            className="w-full sm:w-auto"
          >
            Save changes
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AccountInfo
