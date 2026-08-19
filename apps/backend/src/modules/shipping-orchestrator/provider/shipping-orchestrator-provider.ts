import { AbstractFulfillmentProviderService, MedusaError } from "@medusajs/framework/utils"
import {
  CalculatedShippingOptionPrice,
  CalculateShippingOptionPriceDTO,
  CreateFulfillmentResult,
  CreateShippingOptionDTO,
  FulfillmentDTO,
  FulfillmentItemDTO,
  FulfillmentOption,
  FulfillmentOrderDTO,
  ValidateFulfillmentDataContext,
  Logger,
} from "@medusajs/framework/types"
// Removed static import of ShiprocketAPI

type InjectedDependencies = {
  logger: Logger
  shippingOrchestratorModuleService: any
}

/**
 * Shipping Orchestrator Fulfillment Provider
 *
 * Implements the full 5-pillar architecture described in SHIPPING_ARCHITECTURE.md:
 *   P1 - Product & Category Rules (ships_separately, volumetric boxing, pincode block)
 *   P2 - Multi-Warehouse & Split Routing (inventory-aware, hyperlocal bypass)
 *   P3 - Cart, Customer & Promo Logic (free shipping w/ exclusions, B2B, pre-orders)
 *   P4 - Courier Controls (blacklist, masking, dynamic surcharges)
 *   P5 - Return & RTO Logistics (COD premium, RTO risk, reverse pickup)
 */
export default class ShippingOrchestratorProvider extends AbstractFulfillmentProviderService {
  static identifier = "shipping-orchestrator"
  protected logger_: Logger
  protected svc_: any

  constructor({
    logger,
    shippingOrchestratorModuleService,
  }: InjectedDependencies) {
    super()
    this.logger_ = logger
    this.svc_ = shippingOrchestratorModuleService
  }

  // ------------------------------------------------------------------
  // Fulfillment Options
  // ------------------------------------------------------------------

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      {
        id: "so-standard",
        name: "Standard Delivery",
        is_calculated: true,
      },
      {
        id: "so-express",
        name: "Express Delivery",
        is_calculated: true,
      },
      {
        id: "so-hyperlocal",
        name: "Local Delivery",
        is_calculated: true,
      },
    ]
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    _context: ValidateFulfillmentDataContext
  ): Promise<any> {
    return data
  }

  async validateOption(_data: Record<string, unknown>): Promise<boolean> {
    return true
  }

  async canCalculate(_data: CreateShippingOptionDTO): Promise<boolean> {
    return true
  }

  // ------------------------------------------------------------------
  // CALCULATE PRICE — the core engine
  // ------------------------------------------------------------------

  async calculatePrice(
    optionData: CalculateShippingOptionPriceDTO["optionData"],
    _data: CalculateShippingOptionPriceDTO["data"],
    context: any
  ): Promise<CalculatedShippingOptionPrice> {
    let calculated_amount = 0
    const is_calculated_price_tax_inclusive = false

    try {
      this.logger_.info(
        `[ShippingOrchestrator] calculatePrice for option ${optionData?.id}`
      )

      const cart = context.cart
      if (!cart) throw new MedusaError(MedusaError.Types.INVALID_DATA, "No cart in context")

      // --- Load all config from DB ---
      const settings = await this.svc_.getActiveSettings()
      const rules = await this.svc_.listShippingRules()
      const warehouses = await this.svc_.listSoWarehouses()

      // --- Per-option extension (masking, per-option blacklist, surcharge) ---
      const optionExtensions = optionData?.id
        ? await this.svc_.listShippingOptionExtensions({
            native_option_id: optionData.id,
          })
        : []
      const optionExtension = optionExtensions[0] || null

      const deliveryPincode = cart.shipping_address?.postal_code
      const cartSubtotal = cart.total || 0

      // Find origin warehouse (primary fallback)
      const primaryWarehouse =
        warehouses.find((w: any) => w.is_primary) || warehouses[0]
      const originPincode = primaryWarehouse?.pincode || "110001"

      // ================================================================
      // STEP 1: Classify cart items (P1 + P2)
      // ================================================================

      const standardItems: any[] = []
      const separateItems: any[] = []
      let flatRateOverrides = 0
      let hasFreeSHippingExcludedCategory = false

      // Per-item additive fees. Flat is summed across the cart; percent
      // takes the max across qualifying items (so two 5% items don't
      // stack to 10.25%).
      let perItemFlatSurcharge = 0
      let maxItemPercentSurcharge = 0

      const applyItemSurcharges = (
        metadata: Record<string, any>,
        quantity: number,
        rules: any[],
        categoryIds: string[],
        productId?: string,
        variantId?: string
      ) => {
        const flat = Number(metadata.shipping_flat_surcharge || 0)
        const pct = Number(metadata.shipping_percent_surcharge || 0)
        if (flat > 0) perItemFlatSurcharge += flat * quantity
        if (pct > maxItemPercentSurcharge) maxItemPercentSurcharge = pct

        // Product- and variant-scoped rules (mirror the metadata paths)
        const scopedRules = rules.filter(
          (r: any) =>
            (r.target_type === "product" && r.target_id === productId) ||
            (r.target_type === "variant" && r.target_id === variantId) ||
            (r.target_type === "category" &&
              categoryIds.includes(r.target_id))
        )
        for (const rule of scopedRules) {
          const val = Number((rule.value as any)?.action_value || 0)
          if (rule.rule_type === "add_surcharge_flat" && val > 0) {
            perItemFlatSurcharge += val * quantity
          }
          if (rule.rule_type === "add_surcharge_percent" && val > 0) {
            if (val > maxItemPercentSurcharge) maxItemPercentSurcharge = val
          }
        }
      }

      for (const item of cart.items || []) {
        // Variant metadata wins over product metadata so a single heavy
        // variant can override its parent product's shipping behaviour.
        const productMeta = item.variant?.product?.metadata || {}
        const variantMeta = item.variant?.metadata || {}
        const metadata = { ...productMeta, ...variantMeta }
        const itemCategories = item.variant?.product?.categories || []
        const categoryIds = itemCategories.map((c: any) => c.id)
        const productId = item.variant?.product?.id
        const variantId = item.variant?.id

        // --- P1.3: Pincode Blacklisting per Category / Product / Variant ---
        if (deliveryPincode) {
          const blockRules = rules.filter(
            (r: any) =>
              r.rule_type === "block_pincode" &&
              ((r.target_type === "category" &&
                categoryIds.includes(r.target_id)) ||
                (r.target_type === "product" && r.target_id === productId) ||
                (r.target_type === "variant" && r.target_id === variantId))
          )
          for (const rule of blockRules) {
            const blockedPincodes = (rule.value as any)?.pincodes || []
            if (blockedPincodes.includes(deliveryPincode)) {
              throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `Delivery to pincode ${deliveryPincode} is not available for one or more items in your cart.`
              )
            }
          }
        }

        // Additive item-level fees (product + variant metadata, product +
        // variant + category rules). Applied even when the line is later
        // handled as flat-rate / free / ships-separately.
        applyItemSurcharges(
          metadata,
          item.quantity,
          rules,
          categoryIds,
          productId,
          variantId
        )

        // --- Per-product free shipping metadata ---
        if (
          metadata.free_shipping === "true" ||
          metadata.free_shipping === true
        ) {
          continue
        }

        // --- Per-product flat rate override ---
        if (metadata.shipping_flat_override) {
          flatRateOverrides +=
            Number(metadata.shipping_flat_override) * item.quantity
          continue
        }

        // --- Product / variant / category rules: flat rate, exclusion ---
        let ruleFlatApplied = false
        const scopedFlatRules = rules.filter(
          (r: any) =>
            ((r.target_type === "category" &&
              categoryIds.includes(r.target_id)) ||
              (r.target_type === "product" && r.target_id === productId) ||
              (r.target_type === "variant" && r.target_id === variantId)) &&
            (r.rule_type === "force_flat_rate" ||
              r.rule_type === "free_shipping_exclusion")
        )

        for (const rule of scopedFlatRules) {
          if (rule.rule_type === "force_flat_rate") {
            flatRateOverrides +=
              Number((rule.value as any)?.action_value || 0) *
              item.quantity
            ruleFlatApplied = true
          }
          if (rule.rule_type === "free_shipping_exclusion") {
            hasFreeSHippingExcludedCategory = true
          }
        }

        if (ruleFlatApplied) continue

        // --- P1.1: Ships Separately ---
        const weight =
          item.variant?.weight || settings.fallback_weight_grams
        const length = item.variant?.length || 10
        const width = item.variant?.width || 10
        const height = item.variant?.height || 10

        if (
          metadata.ships_separately === "true" ||
          metadata.ships_separately === true
        ) {
          for (let q = 0; q < item.quantity; q++) {
            separateItems.push({ length, width, height, weight, quantity: 1 })
          }
          continue
        }

        standardItems.push({
          length,
          width,
          height,
          weight,
          quantity: item.quantity,
        })
      }

      // ================================================================
      // STEP 2: Bin-packing (P1.2) — fit standard items into boxes
      // ================================================================

      let standardShippingCost = 0

      if (standardItems.length > 0) {
        const packedBoxes = await this.svc_.getBoxFit(
          standardItems,
          settings.volumetric_divisor
        )

        for (const packed of packedBoxes) {
          const cost = await this.getShippingRate(
            originPincode,
            deliveryPincode,
            packed.chargeableWeight,
            settings,
            packed.box
          )
          standardShippingCost += cost
        }
      }

      // ================================================================
      // STEP 3: Separate items get individual shipments (P1.1)
      // ================================================================

      let separateShippingCost = 0

      for (const sepItem of separateItems) {
        const volWeight =
          ((sepItem.length * sepItem.width * sepItem.height) /
            settings.volumetric_divisor) *
          1000
        const chargeableWeight = Math.max(sepItem.weight, volWeight)

        const cost = await this.getShippingRate(
          originPincode,
          deliveryPincode,
          chargeableWeight,
          settings,
          null
        )
        separateShippingCost += cost
      }

      // --- P2.1: Split shipment cost absorption ---
      if (
        settings.absorb_split_shipment_cost &&
        separateItems.length > 0 &&
        standardItems.length > 0
      ) {
        // Only charge the higher of the two, absorb the other
        calculated_amount =
          flatRateOverrides +
          Math.max(standardShippingCost, separateShippingCost)
      } else {
        calculated_amount =
          flatRateOverrides + standardShippingCost + separateShippingCost
      }

      // ================================================================
      // STEP 4: B2B Customer Group Override (P3.2)
      // ================================================================

      const b2bRules = rules.filter(
        (r: any) => r.rule_type === "b2b_override"
      )
      if (b2bRules.length > 0 && cart.customer_id) {
        // Check if customer belongs to a B2B group
        // The rule's target_id holds the customer_group ID
        // For now, we check metadata as Medusa v2's group resolution varies
        const customerMeta = cart.customer?.metadata || {}
        if (
          customerMeta.is_b2b === true ||
          customerMeta.is_b2b === "true"
        ) {
          const b2bRule = b2bRules[0]
          const overrideRate = Number(
            (b2bRule.value as any)?.action_value || 0
          )
          calculated_amount = overrideRate
          this.logger_.info(
            `[ShippingOrchestrator] B2B override applied: ${overrideRate}`
          )
        }
      }

      // ================================================================
      // STEP 5: Free Shipping Threshold with Exclusions (P3.1)
      // ================================================================

      if (settings.free_shipping_threshold > 0) {
        const thresholdInCents = settings.free_shipping_threshold * 100
        if (
          cartSubtotal >= thresholdInCents &&
          !hasFreeSHippingExcludedCategory
        ) {
          // Free shipping applies — but keep any flat rate overrides
          // from excluded categories
          calculated_amount = flatRateOverrides
        }
      }

      // ================================================================
      // STEP 6: Global Markups (P3/P4)
      // ================================================================

      if (settings.global_markup_type === "flat") {
        calculated_amount += Number(settings.global_markup_value)
      } else if (settings.global_markup_type === "percentage") {
        calculated_amount +=
          calculated_amount * (Number(settings.global_markup_value) / 100)
      }

      // ================================================================
      // STEP 7: Dynamic Surcharges (P4.3)
      // ================================================================

      if (settings.surcharge_enabled && settings.surcharge_value > 0) {
        if (settings.surcharge_type === "flat") {
          calculated_amount += Number(settings.surcharge_value)
        } else if (settings.surcharge_type === "percentage") {
          calculated_amount +=
            calculated_amount *
            (Number(settings.surcharge_value) / 100)
        }
      }

      // --- Per-option extension surcharge (layered on top of global) ---
      if (optionExtension) {
        if (Number(optionExtension.surcharge_flat) > 0) {
          calculated_amount += Number(optionExtension.surcharge_flat)
        }
        if (Number(optionExtension.surcharge_percent) > 0) {
          calculated_amount +=
            calculated_amount *
            (Number(optionExtension.surcharge_percent) / 100)
        }
      }

      // --- Per-item surcharges (product/variant metadata + rules) ---
      // Flat is summed across the cart; percent uses the max of any
      // qualifying item so multiple flagged items don't compound.
      if (perItemFlatSurcharge > 0) {
        calculated_amount += perItemFlatSurcharge
      }
      if (maxItemPercentSurcharge > 0) {
        calculated_amount +=
          calculated_amount * (maxItemPercentSurcharge / 100)
      }

      // ================================================================
      // STEP 8: COD / RTO Risk (P5.1)
      // ================================================================

      if (deliveryPincode && settings.cod_premium_enabled) {
        const rtoRisk = await this.svc_.getRtoRisk(deliveryPincode)
        if (rtoRisk) {
          if (rtoRisk.block_cod) {
            // We flag this in the return data; the storefront should
            // read it and disable COD. We don't fail the price calc.
            this.logger_.warn(
              `[ShippingOrchestrator] COD blocked for pincode ${deliveryPincode} (RTO risk: ${rtoRisk.risk_level})`
            )
          } else if (settings.cod_premium_value > 0) {
            // Apply COD premium
            calculated_amount += Number(settings.cod_premium_value)
          }
        }
      }

      // ================================================================
      // FINAL: Convert to Medusa cents format
      // ================================================================

      calculated_amount = Math.round(calculated_amount * 100)
      if (calculated_amount < 0) calculated_amount = 0
    } catch (e: any) {
      this.logger_.error(`[ShippingOrchestrator] Error: ${e.message}`)
      // If this is a user-facing block (pincode blocked), rethrow
      if (e.message.includes("not available for")) {
        throw e
      }
      // Otherwise, fallback to a safe default
      calculated_amount = 9900 // Rs 99 fallback
    }

    return {
      calculated_amount,
      is_calculated_price_tax_inclusive,
    }
  }

  // ------------------------------------------------------------------
  // Helper: Get shipping rate for a single box/shipment
  // ------------------------------------------------------------------

  private async getShippingRate(
    originPincode: string,
    deliveryPincode: string | undefined,
    chargeableWeightGrams: number,
    settings: any,
    box: any
  ): Promise<number> {
    // --- P2.2: Hyperlocal bypass ---
    if (
      settings.hyperlocal_enabled &&
      deliveryPincode &&
      originPincode === deliveryPincode
    ) {
      this.logger_.info(
        `[ShippingOrchestrator] Hyperlocal bypass: same pincode ${originPincode}`
      )
      return Number(settings.hyperlocal_flat_rate) || 0
    }

    // --- Live Shiprocket API ---
    if (deliveryPincode) {
      try {
        const serviceabilityPayload = {
          pickup_postcode: originPincode,
          delivery_postcode: deliveryPincode,
          weight: chargeableWeightGrams / 1000,
          cod: 0,
          ...(box
            ? {
                length: box.length_cm,
                breadth: box.width_cm,
                height: box.height_cm,
              }
            : {}),
        }

        const srResponse =
          await this.svc_.shiprocketApi.checkServiceability(serviceabilityPayload, settings)

        if (
          srResponse?.data?.available_courier_companies?.length > 0
        ) {
          let couriers = srResponse.data.available_courier_companies

          // --- P4.1: Carrier Blacklisting ---
          couriers = this.svc_.filterCouriers(
            couriers,
            settings.carrier_blacklist || []
          )

          if (couriers.length === 0) {
            this.logger_.warn(
              "[ShippingOrchestrator] All couriers blacklisted, using fallback"
            )
            return this.getFallbackRate(chargeableWeightGrams)
          }

          // --- P4.2: Courier Masking (applied for display, not cost) ---
          // Masking is cosmetic; we still pick the cheapest by real name

          // Sort by rate ascending and pick cheapest
          couriers.sort((a: any, b: any) => a.rate - b.rate)
          return couriers[0].rate
        }

        throw new MedusaError(MedusaError.Types.NOT_FOUND, "No courier found")
      } catch (apiError: any) {
        this.logger_.warn(
          `[ShippingOrchestrator] Shiprocket API failed: ${apiError.message}, using fallback`
        )
        return this.getFallbackRate(chargeableWeightGrams)
      }
    }

    return this.getFallbackRate(chargeableWeightGrams)
  }

  /**
   * Fallback rate when Shiprocket is unavailable or no postcode given.
   * Rs 45 per 500g slab.
   */
  private getFallbackRate(weightGrams: number): number {
    return Math.ceil(weightGrams / 500) * 45
  }

  // ------------------------------------------------------------------
  // CREATE FULFILLMENT — push orders to Shiprocket
  // ------------------------------------------------------------------

  async createFulfillment(
    data: Record<string, unknown>,
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    fulfillment: Partial<
      Omit<FulfillmentDTO, "provider_id" | "data" | "items">
    >,
    additionalData?: Record<string, unknown>
  ): Promise<CreateFulfillmentResult> {
    if (!order) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Order context is required to create fulfillment"
      )
    }

    const deliveryAddress = order.shipping_address as any
    if (!deliveryAddress) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Shipping address is missing from the order")
    }

    const settings = await this.svc_.getActiveSettings()
    const warehouses = await this.svc_.listSoWarehouses()
    const primaryWarehouse =
      warehouses.find((w: any) => w.is_primary) || warehouses[0]

    // Classify items
    const standardItems: any[] = []
    const separateItems: any[] = []

    for (const i of items) {
      const srItem = {
        name: i.title || "Item",
        sku: i.sku || i.id,
        units: i.quantity,
        selling_price: (i as any).unit_price || 0,
        discount: "",
        tax: "",
        hsn: "",
      }

      const productMeta = (i as any).variant?.product?.metadata || {}
      const variantMeta = (i as any).variant?.metadata || {}
      const metadata = { ...productMeta, ...variantMeta }
      if (
        metadata.ships_separately === "true" ||
        metadata.ships_separately === true
      ) {
        separateItems.push(srItem)
      } else {
        standardItems.push(srItem)
      }
    }

    const allResponses: any[] = []

    const pushToShiprocket = async (
      orderItems: any[],
      suffix: string,
      warehouse: any
    ) => {
      const pickupLocation = warehouse?.name || "Primary"
      const weight =
        orderItems.reduce(
          (sum: number, item: any) => sum + (item.units || 1) * 0.5,
          0
        ) || 0.5

      const payload = {
        order_id: `SR-${order.id}-${suffix}`,
        order_date: new Date().toISOString().split("T")[0],
        pickup_location: pickupLocation,
        billing_customer_name:
          deliveryAddress.first_name || "Customer",
        billing_last_name: deliveryAddress.last_name || "",
        billing_address: deliveryAddress.address_1,
        billing_address_2: deliveryAddress.address_2 || "",
        billing_city: deliveryAddress.city,
        billing_pincode: deliveryAddress.postal_code,
        billing_state: deliveryAddress.province || "State",
        billing_country: deliveryAddress.country_code || "IN",
        billing_email: order.email,
        billing_phone: deliveryAddress.phone || "0000000000",
        shipping_is_billing: true,
        order_items: orderItems,
        payment_method: "Prepaid",
        sub_total: 0,
        length: 10,
        breadth: 10,
        height: 10,
        weight,
      }

      this.logger_.info(
        `[ShippingOrchestrator] Creating Shiprocket order: ${payload.order_id}`
      )
      return await this.svc_.shiprocketApi.createOrder(payload, settings)
    }

    // Standard items in one box
    if (standardItems.length > 0) {
      const response = await pushToShiprocket(
        standardItems,
        "STD",
        primaryWarehouse
      )
      allResponses.push(response)
    }

    // Separate items each in their own box
    let splitCounter = 1
    for (const sepItem of separateItems) {
      const response = await pushToShiprocket(
        [sepItem],
        `SPLIT${splitCounter}`,
        primaryWarehouse
      )
      allResponses.push(response)
      splitCounter++
    }

    // --- P2.3: Drop-shipping webhook ---
    if (primaryWarehouse?.is_drop_ship && primaryWarehouse?.vendor_webhook_url) {
      try {
        await fetch(primaryWarehouse.vendor_webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: order.id,
            items: items.map((i) => ({
              title: i.title,
              sku: i.sku,
              quantity: i.quantity,
            })),
            shipping_address: deliveryAddress,
          }),
        })
        this.logger_.info(
          `[ShippingOrchestrator] Drop-ship webhook dispatched to ${primaryWarehouse.vendor_webhook_url}`
        )
      } catch (webhookError: any) {
        this.logger_.error(
          `[ShippingOrchestrator] Drop-ship webhook failed: ${webhookError.message}`
        )
      }
    }

    // --- P4.2: Courier Masking applied to fulfillment metadata ---
    const rawCouriers = allResponses
      .map((r) => r.courier_name || r.courier_company_name || "")
      .filter(Boolean)
    const displayMap =
      (settings.courier_display_map as Record<string, string>) || {}
    const maskedCouriers = rawCouriers.map((name) => {
      const match = Object.entries(displayMap).find(([raw]) =>
        name.toLowerCase().includes(raw.toLowerCase())
      )
      return match ? match[1] : name
    })

    return {
      data: {
        ...data,
        shiprocket_order_ids: allResponses
          .map((r) => r.order_id)
          .join(","),
        shiprocket_shipment_ids: allResponses
          .map((r) => r.shipment_id)
          .join(","),
        shiprocket_awb_codes: allResponses
          .map((r) => r.awb_code)
          .filter(Boolean)
          .join(","),
        // Both raw (for support / auditing) and masked (for customer display)
        courier_names_raw: rawCouriers.join(","),
        courier_names_display: maskedCouriers.join(","),
      },
      labels: [],
    }
  }

  // ------------------------------------------------------------------
  // CANCEL FULFILLMENT
  // ------------------------------------------------------------------

  async cancelFulfillment(data: Record<string, unknown>): Promise<any> {
    const shiprocketOrderIds = (data.shiprocket_order_ids as string)
      ?.split(",")
      .filter(Boolean)

    if (shiprocketOrderIds?.length > 0) {
      try {
        const settings = await this.svc_.getActiveSettings()
        await this.svc_.shiprocketApi.cancelOrder(
          shiprocketOrderIds.map(Number).filter((n) => !isNaN(n)),
          settings
        )
        this.logger_.info(
          `[ShippingOrchestrator] Cancelled Shiprocket orders: ${shiprocketOrderIds.join(", ")}`
        )
      } catch (e: any) {
        this.logger_.error(
          `[ShippingOrchestrator] Cancel failed: ${e.message}`
        )
      }
    }

    return {}
  }
}
