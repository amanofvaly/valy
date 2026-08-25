import { parseOptionValueIds } from "@lib/util/product-option-filters"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "All Products",
  description:
    "Preconfigured servers, storage, cases, network parts, and a lot more to setup your homelab.",
}

type Props = {
  searchParams: Promise<
    Record<string, string | string[] | undefined> & {
      sortBy?: SortOptions
      page?: string
      optionValueIds?: string | string[]
    }
  >
  params: Promise<{ countryCode: string }>
}

export default async function StorePage(props: Props) {
  const [{ countryCode }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ])

  return (
    <StoreTemplate
      sortBy={searchParams.sortBy}
      page={searchParams.page}
      countryCode={countryCode}
      optionValueIds={parseOptionValueIds(searchParams)}
    />
  )
}
