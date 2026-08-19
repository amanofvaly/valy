import { MedusaService } from "@medusajs/framework/utils"
import {
  ShippingOrchestratorSettings,
  ShippingRule,
  Warehouse,
  BoxConfig,
  RtoRiskPincode,
} from "./models"
import { ShiprocketAPI } from "./provider/shiprocket-api"

class ShippingOrchestratorService extends MedusaService({
  ShippingOrchestratorSettings,
  ShippingRule,
  Warehouse,
  BoxConfig,
  RtoRiskPincode,
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
    const [existing] = await this.listShippingOrchestratorSettings()
    if (existing) return existing

    return await this.createShippingOrchestratorSettings({
      active_provider: "shiprocket",
      volumetric_divisor: 5000,
      fallback_weight_grams: 500,
      free_shipping_threshold: 0,
      global_markup_type: "none",
      global_markup_value: 0,
    })
  }

  /**
   * Find the warehouse whose pincode matches, for hyperlocal check.
   */
  async getWarehouseForPincode(pincode: string) {
    const warehouses = await this.listWarehouses({ pincode })
    return warehouses.length > 0 ? warehouses[0] : null
  }

  /**
   * Get the primary warehouse (fallback origin).
   */
  async getPrimaryWarehouse() {
    const warehouses = await this.listWarehouses({ is_primary: true })
    return warehouses.length > 0 ? warehouses[0] : null
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
    }> = []
    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        expandedItems.push({
          length: item.length,
          width: item.width,
          height: item.height,
          weight: item.weight,
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
        totalWeight: currentWeight,
        volumetricWeight,
        chargeableWeight: Math.max(currentWeight, volumetricWeight),
      })
    }

    return packedBoxes
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
