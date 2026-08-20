"use client"
import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import {
  formatDeliveryEstimate,
  getShippingAvailability,
  ShippingAvailability,
} from "@lib/util/shipping-availability"
import { CheckCircleSolid, Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import Divider from "@modules/common/components/divider"
import MedusaRadio from "@modules/common/components/radio"
import { Button, clx, Heading, Text } from "@modules/common/components/ui"
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
      (sm as unknown as { service_zone?: { fulfillment_set?: { type?: string; location?: { address: HttpTypes.StoreCartAddress } } } }).service_zone?.fulfillment_set?.type !== "pickup" &&
      // An option whose fulfillment provider is no longer registered can never
      // be fulfilled, so it is pure noise for the customer. The admin health
      // check is what surfaces it to the merchant.
      (sm as unknown as { provider?: { is_enabled?: boolean } }).provider
        ?.is_enabled !== false
  )

  const _pickupMethods = availableShippingMethods?.filter(
    (sm) => (sm as unknown as { service_zone?: { fulfillment_set?: { type?: string; location?: { address: HttpTypes.StoreCartAddress } } } }).service_zone?.fulfillment_set?.type === "pickup"
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

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

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

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
            }
          )}
        >
          Delivery
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircleSolid />
          )}
        </Heading>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                data-testid="edit-delivery-button"
              >
                Edit
              </button>
            </Text>
          )}
      </div>
      {isOpen ? (
        <>
          <div className="grid">
            <div className="flex flex-col">
              <span className="font-medium txt-medium text-ui-fg-base">
                Shipping method
              </span>
              <span className="mb-4 text-ui-fg-muted txt-medium">
                How would you like you order delivered
              </span>
            </div>
            <div data-testid="delivery-options-container">
              <div className="pb-8 md:pt-0 pt-2">
                {hasPickupOptions && (
                  <RadioGroup
                    value={showPickupOptions}
                    onChange={(_value) => {
                      const id = _pickupMethods.find(
                        (option) => !option.insufficient_inventory
                      )?.id

                      if (id) {
                        handleSetShippingMethod(id, "pickup")
                      }
                    }}
                  >
                    <Radio
                      value={PICKUP_OPTION_ON}
                      data-testid="delivery-option-radio"
                      className={clx(
                        "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
                        {
                          "border-ui-border-interactive":
                            showPickupOptions === PICKUP_OPTION_ON,
                        }
                      )}
                    >
                      <div className="flex items-center gap-x-4">
                        <MedusaRadio
                          checked={showPickupOptions === PICKUP_OPTION_ON}
                        />
                        <span className="text-base-regular">
                          Pick up your order
                        </span>
                      </div>
                      <span className="justify-self-end text-ui-fg-base">
                        -
                      </span>
                    </Radio>
                  </RadioGroup>
                )}
                <RadioGroup
                  value={shippingMethodId}
                  onChange={(v) => {
                    if (v) {
                      return handleSetShippingMethod(v, "shipping")
                    }
                  }}
                >
                  {selectableShippingMethods?.map((option) => {
                    const availability = getShippingAvailability(
                      option,
                      calculatedPricesMap
                    )
                    // Unreachable by construction — the list only holds
                    // available options — but keeps the amount type-safe.
                    if (!availability.available) return null

                    return (
                      <Radio
                        key={option.id}
                        value={option.id}
                        data-testid="delivery-option-radio"
                        className={clx(
                          "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
                          {
                            "border-ui-border-interactive":
                              option.id === shippingMethodId,
                          }
                        )}
                      >
                        <div className="flex items-center gap-x-4">
                          <MedusaRadio
                            checked={option.id === shippingMethodId}
                          />
                          <div className="flex flex-col">
                            <span className="text-base-regular">
                              {option.name}
                            </span>
                            {/* Without this the tiers are two names and two
                                prices, and the extra cost buys nothing the
                                customer can see. */}
                            {(availability.courierName ||
                              formatDeliveryEstimate(
                                availability.estimatedDays
                              )) && (
                              <span
                                className="text-small-regular text-ui-fg-subtle"
                                data-testid="delivery-option-detail"
                              >
                                {[
                                  formatDeliveryEstimate(
                                    availability.estimatedDays
                                  ),
                                  availability.courierName,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="justify-self-end text-ui-fg-base">
                          {convertToLocale({
                            amount: availability.amount,
                            currency_code: cart?.currency_code,
                          })}
                        </span>
                      </Radio>
                    )
                  })}
                </RadioGroup>

                {isResolving && !selectableShippingMethods?.length && (
                  <div
                    className="flex items-center gap-x-2 py-4 text-ui-fg-subtle"
                    data-testid="delivery-options-loading"
                  >
                    <Loader />
                    <Text className="txt-small">
                      Checking delivery options for your address…
                    </Text>
                  </div>
                )}

                {!isResolving && !selectableShippingMethods?.length && (
                  <div
                    className="rounded-rounded border border-ui-border-base bg-ui-bg-subtle px-8 py-4"
                    data-testid="no-delivery-options-message"
                  >
                    <Text className="text-ui-fg-base">
                      {blockingReason
                        ? "We need your delivery address first."
                        : "We cannot deliver to this address right now."}
                    </Text>
                    <Text className="txt-small text-ui-fg-subtle mt-1">
                      {blockingReason
                        ? blockingReason.message
                        : "Try a different delivery address, or contact us and we will sort it out for you."}
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showPickupOptions === PICKUP_OPTION_ON && (
            <div className="grid">
              <div className="flex flex-col">
                <span className="font-medium txt-medium text-ui-fg-base">
                  Store
                </span>
                <span className="mb-4 text-ui-fg-muted txt-medium">
                  Choose a store near you
                </span>
              </div>
              <div data-testid="delivery-options-container">
                <div className="pb-8 md:pt-0 pt-2">
                  <RadioGroup
                    value={shippingMethodId}
                    onChange={(v) => {
                      if (v) {
                        return handleSetShippingMethod(v, "pickup")
                      }
                    }}
                  >
                    {_pickupMethods?.map((option) => {
                      return (
                        <Radio
                          key={option.id}
                          value={option.id}
                          disabled={option.insufficient_inventory}
                          data-testid="delivery-option-radio"
                          className={clx(
                            "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
                            {
                              "border-ui-border-interactive":
                                option.id === shippingMethodId,
                              "hover:shadow-brders-none cursor-not-allowed":
                                option.insufficient_inventory,
                            }
                          )}
                        >
                          <div className="flex items-start gap-x-4">
                            <MedusaRadio
                              checked={option.id === shippingMethodId}
                            />
                            <div className="flex flex-col">
                              <span className="text-base-regular">
                                {option.name}
                              </span>
                              <span className="text-base-regular text-ui-fg-muted">
                                {formatAddress(
                                  (option as unknown as { service_zone?: { fulfillment_set?: { location?: { address: HttpTypes.StoreCartAddress } } } }).service_zone?.fulfillment_set?.location
                                    ?.address as HttpTypes.StoreCartAddress
                                )}
                              </span>
                            </div>
                          </div>
                          <span className="justify-self-end text-ui-fg-base">
                            {convertToLocale({
                              amount: option.amount!,
                              currency_code: cart?.currency_code,
                            })}
                          </span>
                        </Radio>
                      )
                    })}
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          <div>
            <ErrorMessage
              error={error}
              data-testid="delivery-option-error-message"
            />
            <Button
              size="large"
              className="mt"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!cart.shipping_methods?.[0]}
              data-testid="submit-delivery-option-button"
            >
              Continue to payment
            </Button>
          </div>
        </>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
              <div className="flex flex-col w-1/3">
                {/* The chosen method is its own heading. A "Method" label above
                    it only restates what the value already says. */}
                <Text className="txt-medium-plus text-ui-fg-base">
                  {cart.shipping_methods!.at(-1)!.name}{" "}
                  {convertToLocale({
                    amount: cart.shipping_methods!.at(-1)!.amount!,
                    currency_code: cart?.currency_code,
                  })}
                </Text>
                {/* The carrier and estimate are part of what was chosen, so the
                    saved state shows the same promise the option did — read
                    from the method itself, not recomputed. */}
                {(() => {
                  const methodData = cart.shipping_methods!.at(-1)!.data as
                    | {
                        courier_name?: string
                        estimated_delivery_days?: number
                      }
                    | null
                  const detail = [
                    formatDeliveryEstimate(methodData?.estimated_delivery_days),
                    methodData?.courier_name,
                  ]
                    .filter(Boolean)
                    .join(" · ")

                  return detail ? (
                    <Text
                      className="txt-small text-ui-fg-muted"
                      data-testid="delivery-option-detail"
                    >
                      {detail}
                    </Text>
                  ) : null
                })()}
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Shipping
