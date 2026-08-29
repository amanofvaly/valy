import compareAddresses from "@lib/util/compare-addresses"
import { stateFromPostalCode } from "@lib/util/postal-region"
import { HttpTypes } from "@medusajs/types"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import { cn } from "@lib/util/cn"
import React, { useEffect, useMemo, useState } from "react"

const ShippingAddress = ({
  customer,
  cart,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code":
      cart?.shipping_address?.country_code ||
      cart?.region?.countries?.[0]?.iso_2 ||
      "",
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    email: cart?.email || "",
  })

  const [saveAddress, setSaveAddress] = useState(false)

  const countryName =
    cart?.region?.countries?.find(
      (c) => c.iso_2 === formData["shipping_address.country_code"]
    )?.display_name ??
    formData["shipping_address.country_code"]?.toUpperCase() ??
    ""

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  // check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.addresses?.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  // Suppress the offer once the typed address matches one already in the book,
  // including right after the customer picked it from the saved-address list.
  const isAddressAlreadySaved = useMemo(() => {
    const typed = {
      first_name: formData["shipping_address.first_name"],
      last_name: formData["shipping_address.last_name"],
      address_1: formData["shipping_address.address_1"],
      postal_code: formData["shipping_address.postal_code"],
      city: formData["shipping_address.city"],
      country_code: formData["shipping_address.country_code"],
      province: formData["shipping_address.province"],
      phone: formData["shipping_address.phone"],
    }

    return !!customer?.addresses?.some((a) => compareAddresses(a, typed))
  }, [customer?.addresses, formData])

  const saved = addressesInRegion ?? []

  /*
   * A signed-in customer with a saved address is not asked to fill in a form.
   *
   * The step used to render the picker *and* the whole form underneath it, so
   * someone whose address we already hold was shown eleven fields and a
   * dropdown offering to fill them in. With one saved address there was
   * nothing to pick from either — a select of one option is a question with a
   * single answer.
   *
   * So: the address we are going to use is stated, `Change` appears only when
   * there is genuinely something to change to, and the form is what you get
   * when there is no saved address or when you ask for a different one.
   *
   * The only thing that decides which one you get is whether there is a saved
   * address to use. An earlier version also dropped to the form when the cart
   * already held an address matching none of the saved ones, on the theory
   * that it had been typed on purpose — but `compareAddresses` needs eight
   * fields to agree exactly, so a cart address that came *from* the book and
   * came back with one field normalised differently counted as a stranger, and
   * the customer got the form anyway. A rule that fails open on a string
   * comparison is not a rule.
   *
   * A typed address is not lost by this: it is still loaded into the form
   * fields, one press of "Deliver somewhere else" away.
   */
  const cartMatchesSaved = cart?.shipping_address
    ? saved.find((a) => compareAddresses(a, cart.shipping_address!))
    : undefined

  const [mode, setMode] = useState<"saved" | "form">(
    saved.length > 0 ? "saved" : "form"
  )
  const [picking, setPicking] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(
    cartMatchesSaved?.id ?? saved[0]?.id ?? null
  )

  const selected = saved.find((a) => a.id === selectedId) ?? null

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    if (address) {
      setFormData((prevState: Record<string, string>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.postal_code": address?.postal_code || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code":
          address?.country_code || cart?.region?.countries?.[0]?.iso_2 || "",
        "shipping_address.province": address?.province || "",
        "shipping_address.phone": address?.phone || "",
      }))
    }

    if (email) {
      setFormData((prevState: Record<string, string>) => ({
        ...prevState,
        email: email,
      }))
    }
  }

  useEffect(() => {
    // Ensure cart is not null and has a shipping_address before setting form data
    if (cart && cart.shipping_address) {
      setFormAddress(cart?.shipping_address, cart?.email)
    }

    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }
  }, [cart]) // Add cart as a dependency

  /*
   * The chosen address is what gets submitted. The fields it fills are the
   * same ones the form writes, so the server action does not know or care
   * which of the two paths the customer took.
   */
  useEffect(() => {
    if (mode === "saved" && selected) {
      setFormAddress(
        selected as unknown as HttpTypes.StoreCartAddress,
        customer?.email ?? undefined
      )
    }
  }, [mode, selected, customer?.email])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target

    setFormData((current) => {
      const next = { ...current, [name]: value }

      /*
       * A complete PIN code names its state, so stop asking for it.
       *
       * Only when the box is empty: someone who has typed a state, or picked a
       * saved address, has said something the postcode does not get to
       * overrule. The lookup is a table in `postal-region`, not a request —
       * a checkout field that waits on a third party while it is being typed
       * is a checkout field that hangs.
       */
      if (name === "shipping_address.postal_code") {
        const state = stateFromPostalCode(
          value,
          next["shipping_address.country_code"]
        )

        if (state && !current["shipping_address.province"]) {
          next["shipping_address.province"] = state
        }
      }

      return next
    })
  }

  const line = (a: HttpTypes.StoreCustomerAddress) =>
    [a.address_1, a.city, a.province, a.postal_code].filter(Boolean).join(", ")

  if (mode === "saved" && selected) {
    return (
      <>
        {/*
         * Every value the form would have submitted, submitted anyway. The
         * step's action reads `shipping_address.*` and `email` off the form
         * data and has no idea these came from the address book.
         */}
        {Object.entries(formData).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

        <div className="mb-6 rounded-lg border border-line bg-surface p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 text-sm leading-6">
              <p className="font-medium text-ink">
                {[selected.first_name, selected.last_name]
                  .filter(Boolean)
                  .join(" ")}
              </p>
              <p className="text-muted">{line(selected)}</p>
              <p className="truncate text-muted">
                {[customer?.email, selected.phone].filter(Boolean).join(" · ")}
              </p>
            </div>

            {/*
             * `Change` only when there is more than one. With a single saved
             * address the button's whole offer is to show you the address you
             * are already looking at.
             */}
            {saved.length > 1 && !picking && (
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="pressable-tint shrink-0 rounded px-2 py-1 text-sm text-accent hover:text-accent-strong"
                data-testid="change-address-button"
              >
                Change
              </button>
            )}
          </div>

          {picking && (
            <ul className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
              {saved.map((address) => (
                <li key={address.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(address.id)
                      setPicking(false)
                    }}
                    className={cn(
                      "w-full rounded border p-3 text-left text-sm leading-6",
                      address.id === selectedId
                        ? "border-accent bg-accent-wash"
                        : "border-line bg-paper hover:border-line-strong"
                    )}
                    data-testid="saved-address-option"
                  >
                    <span className="block font-medium text-ink">
                      {[address.first_name, address.last_name]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                    <span className="block text-muted">{line(address)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => {
              setPicking(false)
              setMode("form")
            }}
            className="pressable-tint mt-3 rounded text-sm text-muted underline underline-offset-4 hover:text-ink"
            data-testid="new-address-button"
          >
            Deliver somewhere else
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Back out of the form, for a customer who opened it by mistake. */}
      {saved.length > 0 && (
        <button
          type="button"
          onClick={() => setMode("saved")}
          className="pressable-tint mb-4 self-start rounded text-sm text-muted underline underline-offset-4 hover:text-ink"
          data-testid="use-saved-address-button"
        >
          Use a saved address
        </button>
      )}

      {/*
       * Contact first, and on its own.
       *
       * It used to be the last block on the form, under the address and the
       * checkboxes — which put the two fields the order confirmation and the
       * courier call actually depend on below everything else, where a reader
       * filling in a long form is most likely to be skimming. Two fields, one
       * subject, before the eleven that make up an address.
       */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          title="Enter a valid email address."
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="shipping-email-input"
        />
        {/*
         * Required. The courier calls this number before a machine weighing
         * several kilos is carried up someone's stairs, so an order without one
         * is an order that stalls in a depot — and an address saved without one
         * is a saved address that will stall the next order too.
         */}
        <Input
          label="Phone"
          name="shipping_address.phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          value={formData["shipping_address.phone"]}
          onChange={handleChange}
          data-testid="shipping-phone-input"
        />
      </div>
      {/*
       * Two columns on a phone, not one.
       *
       * A single column here is ten rows of roughly 70px, so the Continue
       * button sat some 700px below the first field and the step could not be
       * seen whole on any phone. The fields that pair naturally — the two
       * halves of a name, a postal code beside its city — are short enough to
       * sit side by side at 375px, and pairing them takes three rows out.
       * Everything that can run long spans both columns, because an address
       * line broken into half a phone is worse than a tall form.
       */}
      {/*
       * Three rows, not eleven.
       *
       * A single column was ten rows of roughly 70px, which put Continue some
       * 700px below the first field. The fields that belong together are set
       * together instead: the two halves of a name, then the street on its own
       * because it is the one line that runs long, then the three that locate
       * it. That last row is three across at every width — at 375px each cell
       * is about 105px, which is more than a six-digit PIN, a city name and a
       * state need, and the labels wrap above them rather than the values
       * being cut.
       */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            name="shipping_address.first_name"
            autoComplete="given-name"
            value={formData["shipping_address.first_name"]}
            onChange={handleChange}
            required
            data-testid="shipping-first-name-input"
          />
          <Input
            label="Last name"
            name="shipping_address.last_name"
            autoComplete="family-name"
            value={formData["shipping_address.last_name"]}
            onChange={handleChange}
            required
            data-testid="shipping-last-name-input"
          />
        </div>

        <Input
          label="Address"
          name="shipping_address.address_1"
          autoComplete="address-line1"
          value={formData["shipping_address.address_1"]}
          onChange={handleChange}
          required
          data-testid="shipping-address-input"
        />

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Input
            label="Postal code"
            name="shipping_address.postal_code"
            inputMode="numeric"
            autoComplete="postal-code"
            value={formData["shipping_address.postal_code"]}
            onChange={handleChange}
            required
            data-testid="shipping-postal-code-input"
          />
          <Input
            label="City"
            name="shipping_address.city"
            autoComplete="address-level2"
            value={formData["shipping_address.city"]}
            onChange={handleChange}
            required
            data-testid="shipping-city-input"
          />
          <Input
            label="State"
            name="shipping_address.province"
            autoComplete="address-level1"
            value={formData["shipping_address.province"]}
            onChange={handleChange}
            data-testid="shipping-province-input"
          />
        </div>

        {/*
         * The country, stated rather than asked.
         *
         * It was a select of every country in the region, which on this store
         * is a list of one: the region is chosen in the header and the cart is
         * priced in its currency, so by the time anyone reaches checkout the
         * answer is already decided and the control could only ever be set
         * back to what it was. It ships as a hidden field and shows here as a
         * line of text, so the reader can still see where the parcel is going.
         */}
        <input
          type="hidden"
          name="shipping_address.country_code"
          value={formData["shipping_address.country_code"]}
        />
        <p className="text-xs leading-5 text-muted">
          Delivering within <span className="text-ink">{countryName}</span>
        </p>
      </div>

      <div className="my-6 flex flex-col gap-3">
        {/* Only offered to signed-in customers — there is no address book to
            save into otherwise — and only when this address is not already
            one of their saved ones. */}
        {customer && !isAddressAlreadySaved && (
          <Checkbox
            label="Save this address to my account"
            name="save_address"
            checked={saveAddress}
            onChange={() => setSaveAddress((v) => !v)}
            data-testid="save-address-checkbox"
          />
        )}
      </div>
    </>
  )
}

export default ShippingAddress
