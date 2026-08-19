import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { INDIA_GST_MODULE } from "../modules/india-gst"

// ====================================================================
// Input Type
// ====================================================================

type SaveGstSettingsInput = {
  origin_state_code: string
  company_gstin: string | null
  defaultRate: number
  categoryRates: Array<{
    category_id: string
    rate: number
    is_recursive?: boolean
  }>
}

// ====================================================================
// Step 1: Upsert GST custom settings (GSTIN + State Code)
// ====================================================================

const upsertGstSettingsStep = createStep(
  "upsert-gst-settings",
  async (input: { origin_state_code: string; company_gstin: string | null }, { container }) => {
    const indiaGstModuleService = container.resolve(INDIA_GST_MODULE)

    const settings = await indiaGstModuleService.listGstSettings()
    let result

    if (settings.length) {
      result = await indiaGstModuleService.updateGstSettings({
        id: settings[0].id,
        origin_state_code: input.origin_state_code,
        company_gstin: input.company_gstin,
      })
    } else {
      result = await indiaGstModuleService.createGstSettings({
        origin_state_code: input.origin_state_code,
        company_gstin: input.company_gstin,
      })
    }

    return new StepResponse(result)
  }
)

// ====================================================================
// Step 2: Ensure India tax region exists with the GST provider
// ====================================================================

const ensureTaxRegionStep = createStep(
  "ensure-tax-region",
  async (_input: Record<string, never>, { container }) => {
    const taxModuleService = container.resolve(Modules.TAX)

    const providers = await taxModuleService.listTaxProviders({})
    const gstProvider = providers.find((p: any) => p.id.includes("india-gst"))
    const providerId = gstProvider ? gstProvider.id : undefined

    let taxRegions = await taxModuleService.listTaxRegions(
      { country_code: "in" },
      { relations: ["tax_rates", "tax_rates.rules"] }
    )

    if (taxRegions.length === 0) {
      await taxModuleService.createTaxRegions([{
        country_code: "in",
        provider_id: providerId,
      }])
      taxRegions = await taxModuleService.listTaxRegions(
        { country_code: "in" },
        { relations: ["tax_rates", "tax_rates.rules"] }
      )
    } else if (providerId && taxRegions[0].provider_id !== providerId) {
      await taxModuleService.updateTaxRegions({
        id: taxRegions[0].id,
        provider_id: providerId,
      })
      taxRegions = await taxModuleService.listTaxRegions(
        { country_code: "in" },
        { relations: ["tax_rates", "tax_rates.rules"] }
      )
    }

    return new StepResponse(taxRegions[0])
  }
)

// ====================================================================
// Step 3: Sync tax rates (default + category overrides)
// ====================================================================

const syncTaxRatesStep = createStep(
  "sync-tax-rates",
  async (
    input: {
      regionId: string
      defaultRate: number
      categoryRates: Array<{
        category_id: string
        rate: number
        is_recursive?: boolean
      }>
      existingTaxRates: any[]
    },
    { container }
  ) => {
    const taxModuleService = container.resolve(Modules.TAX)
    const productModuleService = container.resolve(Modules.PRODUCT)
    const allCategories = await productModuleService.listProductCategories({}, { take: 1000 })

    // --- Default Rate ---
    const defaultTaxRate = input.existingTaxRates?.find((tr: any) => tr.is_default)
    if (defaultTaxRate) {
      await taxModuleService.updateTaxRates(
        defaultTaxRate.id,
        { rate: input.defaultRate }
      )
    } else {
      await taxModuleService.createTaxRates([{
        tax_region_id: input.regionId,
        name: "Default GST",
        code: "GST_DEFAULT",
        rate: input.defaultRate,
        is_default: true,
      }])
    }

    // --- Category Overrides: delete existing, then create new ---
    const existingCategoryRates = input.existingTaxRates?.filter(
      (tr: any) => !tr.is_default && tr.rules?.some((r: any) => r.reference === "product_category")
    ) || []

    if (existingCategoryRates.length > 0) {
      await taxModuleService.deleteTaxRates(existingCategoryRates.map((tr: any) => tr.id))
    }

    if (input.categoryRates && input.categoryRates.length > 0) {
      // Helper: get descendant category IDs
      function getDescendantCategoryIds(categoryId: string): string[] {
        const children = allCategories.filter(
          (c: any) => c.parent_category_id === categoryId
        )
        let ids = children.map((c: any) => c.id)
        for (const child of children) {
          ids = ids.concat(getDescendantCategoryIds(child.id))
        }
        return ids
      }

      const ratesToCreateMap = new Map<string, any>()

      for (const cr of input.categoryRates) {
        ratesToCreateMap.set(cr.category_id, {
          tax_region_id: input.regionId,
          name: "GST Category Override",
          code: `GST_CAT_${cr.category_id}`,
          rate: cr.rate,
          is_default: false,
          rules: [{ reference: "product_category", reference_id: cr.category_id }],
        })

        if (cr.is_recursive) {
          const descendantIds = getDescendantCategoryIds(cr.category_id)
          for (const descId of descendantIds) {
            ratesToCreateMap.set(descId, {
              tax_region_id: input.regionId,
              name: "GST Category Override",
              code: `GST_CAT_${descId}`,
              rate: cr.rate,
              is_default: false,
              rules: [{ reference: "product_category", reference_id: descId }],
            })
          }
        }
      }

      const ratesToCreate = Array.from(ratesToCreateMap.values())
      if (ratesToCreate.length > 0) {
        await taxModuleService.createTaxRates(ratesToCreate)
      }
    }

    return new StepResponse({ success: true })
  }
)

// ====================================================================
// Workflow: Save GST Settings
// ====================================================================

export const saveGstSettingsWorkflow = createWorkflow(
  "save-gst-settings",
  (input: SaveGstSettingsInput) => {
    const settings = upsertGstSettingsStep({
      origin_state_code: input.origin_state_code,
      company_gstin: input.company_gstin,
    })

    const region = ensureTaxRegionStep({})

    syncTaxRatesStep({
      regionId: region.id,
      defaultRate: input.defaultRate,
      categoryRates: input.categoryRates,
      existingTaxRates: (region as any).tax_rates,
    })

    return new WorkflowResponse(settings)
  }
)
