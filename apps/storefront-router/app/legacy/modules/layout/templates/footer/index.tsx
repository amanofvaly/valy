import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ValyMark } from "@modules/common/components/valy-mark"
import { Envelope, Phone } from "@medusajs/icons"

/**
 * The footer.
 *
 * Categories and collections are read live so a new part category appears here
 * the moment it is published, without a redeploy. Both reads are unrelated, so
 * they go out together rather than one after the other.
 */

const CONTACT = [
  {
    label: "support@valy.in",
    href: "mailto:support@valy.in",
    Icon: Envelope,
  },
  {
    label: "+91 99717 79734",
    href: "tel:+919971779734",
    Icon: Phone,
  },
]

const POLICY_LINKS = [
  { href: "/refund-cancellations", label: "Refunds & Cancellations" },
  { href: "/shipping-delivery", label: "Shipping & Delivery" },
  { href: "/terms", label: "Terms of sale" },
  { href: "/privacy", label: "Privacy" },
]

export default async function Footer() {
  const [{ collections }, categories] = await Promise.all([
    listCollections(),
    listCategories(),
  ])

  const topLevel = categories.filter((c) => !c.parent_category_id)

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-10 py-14 sm:grid-cols-3 lg:grid-cols-5 lg:py-16">
        <div className="col-span-2 flex flex-col gap-3 sm:col-span-3 lg:col-span-1">
          <LocalizedClientLink
            href="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink"
          >
            <ValyMark className="h-5 w-5 shrink-0" />
            Valy Homelabs
          </LocalizedClientLink>
          <p className="max-w-xs text-sm leading-6 text-muted">
            Home Servers for everyone. Keep your photographs and your films and
            your work on hardware you own.
          </p>
          {/*
           * Contact sits with the brand rather than in a link column: it is the
           * one thing someone goes looking for, and the columns beside it are
           * catalogue and policy, which is neither.
           */}
          <ul className="mt-1 flex flex-col gap-2.5">
            {CONTACT.map(({ label, href, Icon }) => {
              const className =
                "pressable flex w-fit items-center gap-2 rounded text-sm text-ink"

              const content = (
                <>
                  <Icon aria-hidden className="shrink-0 text-muted" />
                  <span>{label}</span>
                </>
              )

              return (
                <li key={label}>
                  {href ? (
                    <a href={href} className={`${className} hover:text-accent`}>
                      {content}
                    </a>
                  ) : (
                    <div className={className}>{content}</div>
                  )}
                </li>
              )
            })}
          </ul>
          <LocalizedClientLink
            href="/contact"
            className="pressable w-fit rounded text-sm font-medium text-ink underline decoration-line-strong decoration-1 underline-offset-4 hover:text-accent hover:decoration-accent"
          >
            Contact us
          </LocalizedClientLink>
        </div>

        {!!topLevel.length && (
          <FooterColumn title="Catalogue" testId="footer-categories">
            {topLevel.map((category) => (
              <FooterLink
                key={category.id}
                href={`/categories/${category.handle}`}
                data-testid="category-link"
              >
                {category.name}
              </FooterLink>
            ))}
          </FooterColumn>
        )}

        {!!collections.length && (
          <FooterColumn title="Where to start">
            {collections.map((collection) => (
              <FooterLink
                key={collection.id}
                href={`/collections/${collection.handle}`}
              >
                {collection.title}
              </FooterLink>
            ))}
          </FooterColumn>
        )}

        <FooterColumn title="Policy">
          {POLICY_LINKS.map((link) => (
            <FooterLink key={link.href} href={link.href}>
              {link.label}
            </FooterLink>
          ))}
        </FooterColumn>
      </div>

      {/*
       * The four promises, restated where someone checks them: at the point of
       * deciding whether this is a real company. These four used to open the
       * homepage as well; that band now carries the argument instead, so this
       * is the only place on the site they are stated in short form.
       *
       * The icon credit sits with them because CC BY 4.0 requires attribution
       * and a colophon line is where a licence notice belongs — not beside the
       * marks themselves, which are decoration.
       */}
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-2xs text-muted">
            <li>Powered by Medusa, Cashfree, Shiprocket, Mastercard, ICICI Bank, TrueNAS</li>
            
          </ul>
          <p className="text-2xs text-muted">
             © {new Date().getFullYear()} Valy Homelabs
          </p>
        </div>
      </div>
    </footer>
  )
}

const FooterColumn = ({
  title,
  testId,
  children,
}: {
  title: string
  testId?: string
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-3">
    <h2 className="text-xs font-medium text-ink">{title}</h2>
    <ul className="flex flex-col gap-2.5" data-testid={testId}>
      {children}
    </ul>
  </div>
)

const FooterLink = ({
  href,
  children,
  ...props
}: {
  href: string
  children: React.ReactNode
  [x: string]: unknown
}) => (
  <li>
    <LocalizedClientLink
      href={href}
      className="text-sm text-muted hover:text-ink"
      {...props}
    >
      {children}
    </LocalizedClientLink>
  </li>
)
