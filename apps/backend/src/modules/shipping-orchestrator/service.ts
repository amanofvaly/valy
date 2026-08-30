import { MedusaService } from "@medusajs/framework/utils"
import {
  ShippingOrchestratorSettings,
  ShippingRule,
  BoxConfig,
  RtoRiskPincode,
  ShippingOptionExtension,
} from "./models"
import { ShiprocketAPI } from "./provider/shiprocket-api"

class ShippingOrchestratorService extends MedusaService({
  ShippingOrchestratorSettings,
  ShippingRule,
  BoxConfig,
  RtoRiskPincode,
  ShippingOptionExtension,
}) {
  options_: any
  shiprocketApi: ShiprocketAPI

  constructor(...args: any[]) {
    // @ts-ignore
    super(...args)
    this.options_ = args[1] || {}
    this.shiprocketApi = new ShiprocketAPI()
  }

  // --- Orchestration helpers used by the fulfillment provider ---

  /**
   * Returns the single settings row, creating defaults if none exists.
   */
  async getActiveSettings() {
    const readOne = async () => {
      const [existing] = await this.listShippingOrchestratorSettings(
        {},
        { order: { created_at: "ASC" } }
      )
      return existing
    }

    const existing = await readOne()
    if (existing) return existing

    // A unique index on `singleton` means only one of several concurrent
    // first-boot requests can insert. The others lose the race and land here,
    // where the row they failed to create is now readable.
    try {
      return await this.createShippingOrchestratorSettings({
        active_provider: "shiprocket",
        volumetric_divisor: 5000,
        fallback_weight_grams: 500,
        free_shipping_threshold: 0,
        global_markup_type: "none",
        global_markup_value: 0,
      })
    } catch (e) {
      const row = await readOne()
      if (row) return row
      throw e
    }
  }

  /**
   * Returns settings with credentials stripped and replaced by
   * a boolean flag. Safe to return to the admin UI.
   */
  async getSettingsForAdmin() {
    const settings = await this.getActiveSettings()
    const apiSettings = (settings.api_settings as any) || {}
    const { shiprocket_password, ...restApiSettings } = apiSettings

    return {
      ...settings,
      api_settings: {
        ...restApiSettings,
        has_shiprocket_password: Boolean(shiprocket_password),
      },
    }
  }

  /**
   * Merge incoming settings with what's already stored, preserving any
   * secret fields (e.g. shiprocket_password) when the caller sends them
   * blank. Callers should not need to know about individual secret keys.
   */
  async persistSettings(incoming: Record<string, any>) {
    const current = await this.getActiveSettings()
    const currentApi = (current.api_settings as any) || {}
    const incomingApi = incoming.api_settings || {}

    const mergedApi: Record<string, any> = { ...currentApi, ...incomingApi }

    // Strip UI-only marker fields
    delete mergedApi.has_shiprocket_password

    // Preserve password if caller sent it blank or omitted
    if (!incomingApi.shiprocket_password) {
      if (currentApi.shiprocket_password) {
        mergedApi.shiprocket_password = currentApi.shiprocket_password
      } else {
        delete mergedApi.shiprocket_password
      }
    }

    const {
      id,
      created_at,
      updated_at,
      deleted_at,
      api_settings: _ignoredApiSettings,
      ...rest
    } = incoming

    return await this.updateShippingOrchestratorSettings({
      id: current.id,
      ...rest,
      api_settings: mergedApi,
    })
  }

  /**
   * Check if a pincode is blocked for a given category.
   * Returns the blocking rule if found, null otherwise.
   */
  async checkPincodeBlocked(categoryId: string, deliveryPincode: string) {
    const rules = await this.listShippingRules({
      target_type: "category",
      target_id: categoryId,
      rule_type: "block_pincode",
    })

    for (const rule of rules) {
      const blockedPincodes = (rule.value as any)?.pincodes || []
      if (blockedPincodes.includes(deliveryPincode)) {
        return rule
      }
    }

    return null
  }

  /**
   * Check RTO risk for a delivery pincode.
   * Returns the risk record if found, null otherwise.
   */
  async getRtoRisk(pincode: string) {
    const records = await this.listRtoRiskPincodes({ pincode })
    return records.length > 0 ? records[0] : null
  }

  /**
   * Simple first-fit-decreasing bin-packing.
   * Groups items into the smallest available box configs.
   * Returns an array of { box, items, totalWeight, volumetricWeight }.
   */
  async getBoxFit(
    items: Array<{
      length: number
      width: number
      height: number
      weight: number
      quantity: number
      /**
       * Optional caller reference, carried through packing and returned on the
       * box the item landed in. Pricing does not need it — it only wants a
       * weight per parcel — but fulfilment does: it has to tell Shiprocket
       * which goods are in which box, and without this it would have to guess
       * at a split that has already been decided here.
       */
      ref?: string
    }>,
    divisor: number
  ) {
    const boxes = await this.listBoxConfigs()

    if (boxes.length === 0) {
      // No boxes configured — fall back to raw volumetric calc
      let totalWeight = 0
      let totalVolume = 0
      for (const item of items) {
        totalWeight += item.weight * item.quantity
        totalVolume +=
          item.length * item.width * item.height * item.quantity
      }
      const volumetricWeight = (totalVolume / divisor) * 1000
      return [
        {
          box: null,
          items: items.flatMap((item) =>
            item.ref ? Array(item.quantity).fill(item.ref) : []
          ),
          totalWeight,
          volumetricWeight,
          chargeableWeight: Math.max(totalWeight, volumetricWeight),
        },
      ]
    }

    // Sort boxes by volume ascending (prefer smallest box)
    const sortedBoxes = [...boxes].sort(
      (a: any, b: any) =>
        a.length_cm * a.width_cm * a.height_cm -
        b.length_cm * b.width_cm * b.height_cm
    )

    // Expand items by quantity
    const expandedItems: Array<{
      length: number
      width: number
      height: number
      weight: number
      ref?: string
    }> = []
    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        expandedItems.push({
          length: item.length,
          width: item.width,
          height: item.height,
          weight: item.weight,
          ref: item.ref,
        })
      }
    }

    // Sort items by volume descending (first-fit-decreasing)
    expandedItems.sort(
      (a, b) =>
        b.length * b.width * b.height - a.length * a.width * a.height
    )

    const packedBoxes: Array<{
      box: any
      items: string[]
      totalWeight: number
      volumetricWeight: number
      chargeableWeight: number
    }> = []

    const remaining = [...expandedItems]

    while (remaining.length > 0) {
      let bestBox = sortedBoxes[sortedBoxes.length - 1] as any // largest box as fallback
      let currentWeight = 0
      const boxItems: typeof remaining = []

      // Try to pack items into the current box
      for (let i = remaining.length - 1; i >= 0; i--) {
        const item = remaining[i]
        if (currentWeight + item.weight <= bestBox.max_weight_grams) {
          currentWeight += item.weight
          boxItems.push(item)
          remaining.splice(i, 1)
        }
      }

      // If no items fit at all, force the first item out
      if (boxItems.length === 0 && remaining.length > 0) {
        boxItems.push(remaining.shift()!)
        currentWeight = boxItems[0].weight
      }

      const boxVolume =
        bestBox.length_cm * bestBox.width_cm * bestBox.height_cm
      const volumetricWeight = (boxVolume / divisor) * 1000

      packedBoxes.push({
        box: bestBox,
        items: boxItems
          .map((item) => item.ref)
          .filter((ref): ref is string => !!ref),
        totalWeight: currentWeight,
        volumetricWeight,
        chargeableWeight: Math.max(currentWeight, volumetricWeight),
      })
    }

    return packedBoxes
  }

  /**
   * Pick the courier to actually book, given the one the customer was quoted.
   *
   * The quote named a carrier and the customer accepted a price against it, so
   * that carrier is what should turn up. It may no longer be offered by the
   * time the parcel is packed — serviceability changes by the day — so this
   * degrades in the order a person would: the same carrier, then the same
   * carrier by another name, then whatever is cheapest.
   *
   * Returns the chosen courier and how it was chosen, because "we booked
   * someone else" is something the operator needs to be able to see rather
   * than discover from an invoice.
   */
  async resolveCourier(
    couriers: Array<{
      courier_company_id: number
      courier_name: string
      rate: number
      [k: string]: any
    }>,
    quotedName?: string | null
  ): Promise<{
    courier: { courier_company_id: number; courier_name: string; rate: number }
    match: "exact" | "partial" | "cheapest"
  } | null> {
    if (!couriers?.length) {
      return null
    }

    const cheapest = [...couriers].sort((a, b) => a.rate - b.rate)

    if (quotedName) {
      const wanted = quotedName.trim().toLowerCase()

      const exact = couriers.find(
        (c) => c.courier_name?.trim().toLowerCase() === wanted
      )
      if (exact) {
        return { courier: exact, match: "exact" }
      }

      /*
       * "Shadowfax Surface" against "Shadowfax": the same carrier offering a
       * differently-labelled service. Cheapest first, so a carrier listed under
       * several services gives its least expensive one rather than whichever
       * happened to be first in the response.
       */
      const partial = cheapest.find((c) => {
        const name = c.courier_name?.trim().toLowerCase() ?? ""
        return name.includes(wanted) || wanted.includes(name)
      })
      if (partial) {
        return { courier: partial, match: "partial" }
      }
    }

    return { courier: cheapest[0], match: "cheapest" }
  }

  /**
   * Filter out blacklisted carriers from a Shiprocket response.
   */
  async filterCouriers(
    couriers: Array<{ courier_name: string; rate: number; [k: string]: any }>,
    blacklist: string[]
  ) {
    if (!blacklist || blacklist.length === 0) return couriers

    const normalizedBlacklist = blacklist.map((b) =>
      b.trim().toLowerCase()
    )

    return couriers.filter(
      (c) =>
        !normalizedBlacklist.some((bl) =>
          c.courier_name.toLowerCase().includes(bl)
        )
    )
  }

  /**
   * Replace internal courier names with white-label display names.
   */
  async maskCourierNames(
    couriers: Array<{ courier_name: string; [k: string]: any }>,
    displayMap: Record<string, string>
  ) {
    if (!displayMap || Object.keys(displayMap).length === 0) return couriers

    return couriers.map((c) => ({
      ...c,
      display_name: displayMap[c.courier_name] || c.courier_name,
    }))
  }
}

export default ShippingOrchestratorService
