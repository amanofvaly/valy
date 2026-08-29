"use client"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { setShippingMethod } from "@lib/data/cart-actions"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import {
  formatDeliveryEstimate,
  getShippingAvailability,
  ShippingAvailability,
} from "@lib/util/shipping-availability"
import { Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import StepActions from "@modules/checkout/components/step-actions"
import Step from "@modules/checkout/components/step"
import MedusaRadio from "@modules/common/components/radio"
import { Button, clx } from "@modules/common/components/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

function formatAddress(address: HttpTypes.StoreCartAddress) {
  if (!address) {
    return ""
  }

  let ret = ""

  if (address.address_1) {
    ret += ` ${address.address_1}`
  }

  if (address.address_2) {
    ret += `, ${address.address_2}`
  }

  if (address.postal_code) {
    ret += `, ${address.postal_code} ${address.city}`
  }

  if (address.country_code) {
    ret += `, ${address.country_code.toUpperCase()}`
  }

  return ret
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)

  const [showPickupOptions, setShowPickupOptions] =
    useState<string>(PICKUP_OPTION_OFF)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, ShippingAvailability>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  const _shippingMethods = availableShippingMethods?.filter(
    (sm) =>
      (
        sm as unknown as {
          service_zone?: {
            fulfillment_set?: {
              type?: string
              location?: { address: HttpTypes.StoreCartAddress }
            }
          }
        }
      ).service_zone?.fulfillment_set?.type !== "pickup" &&
      // An option whose fulfillment provider is no longer registered can never
      // be fulfilled, so it is pure noise for the customer. The admin health
      // check is what surfaces it to the merchant.
      (sm as unknown as { provider?: { is_enabled?: boolean } }).provider
        ?.is_enabled !== false
  )

  const _pickupMethods = availableShippingMethods?.filter(
    (sm) =>
      (
        sm as unknown as {
          service_zone?: {
            fulfillment_set?: {
              type?: string
              location?: { address: HttpTypes.StoreCartAddress }
            }
          }
        }
      ).service_zone?.fulfillment_set?.type === "pickup"
  )

  const hasPickupOptions = !!_pickupMethods?.length

  // An option is rendered when we have an affirmative price for it — never
  // before. Rendering everything and then removing what fails is what put a
  // Local Delivery row on screen for a frame before it vanished: a promise made
  // and withdrawn. Nothing here is speculative, so nothing has to be retracted.
  const selectableShippingMethods = _shippingMethods?.filter(
    (option) => getShippingAvailability(option, calculatedPricesMap).available
  )

  // Still waiting on a quote for at least one option we have not resolved yet.
  const isResolving =
    isLoadingPrices &&
    !!_shippingMethods?.some(
      (o) => o.price_type === "calculated" && !calculatedPricesMap[o.id]
    )

  // When nothing is deliverable, say why in the customer's terms. An address we
  // cannot price against is their problem to fix; anything else is ours.
  const blockingReason = _shippingMethods
    ?.map((o) => getShippingAvailability(o, calculatedPricesMap))
    .find(
      (a): a is Extract<ShippingAvailability, { available: false }> =>
        !a.available && a.reason === "address_incomplete"
    )

  useEffect(() => {
    const calculated =
      _shippingMethods?.filter((sm) => sm.price_type === "calculated") ?? []

    // Nothing to price — do not leave the UI stuck on a spinner.
    if (!calculated.length) {
      setCalculatedPricesMap({})
      setIsLoadingPrices(false)
    } else {
      setIsLoadingPrices(true)

      Promise.all(
        calculated.map((sm) => calculatePriceForShippingOption(sm.id, cart.id))
      )
        .then((results) => {
          const pricesMap: Record<string, ShippingAvailability> = {}
          results.forEach((r) => {
            pricesMap[r.id] = r.availability
          })
          setCalculatedPricesMap(pricesMap)
        })
        .finally(() => setIsLoadingPrices(false))
    }

    if (_pickupMethods?.find((m) => m.id === shippingMethodId)) {
      setShowPickupOptions(PICKUP_OPTION_ON)
    }
  }, [availableShippingMethods])

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const handleSetShippingMethod = async (
    id: string,
    variant: "shipping" | "pickup"
  ) => {
    setError(null)

    if (variant === "pickup") {
      setShowPickupOptions(PICKUP_OPTION_ON)
    } else {
      setShowPickupOptions(PICKUP_OPTION_OFF)
    }

    let currentId: string | null = null
    setIsLoading(true)
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setShippingMethodId(currentId)

        // Core's own wording for an unpriced option ("Shipping options with IDs
        // so_… do not have a price") is an internal detail. We now prevent
        // selecting those, so if one slips through, say something a customer
        // can act on.
        const raw = String(err?.message ?? "")
        setError(
          raw.includes("do not have a price")
            ? "This delivery option is not available for your address. Please choose another."
            : raw || "We could not set that delivery option. Please try again."
        )
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const savedMethod = cart.shipping_methods?.at(-1)

  return (
    <Step
      index={2}
      title="Delivery"
      step="delivery"
      complete={(cart.shipping_methods?.length ?? 0) > 0}
      enabled={
        !!cart?.shipping_address && !!cart?.billing_address && !!cart?.email
      }
      editTestId="edit-delivery-button"
    >
      {isOpen ? (
        <div className="flex flex-col gap-6">
          <div data-testid="delivery-options-container">
            {hasPickupOptions && (
              <RadioGroupPrimitive.Root
                value={showPickupOptions}
                onValueChange={(_value) => {
                  const id = _pickupMethods.find(
                    (option) => !option.insufficient_inventory
                  )?.id

                  if (id) {
                    handleSetShippingMethod(id, "pickup")
                  }
                }}
                className="mb-2 flex flex-col gap-2"
              >
                <RadioGroupPrimitive.Item
                  value={PICKUP_OPTION_ON}
                  data-testid="delivery-option-radio"
                  className={clx(
                    "pressable flex w-full items-center justify-between gap-4 rounded-lg border px-4 py-3.5 text-left",
                    showPickupOptions === PICKUP_OPTION_ON
                      ? "border-accent bg-accent-wash"
                      : "border-line hover:border-line-strong"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <MedusaRadio
                      checked={showPickupOptions === PICKUP_OPTION_ON}
                    />
                    <span className="text-sm text-ink">Pick up your order</span>
                  </span>
                  <span className="font-mono text-sm tabular text-muted">
                    &mdash;
                  </span>
                </RadioGroupPrimitive.Item>
              </RadioGroupPrimitive.Root>
            )}

            <RadioGroupPrimitive.Root
              value={shippingMethodId ?? ""}
              onValueChange={(v) => {
                if (v) {
                  return handleSetShippingMethod(v, "shipping")
                }
              }}
              className="flex flex-col gap-2"
            >
              {selectableShippingMethods?.map((option) => {
                const availability = getShippingAvailability(
                  option,
                  calculatedPricesMap
                )
                // Unreachable by construction — the list only holds
                // available options — but keeps the amount type-safe.
                if (!availability.available) return null

                const detail = [
                  formatDeliveryEstimate(availability.estimatedDays),
                  availability.courierName,
                ]
                  .filter(Boolean)
                  .join(" · ")

                return (
                  <RadioGroupPrimitive.Item
                    key={option.id}
                    value={option.id}
                    data-testid="delivery-option-radio"
                    className={clx(
                      "pressable flex w-full items-center justify-between gap-4 rounded-lg border px-4 py-3.5 text-left",
                      option.id === shippingMethodId
                        ? "border-accent bg-accent-wash"
                        : "border-line hover:border-line-strong"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <MedusaRadio checked={option.id === shippingMethodId} />
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm text-ink">{option.name}</span>
                        {/* Without this the tiers are two names and two
                            prices, and the extra cost buys nothing the
                            customer can see. */}
                        {detail && (
                          <span
                            className="text-xs text-muted"
                            data-testid="delivery-option-detail"
                          >
                            {detail}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-sm tabular text-ink">
                      {convertToLocale({
                        amount: availability.amount,
                        currency_code: cart?.currency_code,
                      })}
                    </span>
                  </RadioGroupPrimitive.Item>
                )
              })}
            </RadioGroupPrimitive.Root>

            {isResolving && !selectableShippingMethods?.length && (
              <div
                className="flex items-center gap-2 py-4 text-muted"
                data-testid="delivery-options-loading"
              >
                <Loader className="animate-spin" />
                <span className="text-sm">
                  Checking delivery options for your address…
                </span>
              </div>
            )}

            {!isResolving && !selectableShippingMethods?.length && (
              <div
                className="rounded-lg border border-line bg-surface px-4 py-3.5"
                data-testid="no-delivery-options-message"
              >
                <p className="text-sm font-medium text-ink">
                  {blockingReason
                    ? "We need your delivery address first."
                    : "We cannot deliver to this address right now."}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {blockingReason
                    ? blockingReason.message
                    : "Try a different delivery address, or contact us and we will sort it out for you."}
                </p>
              </div>
            )}
          </div>

          {showPickupOptions === PICKUP_OPTION_ON && (
            <div data-testid="delivery-options-container">
              <p className="mb-2 text-sm font-medium text-ink">
                Choose a store near you
              </p>
              <RadioGroupPrimitive.Root
                value={shippingMethodId ?? ""}
                onValueChange={(v) => {
                  if (v) {
                    return handleSetShippingMethod(v, "pickup")
                  }
                }}
                className="flex flex-col gap-2"
              >
                {_pickupMethods?.map((option) => (
                  <RadioGroupPrimitive.Item
                    key={option.id}
                    value={option.id}
                    disabled={option.insufficient_inventory}
                    data-testid="delivery-option-radio"
                    className={clx(
                      "pressable flex w-full items-start justify-between gap-4 rounded-lg border px-4 py-3.5 text-left",
                      option.id === shippingMethodId
                        ? "border-accent bg-accent-wash"
                        : "border-line hover:border-line-strong",
                      option.insufficient_inventory &&
                        "cursor-not-allowed opacity-45"
                    )}
                  >
                    <span className="flex items-start gap-3">
                      <MedusaRadio
                        checked={option.id === shippingMethodId}
                        disabled={option.insufficient_inventory}
                      />
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm text-ink">{option.name}</span>
                        <span className="text-xs text-muted">
                          {formatAddress(
                            (
                              option as unknown as {
                                service_zone?: {
                                  fulfillment_set?: {
                                    location?: {
                                      address: HttpTypes.StoreCartAddress
                                    }
                                  }
                                }
                              }
                            ).service_zone?.fulfillment_set?.location
                              ?.address as HttpTypes.StoreCartAddress
                          )}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-sm tabular text-ink">
                      {convertToLocale({
                        amount: option.amount!,
                        currency_code: cart?.currency_code,
                      })}
                    </span>
                  </RadioGroupPrimitive.Item>
                ))}
              </RadioGroupPrimitive.Root>
            </div>
          )}

          <StepActions>
            <Button
              variant="action"
              size="large"
              block
              className="lg:w-auto"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!cart.shipping_methods?.[0]}
              data-testid="submit-delivery-option-button"
            >
              Continue to payment
            </Button>
            <ErrorMessage
              error={error}
              data-testid="delivery-option-error-message"
            />
          </StepActions>
        </div>
      ) : (
        savedMethod && (
          <div className="flex flex-col gap-0.5">
            {/* The chosen method is its own heading. A "Method" label above
                it only restates what the value already says. */}
            <p className="text-sm font-medium text-ink">
              {savedMethod.name}{" "}
              <span className="font-mono tabular text-muted">
                {convertToLocale({
                  amount: savedMethod.amount!,
                  currency_code: cart?.currency_code,
                })}
              </span>
            </p>
            {/* The carrier and estimate are part of what was chosen, so the
                saved state shows the same promise the option did — read from
                the method itself, not recomputed. */}
            {(() => {
              const methodData = savedMethod.data as {
                courier_name?: string
                estimated_delivery_days?: number
              } | null
              const detail = [
                formatDeliveryEstimate(methodData?.estimated_delivery_days),
                methodData?.courier_name,
              ]
                .filter(Boolean)
                .join(" · ")

              return detail ? (
                <p
                  className="text-xs text-muted"
                  data-testid="delivery-option-detail"
                >
                  {detail}
                </p>
              ) : null
            })()}
          </div>
        )
      )}
    </Step>
  )
}

export default Shipping
