import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import FeaturedProducts from "@modules/home/components/featured-products"

/**
 * Owns the home page's only data dependency.
 *
 * The page used to await the region and collections at the top level, which
 * held back the hero, the FAQ and every other static section — none of which
 * need data — until both fetches returned. Keeping the awaits in here lets the
 * page render immediately and this section stream in behind its own skeleton.
 */
export default async function FeaturedProductsSection({
  countryCode,
}: {
  countryCode: string
}) {
  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!region || !collections?.length) {
    return null
  }

  return (
    <ul className="flex flex-col">
      <FeaturedProducts collections={collections} region={region} />
    </ul>
  )
}
