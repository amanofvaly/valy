"use client"

import { updateRegion } from "@lib/data/cart-actions"
import { HttpTypes } from "@medusajs/types"
import NativeSelect from "@modules/common/components/native-select"
import { useParams, usePathname } from "next/navigation"
import { useMemo, useTransition } from "react"

/**
 * Where the order ships to.
 *
 * Was a Headless UI listbox opened by `onMouseEnter`, which meant it could not
 * be opened at all on a touchscreen — the one place this control lives is the
 * mobile menu.
 */

type CountryOption = {
  country: string
  label: string
}

const CountrySelect = ({ regions }: { regions: HttpTypes.StoreRegion[] }) => {
  const { countryCode } = useParams()
  const currentPath = usePathname().split(`/${countryCode}`)[1] || ""
  const [isPending, startTransition] = useTransition()

  const options = useMemo(
    () =>
      regions
        .flatMap((r) =>
          (r.countries ?? []).map((c) => ({
            country: c.iso_2 ?? "",
            label: c.display_name ?? c.name ?? c.iso_2 ?? "",
          }))
        )
        .filter((o): o is CountryOption => !!o.country)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [regions]
  )

  // One country is not a choice; rendering a picker with a single option
  // suggests otherwise.
  if (options.length < 2) {
    return null
  }

  return (
    <NativeSelect
      label="Shipping to"
      value={(countryCode as string) ?? ""}
      disabled={isPending}
      data-testid="country-select"
      onChange={(e) => {
        const next = e.target.value
        startTransition(() => {
          updateRegion(next, currentPath)
        })
      }}
    >
      {options.map((o) => (
        <option key={o.country} value={o.country}>
          {o.label}
        </option>
      ))}
    </NativeSelect>
  )
}

export default CountrySelect
