import {
  AbstractFulfillmentProviderService,
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { container as appContainer } from "@medusajs/framework"
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
import {
  FALLBACK_DIMENSION_CM,
  SHIPPING_ORCHESTRATOR_MODULE,
} from "../constants"
import { listWarehouses, primaryWarehouse } from "../warehouses"
import {
  addressIncomplete,
  blocked,
  isShippingUnavailableError,
  notConfigured,
  notServiceable,
  providerError,
} from "../errors"
// Removed static import of ShiprocketAPI

type InjectedDependencies = {
  logger: Logger
}

/** What one shipment's rate lookup yields: the price, and who is carrying it. */
type ShipmentRate = {
  amount: number
  courier_name?: string
  /** Omitted when the carrier gave no estimate — never guessed. */
  estimated_delivery_days?: number
}

// Fields the orchestrator needs that core's shipping-price cart projection does
// not fetch. See `loadCart` for why we re-query instead of trusting `context`.
const ORCHESTRATOR_CART_FIELDS = [
  "id",
  "currency_code",
  "region_id",
  "customer_id",
  "item_total",
  "item_subtotal",
  "total",
  "shipping_address.*",
  "items.id",
  "items.quantity",
  "items.variant_id",
  "items.product_id",
  "items.metadata",
  "items.variant.id",
  "items.variant.weight",
  "items.variant.length",
  "items.variant.height",
  "items.variant.width",
  "items.variant.metadata",
  "items.variant.product.id",
  "items.variant.product.metadata",
  "items.variant.product.categories.id",
  "customer.id",
  "customer.metadata",
]

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

  constructor({ logger }: InjectedDependencies) {
    super()
    this.logger_ = logger
  }

  /**
   * Fulfillment providers are constructed with the *fulfillment module's*
   * container as their cradle, which only carries that module's own services
   * (plus `logger` and `manager`). No other module is registered there under
   * any name, so the orchestrator service cannot be constructor-injected — it
   * has to be resolved lazily from the application container.
   */
  protected get svc_(): any {
    try {
      return appContainer.resolve(SHIPPING_ORCHESTRATOR_MODULE)
    } catch (e: any) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `The "${SHIPPING_ORCHESTRATOR_MODULE}" module is not registered in the application container. ` +
          `Add it to the "modules" array in medusa-config.ts.`,
        "shipping_module_unavailable"
      )
    }
  }

  protected query_(): any | null {
    try {
      return appContainer.resolve(ContainerRegistrationKeys.QUERY)
    } catch {
      return null
    }
  }

  /**
   * Core hands `calculatePrice` a cart projection built from
   * `cartFieldsForCalculateShippingOptionsPrices`, which omits variant/product
   * metadata, product categories, the customer, and the cart totals. Worse, the
   * quote path (`/store/shipping-options/:id/calculate`) and the charge path
   * (`addShippingMethodToCart`) use *different* projections, so pricing that
   * reads those fields would quote one number and charge another.
   *
   * We therefore re-query the cart ourselves with a single fixed field set, and
   * keep only the line items core passed us (it filters them by shipping
   * profile, which we must not undo). If the query is unavailable we fall back
   * to the context as-is rather than failing the checkout.
   */
  private async loadCart(context: any): Promise<any> {
    const contextCart = context?.cart ?? context
    const cartId = contextCart?.id

    const query = this.query_()
    if (!query || !cartId) {
      return contextCart
    }

    try {
      const { data } = await query.graph({
        entity: "cart",
        filters: { id: cartId },
        fields: ORCHESTRATOR_CART_FIELDS,
      })

      const enriched = data?.[0]
      if (!enriched) return contextCart

      // Preserve core's shipping-profile filtering of the line items.
      const allowedIds = new Set(
        (contextCart?.items ?? []).map((i: any) => i.id).filter(Boolean)
      )
      const items = allowedIds.size
        ? (enriched.items ?? []).filter((i: any) => allowedIds.has(i.id))
        : enriched.items ?? []

      return { ...contextCart, ...enriched, items }
    } catch (e: any) {
      this.logger_.warn(
        `[ShippingOrchestrator] Could not enrich cart ${cartId}, falling back to the provided context: ${e.message}`
      )
      return contextCart
    }
  }

  /**
   * Resolve the orchestrator's extension row for a native shipping option.
   *
   * `optionData` is the native option's `data` column, which carries `tier` and
   * has no `id`, so matching on `native_option_id` alone never hits. We try the
   * id when a caller supplies one and fall back to the tier.
   */
  private async resolveOptionExtension(
    optionData: Record<string, any> | undefined
  ): Promise<any | null> {
    const svc = this.svc_

    const nativeId = optionData?.id as string | undefined
    if (nativeId) {
      const byId = await svc.listShippingOptionExtensions({
        native_option_id: nativeId,
      })
      if (byId?.length) return byId[0]
    }

    const tier = optionData?.tier as string | undefined
    if (tier) {
      const byTier = await svc.listShippingOptionExtensions({ tier })
      if (byTier?.length) return byTier[0]
    }

    return null
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

  /**
   * Whatever this returns is persisted as the shipping method's `data`.
   *
   * The carrier and delivery estimate are part of what the customer agreed to
   * when they picked this option, so they are recorded on the method rather
   * than recomputed for display. That keeps the collapsed checkout summary, the
   * order confirmation and the admin order view all showing the promise that
   * was actually made, instead of only the tier's name and price.
   *
   * Costs one extra carrier lookup per selection: core does not hand the
   * already-calculated price to this hook. Deriving it server-side is still
   * right — a delivery promise on an order record must not be whatever the
   * browser claimed it was.
   */
  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: ValidateFulfillmentDataContext
  ): Promise<any> {
    try {
      const quote = (await this.calculatePrice(
        optionData,
        data,
        context as any
      )) as Record<string, unknown>

      return {
        ...data,
        ...(quote.courier_name ? { courier_name: quote.courier_name } : {}),
        ...(quote.estimated_delivery_days !== undefined
          ? { estimated_delivery_days: quote.estimated_delivery_days }
          : {}),
      }
    } catch (e: any) {
      // A display detail must never stop someone checking out. The price itself
      // is validated separately by core, which will refuse the option if it
      // genuinely cannot be quoted.
      this.logger_.warn(
        `[ShippingOrchestrator] Could not record carrier details on the shipping method: ${e.message}`
      )
      return data
    }
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
    // Shipping is quoted exclusive of GST; the tax module adds the line.
    // Quoted GST-inclusive, to match the product prices the customer has been
    // looking at all along. See grossUpForTax below — this is a presentation
    // change only; the merchant nets exactly the same amount either way.
    let is_calculated_price_tax_inclusive = false

    // Surfaced to the storefront alongside the price so a customer choosing
    // between tiers can see what the extra money buys.
    let courier_name: string | undefined
    let estimated_delivery_days: number | undefined

    const tier = ((optionData as any)?.tier as string) || "standard"

    try {
      this.logger_.info(
        `[ShippingOrchestrator] calculatePrice tier=${tier}`
      )

      const cart = await this.loadCart(context)
      if (!cart) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "No cart in context"
        )
      }

      // --- Load all config from DB ---
      const settings = await this.svc_.getActiveSettings()
      const rules = await this.svc_.listShippingRules()
      const warehouses = await listWarehouses(appContainer)

      if (!warehouses.length) {
        throw notConfigured(
          "No pickup warehouse has been set up yet, so delivery cannot be priced. " +
            "Add one under Shipping Orchestrator \u2192 Warehouses."
        )
      }

      // --- Per-option extension (masking, per-option blacklist, surcharge) ---
      const optionExtension = await this.resolveOptionExtension(
        optionData as Record<string, any>
      )

      const deliveryPincode = cart.shipping_address?.postal_code

      // Free shipping is judged on the value of the goods, never on `total` --
      // `total` already contains shipping, which would make the threshold
      // depend on its own result.
      const cartGoodsValue = Number(
        cart.item_total ?? cart.item_subtotal ?? 0
      )

      // Find origin warehouse (primary fallback)
      const originWarehouse = primaryWarehouse(warehouses)
      const originPincode = originWarehouse?.pincode

      if (!originPincode) {
        throw notConfigured(
          `Warehouse "${originWarehouse?.name ?? "primary"}" has no pincode, ` +
            "so distance-based rates cannot be requested. " +
            "Set it under Shipping Orchestrator \u2192 Warehouses."
        )
      }

      // ================================================================
      // STEP 0: Tier gating
      // ================================================================
      // Every tier runs the same engine, but they are not interchangeable.
      // Local delivery only exists when the buyer is at the warehouse's own
      // pincode; offering it anywhere else quotes a rate that cannot be served.
      if (tier === "hyperlocal") {
        if (!settings.hyperlocal_enabled) {
          throw notConfigured(
            "Local delivery is switched off. Enable it under " +
              "Shipping Orchestrator \u2192 Pricing to offer this option."
          )
        }
        if (!deliveryPincode) {
          throw addressIncomplete(
            "Enter a delivery pincode to see whether local delivery is available."
          )
        }
        const localWarehouse = warehouses.find(
          (w: any) => w.pincode === deliveryPincode
        )
        if (!localWarehouse) {
          throw notServiceable(
            `Local delivery is not available for pincode ${deliveryPincode}.`
          )
        }
      }

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
              throw blocked(
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
        const length = item.variant?.length || FALLBACK_DIMENSION_CM
        const width = item.variant?.width || FALLBACK_DIMENSION_CM
        const height = item.variant?.height || FALLBACK_DIMENSION_CM

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

      // Every parcel this order will move as, in the order they were priced.
      const shipments: ShipmentRate[] = []

      let standardShippingCost = 0

      if (standardItems.length > 0) {
        const packedBoxes = await this.svc_.getBoxFit(
          standardItems,
          settings.volumetric_divisor
        )

        for (const packed of packedBoxes) {
          const rate = await this.getShippingRate(
            originPincode,
            deliveryPincode,
            packed.chargeableWeight,
            settings,
            packed.box,
            tier
          )
          standardShippingCost += rate.amount
          shipments.push(rate)
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

        const rate = await this.getShippingRate(
          originPincode,
          deliveryPincode,
          chargeableWeight,
          settings,
          null,
          tier
        )
        separateShippingCost += rate.amount
        shipments.push(rate)
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

      // Both sides are plain major-unit amounts (Medusa v2 stores decimals, not
      // minor units), so they compare directly.
      if (Number(settings.free_shipping_threshold) > 0) {
        if (
          cartGoodsValue >= Number(settings.free_shipping_threshold) &&
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
      // FINAL: round to the currency's minor unit
      // ================================================================
      // Medusa v2 stores monetary amounts as decimals in the major unit, so a
      // 99 rupee rate is `99` — not `9900`. Only round off sub-paisa drift
      // introduced by the percentage markups above.

      calculated_amount = Math.round(calculated_amount * 100) / 100
      if (!Number.isFinite(calculated_amount) || calculated_amount < 0) {
        calculated_amount = 0
      }

      // The order is not delivered until its slowest parcel arrives, so a split
      // shipment is quoted at the longest leg, not the shortest.
      const days = shipments
        .map((sm) => sm.estimated_delivery_days)
        .filter((d): d is number => typeof d === "number")
      estimated_delivery_days = days.length ? Math.max(...days) : undefined

      // The whole storefront quotes GST-inclusive prices because that is what
      // an Indian MRP is. Returning a net shipping rate here made the delivery
      // step say Rs 339.36 while the order summary said Rs 400.44 for the same
      // line. Gross it up and tell Medusa the price already contains tax, so it
      // extracts GST instead of adding it — same money, one number.
      const taxRate = await this.getShippingTaxRate(cart)
      if (taxRate > 0) {
        calculated_amount =
          Math.round(calculated_amount * (1 + taxRate / 100) * 100) / 100
        is_calculated_price_tax_inclusive = true
      }

      // P4.2: masking is done through `courier_display_map`, which the merchant
      // fills in deliberately. The extension's `display_name` is not used here —
      // it defaults to the option's own name (mirror-shipping-option.ts), so
      // treating it as a courier alias would render "Standard Delivery ·
      // Standard Delivery" rather than the carrier actually carrying the parcel.
      const rawCourier = shipments.find((sm) => sm.courier_name)?.courier_name
      courier_name = rawCourier
        ? this.maskCourierName(rawCourier, settings.courier_display_map)
        : undefined
    } catch (e: any) {
      // Anything we already classified (blocked, not configured, not
      // serviceable, carrier down) is a real answer for the buyer and the
      // dashboard — surface it verbatim.
      if (isShippingUnavailableError(e)) {
        this.logger_.warn(
          `[ShippingOrchestrator] tier=${tier} unavailable (${e.code}): ${e.message}`
        )
        throw e
      }

      // Anything else is a genuine defect. Quoting an invented price here is
      // how a broken integration turns into an underpriced order, so refuse
      // instead and let the storefront say the option is unavailable.
      this.logger_.error(
        `[ShippingOrchestrator] tier=${tier} pricing failed: ${e.message}`
      )
      throw providerError(
        "Delivery charges could not be calculated right now. Please try again in a moment."
      )
    }

    // Extra keys ride along on `shipping_option.calculated_price` in the store
    // API, which is how the storefront receives them.
    return {
      calculated_amount,
      is_calculated_price_tax_inclusive,
      ...(courier_name ? { courier_name } : {}),
      ...(estimated_delivery_days !== undefined
        ? { estimated_delivery_days }
        : {}),
    } as CalculatedShippingOptionPrice
  }

  /**
   * Replace a raw carrier name with the merchant's white-label name.
   * Matching is substring-based so "Bluedart" covers "Blue Dart Surface".
   */
  private maskCourierName(
    rawName: string,
    displayMap: Record<string, string> | undefined
  ): string {
    const map = displayMap || {}
    const match = Object.entries(map).find(([raw]) =>
      rawName.toLowerCase().includes(raw.toLowerCase())
    )
    return match ? match[1] : rawName
  }

  // ------------------------------------------------------------------
  // Helper: Get shipping rate for a single box/shipment
  // ------------------------------------------------------------------

  private async getShippingRate(
    originPincode: string,
    deliveryPincode: string | undefined,
    chargeableWeightGrams: number,
    settings: any,
    box: any,
    tier: string = "standard"
  ): Promise<ShipmentRate> {
    // --- P2.2: Hyperlocal bypass ---
    // Scoped to the local-delivery tier. Applying it to every tier would make
    // Standard and Express silently collapse onto the hyperlocal flat rate
    // whenever the buyer happens to share the warehouse pincode.
    if (
      tier === "hyperlocal" &&
      settings.hyperlocal_enabled &&
      deliveryPincode &&
      originPincode === deliveryPincode
    ) {
      this.logger_.info(
        `[ShippingOrchestrator] Hyperlocal bypass: same pincode ${originPincode}`
      )
      return { amount: Number(settings.hyperlocal_flat_rate) || 0 }
    }

    // --- Merchant runs on their own slab table, no carrier API involved ---
    if (settings.active_provider === "manual_slabs") {
      return { amount: this.getFallbackRate(chargeableWeightGrams, settings) }
    }

    // Without a destination we cannot ask a carrier. Quote the slab rate as an
    // estimate if the merchant configured one, otherwise say what is missing.
    if (!deliveryPincode) {
      if (this.fallbackAvailable(settings)) {
        return { amount: this.getFallbackRate(chargeableWeightGrams, settings) }
      }
      throw addressIncomplete(
        "Enter your delivery pincode to see shipping charges."
      )
    }

    if (!this.hasCarrierCredentials(settings)) {
      if (this.fallbackAvailable(settings)) {
        return { amount: this.getFallbackRate(chargeableWeightGrams, settings) }
      }
      throw notConfigured(
        "No carrier account is connected and no fallback rate is configured. " +
          "Connect Shiprocket or enable the fallback slab under " +
          "Shipping Orchestrator \u2192 Core Engine."
      )
    }

    // --- Live Shiprocket API ---
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

      const srResponse = await this.svc_.shiprocketApi.checkServiceability(
        serviceabilityPayload,
        settings
      )

      const available = srResponse?.data?.available_courier_companies ?? []

      if (!available.length) {
        // The carrier answered and said nobody serves this route. That is a
        // real answer, not an outage, so do not paper over it with a slab.
        throw notServiceable(
          `No courier currently delivers to pincode ${deliveryPincode}.`
        )
      }

      // --- P4.1: Carrier Blacklisting ---
      // `filterCouriers` is async; awaiting it is what makes the blacklist
      // apply at all.
      const couriers = await this.svc_.filterCouriers(
        available,
        settings.carrier_blacklist || []
      )

      if (!couriers.length) {
        this.logger_.warn(
          `[ShippingOrchestrator] Every available courier for ${deliveryPincode} is blacklisted`
        )
        if (this.fallbackAvailable(settings)) {
          return { amount: this.getFallbackRate(chargeableWeightGrams, settings) }
        }
        throw notServiceable(
          `Delivery to pincode ${deliveryPincode} is not available with your current carrier settings.`
        )
      }

      // --- P4.2: Courier Masking is cosmetic; selection uses real data ---
      return this.pickCourier(couriers, tier)
    } catch (apiError: any) {
      // A classified answer (not serviceable, blacklisted out) must not be
      // downgraded into an outage.
      if (isShippingUnavailableError(apiError)) {
        throw apiError
      }

      this.logger_.warn(
        `[ShippingOrchestrator] Carrier lookup failed: ${apiError.message}`
      )

      if (this.fallbackAvailable(settings)) {
        return { amount: this.getFallbackRate(chargeableWeightGrams, settings) }
      }

      throw providerError(
        "The courier network is unreachable right now, and no fallback rate is configured."
      )
    }
  }

  /**
   * Standard buys the cheapest courier; Express buys the fastest one, breaking
   * ties on price. Without this the three tiers return identical rates.
   */
  private pickCourier(couriers: any[], tier: string): ShipmentRate {
    const etd = (c: any) =>
      Number(
        c.estimated_delivery_days ?? c.etd_hours ?? Number.MAX_SAFE_INTEGER
      )

    const sorted = [...couriers]

    if (tier === "express") {
      sorted.sort((a, b) => etd(a) - etd(b) || Number(a.rate) - Number(b.rate))
    } else {
      sorted.sort((a, b) => Number(a.rate) - Number(b.rate))
    }

    const chosen = sorted[0]
    const days = etd(chosen)

    return {
      amount: Number(chosen.rate),
      courier_name: chosen.courier_name,
      // MAX_SAFE_INTEGER is the "carrier gave us no estimate" sentinel from the
      // comparator above; do not present it as a delivery promise.
      estimated_delivery_days: Number.isFinite(days) && days < 365 ? days : undefined,
    }
  }

  /**
   * GST rate applied to shipping for this cart's destination.
   *
   * Shipping is not a product category, so the destination's default rate is
   * the one that applies. Returns 0 when no tax region is configured, which
   * leaves the quote tax-exclusive rather than inventing a rate.
   */
  private async getShippingTaxRate(cart: any): Promise<number> {
    const countryCode = cart?.shipping_address?.country_code
    if (!countryCode) return 0

    try {
      const taxService: any = appContainer.resolve(Modules.TAX)

      const regions = await taxService.listTaxRegions(
        { country_code: String(countryCode).toLowerCase() },
        { relations: ["tax_rates"] }
      )

      const defaultRate = regions?.[0]?.tax_rates?.find(
        (r: any) => r.is_default
      )

      return Number(defaultRate?.rate) || 0
    } catch (e: any) {
      this.logger_.warn(
        `[ShippingOrchestrator] Could not read the shipping tax rate, quoting exclusive of tax: ${e.message}`
      )
      return 0
    }
  }

  private hasCarrierCredentials(settings: any): boolean {
    const api = (settings?.api_settings as Record<string, any>) || {}
    return Boolean(api.shiprocket_email && api.shiprocket_password)
  }

  private fallbackAvailable(settings: any): boolean {
    return (
      settings?.fallback_enabled !== false &&
      Number(settings?.fallback_rate_per_500g) > 0
    )
  }

  /**
   * Merchant-configured slab used when the carrier API cannot answer, and as
   * the only rate source when `active_provider` is "manual_slabs".
   */
  private getFallbackRate(weightGrams: number, settings: any): number {
    const perSlab = Number(settings?.fallback_rate_per_500g) || 0
    const slabs = Math.max(1, Math.ceil(weightGrams / 500))
    return slabs * perSlab
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
    const warehouses = await listWarehouses(appContainer)
    const originWarehouse = primaryWarehouse(warehouses)

    /*
     * Measure the parcel the same way the quote did.
     *
     * This used to declare every shipment as a 10cm cube weighing half a kilo
     * per unit, while `calculatePrice` above priced the same order from real
     * variant weights and dimensions, bin-packed into configured boxes. So the
     * customer was quoted for one parcel and the courier was handed another —
     * a weight dispute on arrival, every time, and one that Shiprocket settles
     * by reweighing and charging the difference.
     *
     * Reading the same fields with the same fallbacks is what keeps the price
     * that was charged and the parcel that ships describing one object.
     * Medusa stores variant weight in grams and dimensions in centimetres;
     * Shiprocket wants kilograms and centimetres.
     */
    type ParcelItem = {
      shiprocket: {
        name: string
        sku: string
        units: number
        selling_price: number
        discount: string
        tax: string
        hsn: string
      }
      /** Grams, per unit. */
      weight: number
      length: number
      width: number
      height: number
      quantity: number
      /** What this line actually contributes to the declared value. */
      value: number
      ref: string
    }

    const standardItems: ParcelItem[] = []
    const separateItems: ParcelItem[] = []

    /*
     * The fulfilment items are not enough on their own.
     *
     * `FulfillmentItemDTO` carries only id, title, sku, quantity, barcode and
     * `line_item_id` — no variant, no price. The order's line items add the
     * money and a `variant_id`, but still no weight or dimensions. So this
     * reads across all three: the fulfilment item says what is being shipped,
     * the order line says what it was sold for, and the variant has to be
     * fetched to find out how big it is.
     *
     * The previous code read `item.variant.product.metadata` straight off the
     * fulfilment item. That is always undefined, which is why `ships_separately`
     * has never once taken effect here and every order shipped as a single
     * parcel with `selling_price: 0` on every line.
     */
    const orderLines = new Map<string, any>(
      ((order.items as any[]) ?? []).map((line) => [line.id, line])
    )

    const variantIds = [
      ...new Set(
        items
          .map(
            (i) => orderLines.get((i as any).line_item_id ?? "")?.variant_id
          )
          .filter(Boolean)
      ),
    ] as string[]

    const variants = new Map<string, any>()
    const query = this.query_()

    if (query && variantIds.length > 0) {
      try {
        const { data } = await query.graph({
          entity: "product_variant",
          filters: { id: variantIds },
          fields: [
            "id",
            "weight",
            "length",
            "width",
            "height",
            "hs_code",
            "metadata",
            "product.metadata",
          ],
        })

        for (const variant of data ?? []) {
          variants.set(variant.id, variant)
        }
      } catch (e: any) {
        /*
         * Soft, because a parcel measured by fallback still ships, and refusing
         * to fulfil an order because a lookup failed is the worse outcome. The
         * warning matters though: every parcel in this fulfilment is about to be
         * declared at the fallback size.
         */
        this.logger_.warn(
          `[ShippingOrchestrator] Could not load variant dimensions for order ${order.id}, ` +
            `declaring fallback sizes: ${e.message}`
        )
      }
    }

    for (const i of items) {
      const orderLine = orderLines.get((i as any).line_item_id ?? "") ?? {}
      const variant = variants.get(orderLine.variant_id) ?? {}

      /*
       * `total` is what the line came to after discounts and — on this
       * tax-inclusive store — including GST, so it is what the customer
       * actually paid and therefore what the parcel is worth. `unit_price`
       * times quantity is the fallback for an order line that carried no
       * totals.
       */
      const orderedQuantity = orderLine.quantity || i.quantity || 1
      const shippedQuantity = i.quantity ?? 1

      const lineTotal =
        typeof orderLine.total === "number"
          ? orderLine.total
          : (orderLine.unit_price || 0) * orderedQuantity

      /*
       * Per unit, because a fulfilment can ship part of a line. Declaring the
       * whole line's value on a parcel carrying two of five units overstates
       * what is in the box, which matters when the courier loses it.
       */
      const perUnitValue = lineTotal / orderedQuantity

      standardOrSeparate(variant, {
        shiprocket: {
          name: i.title || "Item",
          sku: i.sku || i.id || "",
          units: shippedQuantity,
          // Consistent with the declared value below, so Shiprocket's own sum
          // of the lines agrees with `sub_total`.
          selling_price: Number(perUnitValue.toFixed(2)),
          discount: "",
          tax: "",
          hsn: (variant.hs_code as string) || "",
        },
        weight: variant.weight || settings.fallback_weight_grams,
        length: variant.length || FALLBACK_DIMENSION_CM,
        width: variant.width || FALLBACK_DIMENSION_CM,
        height: variant.height || FALLBACK_DIMENSION_CM,
        quantity: shippedQuantity,
        value: perUnitValue * shippedQuantity,
        ref: i.id || i.sku || i.title || "item",
      })
    }

    function standardOrSeparate(variant: any, parcelItem: ParcelItem) {
      const productMeta = variant?.product?.metadata || {}
      const variantMeta = variant?.metadata || {}
      // Variant wins over product, so one variant of a product can be flagged
      // without flagging the rest.
      const metadata = { ...productMeta, ...variantMeta }

      if (
        metadata.ships_separately === "true" ||
        metadata.ships_separately === true
      ) {
        separateItems.push(parcelItem)
      } else {
        standardItems.push(parcelItem)
      }
    }

    const allResponses: any[] = []
    // Carried onto the fulfilment so the ship action can re-check
    // serviceability for the parcel that actually exists, rather than
    // guessing a weight all over again.
    let totalChargeableKg = 0

    const pushToShiprocket = async (
      parcelItems: ParcelItem[],
      suffix: string,
      warehouse: any,
      /** The box this parcel was packed into, when one is configured. */
      box: { length_cm: number; width_cm: number; height_cm: number } | null
    ) => {
      /*
       * Shiprocket identifies a pickup point by the nickname it holds in their
       * panel, which is rarely the name Medusa gives the same location. Sending
       * the Medusa name gets the order rejected for an unknown pickup location,
       * so the mapped nickname wins and the name is only the fallback for when
       * the two already agree.
       */
      const pickupLocation =
        warehouse?.shiprocket_pickup_location || warehouse?.name || "Primary"

      // Grams to kilograms, and never zero — Shiprocket rejects a weightless
      // parcel, and a missing weight is a data gap rather than a free shipment.
      const grams = parcelItems.reduce(
        (sum, item) => sum + item.weight * item.quantity,
        0
      )
      const weight = Math.max(grams / 1000, 0.01)

      /*
       * The box the goods are packed in decides the volumetric weight, so its
       * dimensions are what Shiprocket must be told. With no box configured
       * there is nothing to pack into, and the parcel is described by the goods
       * themselves: widest and longest item, stacked heights.
       */
      const dimensions = box
        ? { length: box.length_cm, breadth: box.width_cm, height: box.height_cm }
        : {
            length: Math.max(...parcelItems.map((i) => i.length)),
            breadth: Math.max(...parcelItems.map((i) => i.width)),
            height: parcelItems.reduce(
              (sum, i) => sum + i.height * i.quantity,
              0
            ),
          }

      // What the goods in this parcel are worth, which is not the order total:
      // a split shipment declares only its own share, and shipping is not goods.
      const subTotal = Number(
        parcelItems.reduce((sum, item) => sum + item.value, 0).toFixed(2)
      )

      const volumetricWeight =
        (dimensions.length * dimensions.breadth * dimensions.height) /
        (settings.volumetric_divisor || 5000)

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
        order_items: parcelItems.map((item) => item.shiprocket),
        payment_method: "Prepaid",
        sub_total: subTotal,
        ...dimensions,
        weight,
      }

      /*
       * Both weights are logged because Shiprocket bills on the greater of the
       * two, and which one wins is the difference between the quoted price and
       * the invoice. When a light, bulky machine is charged on volume, this
       * line is where that becomes visible without opening their panel.
       */
      this.logger_.info(
        `[ShippingOrchestrator] Creating Shiprocket order ${payload.order_id}: ` +
          `${weight.toFixed(2)}kg dead, ${volumetricWeight.toFixed(2)}kg volumetric ` +
          `(${dimensions.length}x${dimensions.breadth}x${dimensions.height}cm), ` +
          `declared ${subTotal}, pickup "${pickupLocation}"`
      )

      totalChargeableKg += Math.max(weight, volumetricWeight)

      return await this.svc_.shiprocketApi.createOrder(payload, settings)
    }

    /*
     * One Shiprocket order per box the goods were actually packed into, using
     * the same packer that priced them. It used to be one order for all
     * standard items regardless: an order the quote had split across two boxes
     * shipped as a single parcel whose declared size fitted neither.
     */
    if (standardItems.length > 0) {
      const packedBoxes = await this.svc_.getBoxFit(
        standardItems.map((item) => ({
          length: item.length,
          width: item.width,
          height: item.height,
          weight: item.weight,
          quantity: item.quantity,
          ref: item.ref,
        })),
        settings.volumetric_divisor
      )

      for (const [index, packed] of packedBoxes.entries()) {
        // The packer works in units, so a line split across boxes appears in
        // each of them; the counts here are what actually went in this one.
        const contents = standardItems
          .map((item) => {
            const units = packed.items.filter((ref) => ref === item.ref).length
            if (units === 0) {
              return null
            }

            return {
              ...item,
              quantity: units,
              value: (item.value / item.quantity) * units,
              shiprocket: { ...item.shiprocket, units },
            }
          })
          .filter((item): item is ParcelItem => item !== null)

        if (contents.length === 0) {
          continue
        }

        const response = await pushToShiprocket(
          contents,
          packedBoxes.length > 1 ? `STD${index + 1}` : "STD",
          originWarehouse,
          packed.box
        )
        allResponses.push(response)
      }
    }

    // Separate items each in their own box
    let splitCounter = 1
    for (const sepItem of separateItems) {
      const response = await pushToShiprocket(
        [sepItem],
        `SPLIT${splitCounter}`,
        originWarehouse,
        null
      )
      allResponses.push(response)
      splitCounter++
    }

    // --- P2.3: Drop-shipping webhook ---
    if (originWarehouse?.is_drop_ship && originWarehouse?.vendor_webhook_url) {
      try {
        await fetch(originWarehouse.vendor_webhook_url, {
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
          `[ShippingOrchestrator] Drop-ship webhook dispatched to ${originWarehouse.vendor_webhook_url}`
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
        chargeable_weight_kg: Number(totalChargeableKg.toFixed(3)),
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
