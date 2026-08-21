"use client"

import { addToCart } from "@lib/data/cart-actions"
import { useIntersection } from "@lib/hooks/use-in-view"
import { cn } from "@lib/util/cn"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { useOptimisticCart } from "@modules/cart/context/optimistic-cart"
import { Button } from "@modules/common/components/ui"
import { isEqual } from "lodash"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import OptionSelect from "./option-select"

/**
 * The configurator and the buy button.
 *
 * Everything a configuration change affects — the price, the specification, the
 * variant image — is already on the client, so changing an option redraws
 * immediately with no round trip. Only the *result* of adding to cart needs the
 * server.
 *
 * Adding is optimistic: the badge in the header increments and the button flips
 * to "Added" on the press. If the server refuses, the failure is shown here in
 * words rather than the button quietly returning to its old state, because a
 * silent revert is indistinguishable from a missed tap.
 */

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region?: HttpTypes.StoreRegion
  disabled?: boolean
  /** Rendered between the options and the button — the services add-on step. */
  children?: React.ReactNode
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) =>
  variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) {
      acc[varopt.option_id] = varopt.value
    }
    return acc
  }, {}) ?? {}

const variantInStock = (variant?: HttpTypes.StoreProductVariant) => {
  if (!variant) {
    return false
  }
  if (!variant.manage_inventory || variant.allow_backorder) {
    return true
  }
  return (variant.inventory_quantity ?? 0) > 0
}

export default function ProductActions({
  product,
  disabled,
  children,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const countryCode = useParams().countryCode as string
  const { addOptimistic, isPending } = useOptimisticCart()

  const variants = useMemo(() => product.variants ?? [], [product.variants])
  // Memoised for the same reason as `variants`: a fresh `[]` on every render
  // would invalidate both option-availability memos below on every keystroke.
  const options = useMemo(() => product.options ?? [], [product.options])

  const [selection, setSelection] = useState<Record<string, string | undefined>>(
    () => (variants.length === 1 ? optionsAsKeymap(variants[0].options) : {})
  )
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedVariant = useMemo(
    () =>
      variants.find((v) => isEqual(optionsAsKeymap(v.options), selection)),
    [variants, selection]
  )

  /**
   * For each option, which of its values still lead to a real variant given
   * everything else currently chosen — and which of those have no stock. This
   * is what lets the picker mark a dead end instead of letting someone build a
   * configuration that does not exist and only find out at the button.
   */
  /**
   * Which values this product actually offers per option. A shared option is a
   * catalogue-wide facet whose `values` list spans every product using it, so
   * reading it directly would offer 2GB of RAM on a machine that starts at 32.
   */
  const valuesByOption = useMemo(() => {
    const byOption: Record<string, string[]> = {}

    for (const option of options) {
      const seen = new Set<string>()
      for (const variant of variants) {
        const value = optionsAsKeymap(variant.options)[option.id]
        if (value) {
          seen.add(value)
        }
      }
      // Keep the option's own declared order rather than variant order, so the
      // ladder reads 8GB, 16GB, 32GB and not whatever order they were created.
      byOption[option.id] = (option.values ?? [])
        .map((v) => v.value)
        .filter((v) => seen.has(v))
    }

    return byOption
  }, [options, variants])

  const { availableByOption, soldOutByOption } = useMemo(() => {
    const available: Record<string, Set<string>> = {}
    const soldOut: Record<string, Set<string>> = {}

    for (const option of options) {
      const availableSet = new Set<string>()
      const stockedSet = new Set<string>()

      for (const variant of variants) {
        const keymap = optionsAsKeymap(variant.options)

        // Does this variant agree with every *other* option already chosen?
        const agreesElsewhere = Object.entries(selection).every(
          ([optionId, value]) =>
            optionId === option.id || !value || keymap[optionId] === value
        )

        if (!agreesElsewhere) {
          continue
        }

        const value = keymap[option.id]
        if (!value) {
          continue
        }

        availableSet.add(value)
        if (variantInStock(variant)) {
          stockedSet.add(value)
        }
      }

      available[option.id] = availableSet
      soldOut[option.id] = new Set(
        Array.from(availableSet).filter((v) => !stockedSet.has(v))
      )
    }

    return { availableByOption: available, soldOutByOption: soldOut }
  }, [options, variants, selection])

  const setOptionValue = (optionId: string, value: string) => {
    setError(null)
    setAdded(false)

    setSelection((previous) => {
      const next = { ...previous, [optionId]: value }

      // Choosing a value that conflicts with an earlier choice must not produce
      // a configuration that matches nothing. Drop whichever other selections
      // no longer combine, so the picker resolves forward rather than locking.
      const stillPossible = variants.some((v) => {
        const keymap = optionsAsKeymap(v.options)
        return Object.entries(next).every(
          ([id, val]) => !val || keymap[id] === val
        )
      })

      if (stillPossible) {
        return next
      }

      const fallback = variants.find(
        (v) => optionsAsKeymap(v.options)[optionId] === value
      )

      return fallback ? optionsAsKeymap(fallback.options) : next
    })
  }

  /**
   * The `v_id` search param drives `getImagesForVariant` on the server, so the
   * gallery shows the machine that is actually configured. `replace` rather
   * than `push` keeps the back button pointing at the page the visitor arrived
   * from rather than at each option they tried.
   */
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = selectedVariant?.id ?? null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [selectedVariant?.id, pathname, router, searchParams])

  const inStock = variantInStock(selectedVariant)
  const chosenEverything = options.every((o) => !!selection[o.id])

  /*
   * On a phone the real buy button sits below the gallery, the description and
   * the configurator, so it spends most of the page off screen. This tracks it
   * and puts the same button — same handler, same state, not a second
   * implementation — in a bar at the bottom once it scrolls away.
   */
  const buyRef = useRef<HTMLDivElement>(null)
  const buyInView = useIntersection(buyRef, "0px")

  /** The configured price, formatted once for the sticky bar. */
  const stickyPrice = useMemo(
    () =>
      getProductPrice({ product, variantId: selectedVariant?.id }).variantPrice
        ?.calculated_price ?? "",
    [product, selectedVariant?.id]
  )

  const handleAddToCart = () => {
    if (!selectedVariant?.id) {
      return
    }

    setError(null)
    setAdded(true)

    addOptimistic(1, async () => {
      try {
        await addToCart({
          variantId: selectedVariant.id,
          quantity: 1,
          countryCode,
        })
      } catch (e) {
        // Visible, not silent. A revert with no explanation reads as a missed
        // tap, and the shopper presses again.
        setAdded(false)
        setError(
          e instanceof Error
            ? e.message
            : "We could not add that to your cart. Please try again."
        )
      }
    })
  }

  const label = !chosenEverything
    ? "Choose a configuration"
    : !selectedVariant
      ? "That combination is not built"
      : !inStock
        ? "Out of stock"
        : added
          ? "Added to cart"
          : "Add to cart"

  return (
    <div className="flex flex-col gap-6" data-testid="product-actions">
      {options.length > 0 && variants.length > 1 && (
        <div className="flex flex-col gap-6">
          {options.map((option) => (
            <OptionSelect
              key={option.id}
              option={option}
              values={valuesByOption[option.id] ?? []}
              title={option.title ?? ""}
              current={selection[option.id]}
              updateOption={setOptionValue}
              availableValues={availableByOption[option.id]}
              soldOutValues={soldOutByOption[option.id]}
              disabled={!!disabled}
              data-testid="product-options"
            />
          ))}
        </div>
      )}

      {children}

      <div ref={buyRef} className="flex flex-col gap-3 border-t border-line pt-5">
        <ProductPrice product={product} variant={selectedVariant} />

        <Button
          size="large"
          block
          onClick={handleAddToCart}
          disabled={!selectedVariant || !inStock || !!disabled}
          data-testid="add-product-button"
          className={cn(added && "bg-signal hover:bg-signal")}
        >
          {label}
        </Button>

        {error && (
          <p
            role="alert"
            className="rounded border border-danger bg-danger-wash px-3 py-2 text-xs text-danger"
            data-testid="add-to-cart-error"
          >
            {error}
          </p>
        )}

        {selectedVariant && inStock && !error && (
          <p className="text-2xs text-muted">
            {selectedVariant.sku && (
              <span className="font-mono">{selectedVariant.sku} · </span>
            )}
            Price includes GST. Shipping calculated at checkout.
          </p>
        )}

        {isPending && (
          <span className="sr-only" role="status">
            Adding to cart
          </span>
        )}
      </div>

      {/*
       * The same button, kept in reach. `sr-only` on the duplicate would put two
       * "Add to cart" controls in the accessibility tree, so this one is hidden
       * from it — the real one above is always reachable by keyboard.
       */}
      {!buyInView && selectedVariant && (
        <div
          aria-hidden="true"
          className={cn(
            "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur",
            "flex items-center gap-3 px-5 py-3 lg:hidden",
            "pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          )}
        >
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-2xs text-muted">
              {product.title}
            </span>
            <span className="font-mono text-sm font-medium tabular text-ink">
              {stickyPrice}
            </span>
          </div>

          <Button
            size="large"
            onClick={handleAddToCart}
            disabled={!inStock || !!disabled}
            tabIndex={-1}
            className={cn("ml-auto shrink-0", added && "bg-signal hover:bg-signal")}
          >
            {added ? "Added" : inStock ? "Add to cart" : "Out of stock"}
          </Button>
        </div>
      )}
    </div>
  )
}
