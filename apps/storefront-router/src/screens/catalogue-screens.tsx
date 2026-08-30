import type { HttpTypes } from "@medusajs/types"
import { useQuery } from "@tanstack/react-query"
import { PageShell } from "../../app/components/page-shell"
import CategoryTemplate from "@modules/categories/templates"
import CollectionTemplate from "@modules/collections/templates"
import ProductTemplate from "@modules/products/templates"
import StoreTemplate from "@modules/store/templates"
import { productExtrasQuery } from "../data/catalogue"

export type BrowseData = {
  products: HttpTypes.StoreProduct[]
  count: number
  facets: any[]
  categories: HttpTypes.StoreProductCategory[]
}

type BrowseProps = {
  data: BrowseData
  countryCode: string
  sortBy?: string
  page?: string
  optionValueIds?: string[]
}

export function StoreScreen({ data, countryCode, sortBy, page, optionValueIds }: BrowseProps) {
  return (
    <PageShell>
      <StoreTemplate
        countryCode={countryCode}
        sortBy={sortBy as never}
        page={page}
        optionValueIds={optionValueIds as never}
        {...data}
      />
    </PageShell>
  )
}

export function CategoryScreen({ category, data, countryCode, sortBy, page, optionValueIds }: BrowseProps & {
  category: HttpTypes.StoreProductCategory
}) {
  return (
    <PageShell>
      <CategoryTemplate
        category={category}
        countryCode={countryCode}
        sortBy={sortBy as never}
        page={page}
        optionValueIds={optionValueIds as never}
        {...data}
      />
    </PageShell>
  )
}

export function CollectionScreen({ collection, data, countryCode, sortBy, page, optionValueIds }: BrowseProps & {
  collection: HttpTypes.StoreCollection
}) {
  return (
    <PageShell>
      <CollectionTemplate
        collection={collection}
        countryCode={countryCode}
        sortBy={sortBy as never}
        page={page}
        optionValueIds={optionValueIds as never}
        {...data}
      />
    </PageShell>
  )
}

export function ProductScreen({ product, region, countryCode, variantId }: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  variantId?: string
}) {
  const { data: extras } = useQuery(productExtrasQuery({ countryCode, handle: product.handle! }))
  const variant = product.variants?.find((item) => item.id === variantId)
  const ids = new Set(variant?.images?.map((image) => image.id) || [])
  const images = ids.size ? product.images?.filter((image) => ids.has(image.id)) : product.images
  return (
    <PageShell>
      <ProductTemplate product={product} region={region} countryCode={countryCode} images={images || []} extras={extras} />
    </PageShell>
  )
}
