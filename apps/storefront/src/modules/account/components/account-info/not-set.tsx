/**
 * What an unset profile field looks like.
 *
 * Every one of these was interpolated straight into a template literal —
 * `${customer.phone}`, `${customer.first_name} ${customer.last_name}` — so a
 * customer record without them rendered the literal string "null", or "null
 * null" for the name. An admin user linked to a customer record reproduces it
 * immediately, because those columns are empty.
 *
 * Absent is not a value, so it does not get the value's typography.
 */
const NotSet = ({ children = "Not set" }: { children?: React.ReactNode }) => (
  <span className="text-sm italic text-muted" data-testid="current-info">
    {children}
  </span>
)

export default NotSet
