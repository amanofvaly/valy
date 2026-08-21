import { getCollectionByHandle } from "@lib/data/collections"
import { parseOptionValueIds } from "@lib/util/product-option-filters"
import CollectionTemplate from "@modules/collections/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { Metadata } from "next"
import { notFound } from "next/navigation"

/**
 * A curated set. Dynamic and read live, like every other catalogue route —
 * a collection published in admin is reachable on the next request.
 *
 * The two `getCollectionByHandle` calls below collapse into one backend
 * request: it is wrapped in `React.cache`, which deduplicates within a request.
 */

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<
    Record<string, string | string[] | undefined> & {
      page?: string
      sortBy?: SortOptions
      optionValueIds?: string | string[]
    }
  >
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { handle } = await props.params
  const collection = await getCollectionByHandle(handle)

  if (!collection) {
    notFound()
  }

  return {
    title: collection.title,
    description: `${collection.title} — machines, parts and services picked to go together.`,
    alternates: { canonical: `/collections/${handle}` },
  }
}

export default async function CollectionPage(props: Props) {
  const [{ handle, countryCode }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ])

  const collection = await getCollectionByHandle(handle)

  if (!collection) {
    notFound()
  }

  return (
    <CollectionTemplate
      collection={collection}
      page={searchParams.page}
      sortBy={searchParams.sortBy}
      countryCode={countryCode}
      optionValueIds={parseOptionValueIds(searchParams)}
    />
  )
}
