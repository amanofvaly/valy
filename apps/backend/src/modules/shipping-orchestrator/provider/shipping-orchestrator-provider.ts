import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"
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
  Logger
} from "@medusajs/framework/types"
import { ShiprocketAPI } from "./shiprocket-api"

type InjectedDependencies = {
  logger: Logger,
  shippingOrchestratorModuleService: any
}

export default class ShippingOrchestratorProvider extends AbstractFulfillmentProviderService {
  static identifier = "shipping-orchestrator"
  protected logger_: Logger
  protected orchestratorService_: any

  constructor({ logger, shippingOrchestratorModuleService }: InjectedDependencies) {
    super()
    this.logger_ = logger
    this.orchestratorService_ = shippingOrchestratorModuleService
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      {
        id: "shiprocket-standard",
        name: "Shiprocket Standard",
        is_calculated: true,
      },
      {
        id: "manual-fallback",
        name: "Manual Rates Fallback",
        is_calculated: false,
      }
    ]
  }

  async validateFulfillmentData(optionData: Record<string, unknown>, data: Record<string, unknown>, context: ValidateFulfillmentDataContext): Promise<any> {
    return data
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    return true
  }

  async canCalculate(data: CreateShippingOptionDTO): Promise<boolean> {
    return true
  }

  async calculatePrice(
    optionData: CalculateShippingOptionPriceDTO["optionData"], 
    data: CalculateShippingOptionPriceDTO["data"], 
    context: any // CalculateShippingOptionPriceContext
  ): Promise<CalculatedShippingOptionPrice> {
    
    let calculated_amount = 0
    let is_calculated_price_tax_inclusive = false

    try {
      this.logger_.info(`Shipping Orchestrator: Incoming calculatePrice request for option ${optionData?.id}`)
      
      const cart = context.cart
      if (!cart) throw new Error("No cart in context")

      // Fetch dynamic settings from our Admin CRUD
      let [settings] = await this.orchestratorService_.listShippingOrchestratorSettings()
      if (!settings) {
         settings = { volumetric_divisor: 5000, fallback_weight_grams: 500, free_shipping_threshold: 0, global_markup_type: "none", global_markup_value: 0 }
      }

      const rules = await this.orchestratorService_.listShippingRules()

      // --- ALGORITHM STEP 1: Identify Items & Volumetric Weight ---
      let totalWeightGrams = 0
      let totalVolume = 0
      let categoryFlatFeeApplied = false
      let categoryFlatFeeAmount = 0
      let cartSubtotal = cart.total || 0 // Medusa subtotal is already in cents, but for logic we use it as is
      
      // We need to resolve cart items categories.
      // Medusa v2 cart.items don't automatically populate deep product.categories unless specified.
      // We will assume they are there, or fetch them if needed. 

      for (const item of cart.items || []) {
        const metadata = item.variant?.product?.metadata || {}
        
        if (metadata.free_shipping === "true" || metadata.free_shipping === true) {
            continue 
        }

        if (metadata.shipping_flat_override) {
             calculated_amount += Number(metadata.shipping_flat_override) * item.quantity
             continue 
        }

        // Check Category Rules from DB
        const itemCategories = item.variant?.product?.categories || []
        for (const cat of itemCategories) {
           const rule = rules.find((r: any) => r.target_type === "category" && r.target_id === cat.id)
           if (rule && rule.rule_type === "force_flat_rate") {
              categoryFlatFeeApplied = true
              categoryFlatFeeAmount += Number(rule.value?.action_value || 0) * item.quantity
           }
        }

        const weight = item.variant?.weight || settings.fallback_weight_grams
        const length = item.variant?.length || 10
        const width = item.variant?.width || 10
        const height = item.variant?.height || 10

        // Box Separation Logic
        if (metadata.ships_separately === "true" || metadata.ships_separately === true) {
           // This item must travel in its own box. We calculate its dimensional weight immediately.
           const itemVolWeight = ((length * width * height) / settings.volumetric_divisor) * 1000
           const itemChargeable = Math.max(weight, itemVolWeight)
           
           // We add its API rate immediately (assuming ₹45/500g fallback for now, later fetched via API array)
           calculated_amount += Math.ceil(itemChargeable / 500) * 45 * item.quantity
           continue // Do not add to the generic global box
        }

        totalWeightGrams += weight * item.quantity
        totalVolume += (length * width * height) * item.quantity
      }

      // Volumetric Math using DB divisor for the remaining standard items
      const volumetricWeightGrams = (totalVolume / settings.volumetric_divisor) * 1000 
      const chargeableWeight = Math.max(totalWeightGrams, volumetricWeightGrams)

      if (categoryFlatFeeApplied) {
        calculated_amount += categoryFlatFeeAmount
      }

      // --- ALGORITHM STEP 3: Live API / Fallback Engine ---
      let baseApiRate = 0
      
      if (!categoryFlatFeeApplied && calculated_amount === 0) {
        const delivery_postcode = cart.shipping_address?.postal_code

        if (delivery_postcode) {
           try {
              const pickup_postcode = "110030" 
              const serviceabilityPayload = {
                pickup_postcode,
                delivery_postcode,
                weight: chargeableWeight / 1000, 
                cod: 0 
              }
              
              const srResponse = await ShiprocketAPI.checkServiceability(serviceabilityPayload)
              if (srResponse && srResponse.data && srResponse.data.available_courier_companies?.length > 0) {
                 const cheapestCourier = srResponse.data.available_courier_companies.sort((a: any, b: any) => a.rate - b.rate)[0]
                 baseApiRate = cheapestCourier.rate
              } else {
                 throw new Error("No courier found for this route")
              }
           } catch (apiError) {
              baseApiRate = (chargeableWeight / 500) * 45 
           }
        } else {
           baseApiRate = (chargeableWeight / 500) * 45
        }
        
        calculated_amount += baseApiRate
      }

      // --- ALGORITHM STEP 4: Global Markups & Free Thresholds ---
      
      // Apply Markups
      if (settings.global_markup_type === "flat") {
         calculated_amount += Number(settings.global_markup_value)
      } else if (settings.global_markup_type === "percentage") {
         calculated_amount += calculated_amount * (Number(settings.global_markup_value) / 100)
      }

      // Free Shipping Threshold (convert threshold to cents to match cart subtotal, or vice versa)
      // Assuming cart.total is in cents (e.g. 199900 = ₹1999) and threshold is in whole units (₹1999)
      if (settings.free_shipping_threshold > 0) {
         const thresholdInCents = settings.free_shipping_threshold * 100
         if (cartSubtotal >= thresholdInCents) {
            calculated_amount = 0
         }
      }

      calculated_amount = Math.round(calculated_amount * 100) 

    } catch (e) {
      this.logger_.error(`Shipping Orchestrator Error: ${e.message}`)
      calculated_amount = 99900 
    }

    return {
      calculated_amount,
      is_calculated_price_tax_inclusive
    }
  }

  async createFulfillment(
    data: Record<string, unknown>, 
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[], 
    order: Partial<FulfillmentOrderDTO> | undefined, 
    fulfillment: Partial<Omit<FulfillmentDTO, "provider_id" | "data" | "items">>, 
    additionalData?: Record<string, unknown>
  ): Promise<CreateFulfillmentResult> {
    
    try {
      if (!order) throw new Error("Order context is required to create Shiprocket fulfillment")

      // Extract delivery address
      const deliveryAddress = order.shipping_address as any
      if (!deliveryAddress) throw new Error("Shipping address is missing from the order")

      const standardItems: any[] = []
      const separateItems: any[] = []

      // Map Medusa items to Shiprocket items and categorize them
      for (const i of items) {
        const srItem = {
          name: i.title || "Item",
          sku: i.sku || i.id,
          units: i.quantity,
          selling_price: i.unit_price || 0,
          discount: '',
          tax: '',
          hsn: ''
        }

        // Check if item needs its own box (ships_separately)
        const metadata = (i as any).variant?.product?.metadata || {}
        if (metadata.ships_separately === "true" || metadata.ships_separately === true) {
           separateItems.push(srItem)
        } else {
           standardItems.push(srItem)
        }
      }

      const totalWeightKg = 0.5 
      const allResponses: any[] = []

      // Helper function to push to SR
      const pushToSR = async (orderItems: any[], suffix: string) => {
         const payload = {
            order_id: `SR-${order.id}-${suffix}`,
            order_date: new Date().toISOString().split('T')[0],
            pickup_location: "Primary",
            billing_customer_name: deliveryAddress.first_name || "Customer",
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
            length: 10, breadth: 10, height: 10,
            weight: totalWeightKg
         }
         this.logger_.info(`Pushing Order to Shiprocket: ${payload.order_id}`)
         return await ShiprocketAPI.createOrder(payload)
      }

      // Push standard items in one box
      if (standardItems.length > 0) {
         const srResponse = await pushToSR(standardItems, "STD")
         allResponses.push(srResponse)
      }

      // Push separate items each in their own box
      let splitCounter = 1
      for (const sepItem of separateItems) {
         // If a separate item has quantity > 1, do we put them in same box or split?
         // Usually ships_separately means each unit is its own box if it's large, but let's bundle the units of that SKU.
         const srResponse = await pushToSR([sepItem], `SPLIT${splitCounter}`)
         allResponses.push(srResponse)
         splitCounter++
      }

      // Return combined metadata back to Medusa
      return {
        data: {
          ...data,
          shiprocket_order_ids: allResponses.map(r => r.order_id).join(","),
          shiprocket_shipment_ids: allResponses.map(r => r.shipment_id).join(","),
          shiprocket_awb_codes: allResponses.map(r => r.awb_code).join(",")
        }
      }
    } catch (e) {
      this.logger_.error(`Failed to create Shiprocket fulfillment: ${e.message}`)
      throw e
    }
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<any> {
    return {}
  }
}
