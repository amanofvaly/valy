import { HttpTypes } from "@medusajs/types"
import { OptionValueIds } from "@lib/util/product-option-filters"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BrowseFrame from "@modules/store/components/browse-frame"
import RefinementList, {
  RefinementSheet,
} from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { Suspense } from "react"
import CategoryRail, {
  CategoryRailFallback,
} from "@modules/store/components/category-rail"
import CategoryStrip from "@modules/store/components/category-strip"
import OptionsPicker from "@modules/store/components/refinement-list/options-picker"
import PaginatedProducts from "./paginated-products"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

/**
 * One browse page, used by `/store`, every category and every collection.
 *
 *
 * Everything above the grid — heading, breadcrumb, description, subcategory
 * links, the filter rail — is structure the server sends immediately. Only the
 * grid waits on a priced product query, behind its own boundary.
 */

export type Crumb = { label: string; href?: string }

type BrowsePageProps = {
  title: string
  description?: string | null
  crumbs?: Crumb[]
  /** Rendered under the description — subcategories, or a curated intro. */
  children?: React.ReactNode
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
  categoryId?: string
  /** Handle of the category being viewed, so the rail can mark it. */
  categoryHandle?: string
  /** `/store` renders the full category index instead, so it hides the rail. */
  hideCategoryRail?: boolean
  collectionId?: string
  hideOptionsPicker?: boolean
  "data-testid"?: string
  titleTestId?: string
  /* Read by the route loader; these used to be `async` components inside the
   * page, which cannot work outside RSC. */
  products?: HttpTypes.StoreProduct[]
  count?: number
  facets?: any[]
  categories?: HttpTypes.StoreProductCategory[]
}

export default function BrowsePage({
  title,
  description,
  crumbs = [],
  children,
  sortBy,
  page,
  countryCode,
  optionValueIds,
  categoryId,
  categoryHandle,
  hideCategoryRail = false,
  collectionId,
  hideOptionsPicker = false,
  "data-testid": dataTestId = "category-container",
  titleTestId,
  products = [],
  count = 0,
  facets = [],
  categories = [],
}: BrowsePageProps) {
  const pageNumber = page ? parseInt(page, 10) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="container-page py-8 lg:py-12" data-testid={dataTestId}>
      <header className="mb-8 flex flex-col gap-3 lg:mb-10">
        {!!crumbs.length && (
          <nav aria-label="Breadcrumb">
            {}
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              {[...crumbs, { label: title }].map((crumb, i) => (
                <li key={crumb.label} className="flex items-center gap-2">
                  {i > 0 && (
                    <span aria-hidden="true" className="text-line-strong">
                      /
                    </span>
                  )}
                  {"href" in crumb && crumb.href ? (
                    <LocalizedClientLink
                      href={crumb.href}
                      className="pressable rounded text-accent hover:text-accent-strong"
                      data-testid="sort-by-link"
                    >
                      {crumb.label}
                    </LocalizedClientLink>
                  ) : (
                    <span className="text-muted">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <h1
          className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
          data-testid={titleTestId}
        >
          {title}
        </h1>

        {description && (
          <p className="max-w-prose text-base leading-7 text-muted">
            {description}
          </p>
        )}

        {children}

        {/* Sideways navigation on a phone, where the rail is hidden. */}
        {categoryHandle && (
          <CategoryStrip activeHandle={categoryHandle} categories={categories} />
        )}
      </header>

      <BrowseFrame
        sortBy={sort}
        /*
         * Sort renders immediately; only the facets need the API, so they
         * stream into the rail that is already on screen. Awaiting them here
         * would hold back the heading, the breadcrumb and the filter rail —
         * the whole reason this page paints its structure first.
         */
        controls={
          <div className="flex flex-col gap-8">
            {!hideCategoryRail && (
              <CategoryRail activeHandle={categoryHandle} categories={categories} />
            )}

            <RefinementList
              hideOptionsPicker={hideOptionsPicker}
              data-testid="sort-by-container"
            >
              {!hideOptionsPicker && (
                <OptionsPicker facets={facets} />
              )}
            </RefinementList>
          </div>
        }
        mobileControls={
          <RefinementSheet hideOptionsPicker={hideOptionsPicker}>
            {!hideOptionsPicker && <OptionsPicker facets={facets} />}
          </RefinementSheet>
        }
      >
        {/*
         * Deliberately unkeyed. Keying this boundary by the current sort and
         * filters would remount it on every change, which is precisely the
         * skeleton swap that must not happen: React can only keep the previous
         * results on screen through a transition if the boundary is the same
         * one. The skeleton is therefore reserved for a genuine first load.
         */}
        <PaginatedProducts page={pageNumber} products={products} count={count} />
      </BrowseFrame>
    </div>
  )
}

/** The rail's own height while the facets arrive, so nothing below it moves. */
const FacetsFallback = () => (
  <div className="flex animate-pulse flex-col gap-4" aria-hidden="true">
    <div className="h-3 w-12 rounded bg-surface" />
    {[0, 1, 2].map((i) => (
      <div key={i} className="h-9 w-full rounded bg-surface" />
    ))}
  </div>
)
