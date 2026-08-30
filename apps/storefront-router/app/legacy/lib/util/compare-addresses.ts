import { isEqual, pick } from "lodash"

/**
 * Do two addresses describe the same place?
 *
 * `company` is not compared. Checkout stopped asking for one, so a saved
 * address carrying a company name would never match anything typed there, and
 * the "save this address" offer would appear for an address already saved.
 */
export default function compareAddresses(address1: object, address2: object) {
  return isEqual(
    pick(address1, [
      "first_name",
      "last_name",
      "address_1",
      "postal_code",
      "city",
      "country_code",
      "province",
      "phone",
    ]),
    pick(address2, [
      "first_name",
      "last_name",
      "address_1",
      "postal_code",
      "city",
      "country_code",
      "province",
      "phone",
    ])
  )
}
