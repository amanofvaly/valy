/**
 * A failure the customer has to read. `role="alert"` so a screen reader
 * announces it — a checkout error that only exists visually is a dead end for
 * anyone not looking at that part of the page.
 */
const ErrorMessage = ({
  error,
  "data-testid": dataTestid,
}: {
  error?: string | null
  "data-testid"?: string
}) => {
  if (!error) {
    return null
  }

  return (
    <p
      role="alert"
      className="mt-2 rounded border border-danger bg-danger-wash px-3 py-2 text-xs leading-5 text-danger"
      data-testid={dataTestid}
    >
      {error}
    </p>
  )
}

export default ErrorMessage
