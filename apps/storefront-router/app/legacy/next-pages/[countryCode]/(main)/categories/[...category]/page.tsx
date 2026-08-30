import { getCategoryByHandle } from "@lib/data/categories"
import { parseOptionValueIds } from "@lib/util/product-option-filters"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { Metadata } from "next"
import { notFound } from "next/navigation"

/**
 * A category page.
 *
 * Dynamic, and reading live. `generateStaticParams` used to sit here building a
 * list of handles for a prerender that never happened — the route is dynamic
 * regardless, because the catalogue is read per request.
 *
 * `getCategoryByHandle` is wrapped in `React.cache`, so the two calls below —
 * one for the title, one for the page — are one request to the backend.
 */

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<
    Record<string, string | string[] | undefined> & {
      sortBy?: SortOptions
      page?: string
      optionValueIds?: string | string[]
    }
  >
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { category } = await props.params
  const productCategory = await getCategoryByHandle(category)

  if (!productCategory) {
    notFound()
  }

  return {
    title: productCategory.name,
    description:
      productCategory.description ??
      `${productCategory.name} from Valy, built and supported in India.`,
    alternates: { canonical: `/categories/${category.join("/")}` },
  }
}

export default async function CategoryPage(props: Props) {
  const [{ category, countryCode }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ])

  const productCategory = await getCategoryByHandle(category)

  if (!productCategory) {
    notFound()
  }

  return (
    <CategoryTemplate
      category={productCategory}
      sortBy={searchParams.sortBy}
      page={searchParams.page}
      countryCode={countryCode}
      optionValueIds={parseOptionValueIds(searchParams)}
    />
  )
}
