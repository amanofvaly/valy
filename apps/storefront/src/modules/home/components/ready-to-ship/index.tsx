import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import CtaLink from "@modules/home/components/cta-link"
import SectionHeading from "@modules/home/components/section-heading"
import ProductPreview from "@modules/products/components/product-preview"

export default async function ReadyToShip({
  countryCode,
}: {
  countryCode: string
}) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams: { limit: 4, fields: "*variants.calculated_price" },
  })

  if (!products.length) {
    return null
  }

  return (
    <section className="border-t border-zinc-200 bg-zinc-50 py-16 lg:py-24">
      <div className="content-container flex flex-col gap-12">
        <SectionHeading
          eyebrow="On the shelf"
          title="Ready to ship this week."
          description="Built, burned in, and boxed. Order before 2 PM IST on a working day and it leaves the bench the same evening."
        >
          <CtaLink href="/store" variant="ghost">
            See everything
          </CtaLink>
        </SectionHeading>

        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} isFeatured />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
