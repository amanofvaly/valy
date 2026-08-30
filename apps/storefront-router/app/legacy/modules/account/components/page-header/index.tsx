/**
 * The heading for one page inside the account.
 *
 * The three of these were `text-3xl font-semibold` with a paragraph of stock
 * starter copy underneath — one promising exchanges the store does not offer,
 * another offering a password form that is commented out. Same shape now, and
 * the description is optional because most of these pages do not need one.
 */
const AccountPageHeader = ({
  title,
  description,
}: {
  title: string
  description?: string
}) => (
  <header className="mb-8 flex flex-col gap-2">
    <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
    {description && (
      <p className="max-w-prose text-sm leading-6 text-muted">{description}</p>
    )}
  </header>
)

export default AccountPageHeader
