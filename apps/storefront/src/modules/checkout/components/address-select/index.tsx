"use client"

import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import NativeSelect from "@modules/common/components/native-select"
import { useMemo } from "react"

/**
 * Pick a saved address at checkout.
 *
 * A native select rather than a custom listbox: on a phone this opens the
 * platform picker, which is quicker to operate than a scrolling panel and
 * cannot end up rendered behind the address form. The previous version also had
 * an unstyled focus ring referencing colours that no longer exist.
 *
 * One line per address, enough to tell them apart without reprinting all of
 * each one.
 */

const describe = (address: HttpTypes.StoreCustomerAddress) =>
  [
    address.address_1,
    address.city,
    address.postal_code,
    address.country_code?.toUpperCase(),
  ]
    .filter(Boolean)
    .join(", ")

const AddressSelect = ({
  addresses,
  addressInput,
  onSelect,
}: {
  addresses: HttpTypes.StoreCustomerAddress[]
  addressInput: HttpTypes.StoreCartAddress | null
  onSelect: (
    address: HttpTypes.StoreCartAddress | undefined,
    email?: string
  ) => void
}) => {
  const selected = useMemo(
    () =>
      addresses.find(
        (a) => addressInput && compareAddresses(a, addressInput)
      ),
    [addresses, addressInput]
  )

  return (
    <NativeSelect
      label="Saved addresses"
      placeholder="Choose an address"
      value={selected?.id ?? ""}
      data-testid="shipping-address-select"
      onChange={(e) => {
        const saved = addresses.find((a) => a.id === e.target.value)
        if (saved) {
          onSelect(saved as HttpTypes.StoreCartAddress)
        }
      }}
    >
      {addresses.map((address) => (
        <option
          key={address.id}
          value={address.id}
          data-testid="shipping-address-option"
        >
          {[address.first_name, address.last_name].filter(Boolean).join(" ")}
          {" — "}
          {describe(address)}
        </option>
      ))}
    </NativeSelect>
  )
}

export default AddressSelect
