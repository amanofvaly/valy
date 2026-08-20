import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// ====================================================================
// A warehouse IS a Medusa stock location.
//
// The pickup pincode lives on the location's address, where Medusa already
// keeps a postal code. The three flags the shipping engine needs and Medusa
// has no column for live in `metadata`. There is deliberately no second
// record: nothing to link, nothing to sync, nothing to drift.
// ====================================================================

export type Warehouse = {
  id: string
  name: string
  pincode: string
  city: string
  state: string
  address_1: string
  country_code: string
  is_primary: boolean
  is_drop_ship: boolean
  vendor_webhook_url: string | null
}

/** Everything a warehouse needs from a stock location, for query.graph. */
export const WAREHOUSE_LOCATION_FIELDS = ["id", "name", "metadata", "address.*"]

export const toWarehouse = (location: any): Warehouse => {
  const metadata = (location?.metadata as Record<string, any>) || {}
  const address = location?.address || {}

  return {
    id: location.id,
    name: location.name ?? "",
    pincode: address.postal_code ?? "",
    city: address.city ?? "",
    state: address.province ?? "",
    address_1: address.address_1 ?? "",
    country_code: address.country_code ?? "",
    is_primary: metadata.is_primary === true,
    is_drop_ship: metadata.is_drop_ship === true,
    vendor_webhook_url: (metadata.vendor_webhook_url as string) ?? null,
  }
}

/**
 * The create/update shape Medusa's stock location service takes. Metadata is
 * written whole, so a field the caller omitted is cleared rather than left
 * over from a previous save.
 */
export const toStockLocationInput = (
  warehouse: Partial<Warehouse>,
  fallbackCountryCode: string
) => ({
  name: warehouse.name || "Unnamed warehouse",
  address: {
    address_1: warehouse.address_1 || "",
    city: warehouse.city || "",
    province: warehouse.state || "",
    postal_code: warehouse.pincode || "",
    // Never a literal country: an unset one comes from the store's own
    // regions, so a store selling anywhere else does not silently get India.
    country_code: warehouse.country_code || fallbackCountryCode,
  },
  metadata: {
    is_primary: warehouse.is_primary === true,
    is_drop_ship: warehouse.is_drop_ship === true,
    vendor_webhook_url: warehouse.vendor_webhook_url ?? null,
  },
})

export const listWarehouses = async (container: any): Promise<Warehouse[]> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

  const { data } = await query.graph({
    entity: "stock_location",
    fields: WAREHOUSE_LOCATION_FIELDS,
  })

  return (data ?? []).map(toWarehouse)
}

/**
 * The country to assume for a warehouse that has none: the first country the
 * store actually sells to. Falls back to "in" only when the store has no
 * regions at all, which means nothing can be sold yet anyway.
 */
export const storeCountryCode = async (container: any): Promise<string> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "countries.iso_2"],
  })

  return (
    (regions ?? [])
      .flatMap((r: any) => r.countries ?? [])
      .map((c: any) => c.iso_2)
      .find(Boolean) || "in"
  )
}

/**
 * Exactly one warehouse is the origin. Marking a second one primary used to
 * leave both flagged, and `primaryWarehouse` then picked whichever came back
 * first — so the flag appeared set but changed nothing. Saving a primary
 * demotes the rest.
 */
export const demoteOtherPrimaries = async (
  container: any,
  keepId: string
): Promise<number> => {
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION) as any
  const warehouses = await listWarehouses(container)

  let demoted = 0

  for (const warehouse of warehouses) {
    if (warehouse.id === keepId || !warehouse.is_primary) {
      continue
    }

    await stockLocationService.updateStockLocations(warehouse.id, {
      metadata: {
        is_primary: false,
        is_drop_ship: warehouse.is_drop_ship,
        vendor_webhook_url: warehouse.vendor_webhook_url,
      },
    })
    demoted++
  }

  return demoted
}

/** Orders ship from the warehouse marked primary, or the only one there is. */
export const primaryWarehouse = (warehouses: Warehouse[]): Warehouse | null =>
  warehouses.find((w) => w.is_primary) ?? warehouses[0] ?? null
