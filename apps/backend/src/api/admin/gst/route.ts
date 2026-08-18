import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { INDIA_GST_MODULE } from "../../../modules/india-gst"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const indiaGstModuleService = req.scope.resolve(INDIA_GST_MODULE)
  const taxModuleService = req.scope.resolve(Modules.TAX)
  
  const settings = await indiaGstModuleService.listGstSettings()
  
  // Fetch native tax rates for India to get the default rate and category overrides
  const taxRegions = await taxModuleService.listTaxRegions({ country_code: "in" }, { relations: ["tax_rates", "tax_rates.rules"] })
  let defaultRate = 18
  let categoryRates = []

  if (taxRegions.length > 0) {
    const defaultTaxRate = taxRegions[0].tax_rates?.find(tr => tr.is_default)
    if (defaultTaxRate) {
        defaultRate = defaultTaxRate.rate
    }
    
    categoryRates = taxRegions[0].tax_rates?.filter(tr => !tr.is_default && tr.rules?.some(r => r.reference === "product_category")).map(tr => {
        const catRule = tr.rules.find(r => r.reference === "product_category")
        return {
            category_id: catRule.reference_id,
            rate: tr.rate
        }
    }) || []
  }

  const responseSettings = settings.length ? settings[0] : { origin_state_code: "07", company_gstin: null }

  res.json({ 
    settings: responseSettings,
    defaultRate,
    categoryRates
  })
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const indiaGstModuleService = req.scope.resolve(INDIA_GST_MODULE)
  const taxModuleService = req.scope.resolve(Modules.TAX)
  const productModuleService = req.scope.resolve(Modules.PRODUCT)

  const { origin_state_code, company_gstin, defaultRate, categoryRates } = req.body as any

  // 1. Save Custom Settings (GSTIN & State Code)
  const settings = await indiaGstModuleService.listGstSettings()
  let updated
  if (settings.length) {
    updated = await indiaGstModuleService.updateGstSettings({
        id: settings[0].id,
        origin_state_code,
        company_gstin
    })
  } else {
    updated = await indiaGstModuleService.createGstSettings({
      origin_state_code,
      company_gstin
    })
  }

  // Helper for recursion
  const allCategories = await productModuleService.listProductCategories({}, { take: 1000 })
  function getDescendantCategoryIds(categoryId: string): string[] {
      const children = allCategories.filter(c => c.parent_category_id === categoryId)
      let ids = children.map(c => c.id)
      for (const child of children) {
          ids = ids.concat(getDescendantCategoryIds(child.id))
      }
      return ids
  }

  // 2. Orchestrate Native Tax Engine
  let taxRegions = await taxModuleService.listTaxRegions({ country_code: "in" }, { relations: ["tax_rates", "tax_rates.rules"] })
  
  const providers = await taxModuleService.listTaxProviders({})
  const gstProvider = providers.find(p => p.id.includes("india-gst"))
  const providerId = gstProvider ? gstProvider.id : undefined;

  if (taxRegions.length === 0) {
      taxRegions = await taxModuleService.createTaxRegions([{
          country_code: "in",
          provider_id: providerId
      }])
      // Re-fetch to ensure relations are present
      taxRegions = await taxModuleService.listTaxRegions({ country_code: "in" }, { relations: ["tax_rates", "tax_rates.rules"] })
  } else if (providerId && taxRegions[0].provider_id !== providerId) {
      // Ensure the provider is correctly linked if it wasn't
      await taxModuleService.updateTaxRegions({ id: taxRegions[0].id, provider_id: providerId })
  }

  if (taxRegions.length > 0) {
    const region = taxRegions[0]
    
    // Manage Default Rate
    const defaultTaxRate = region.tax_rates?.find(tr => tr.is_default)
    if (defaultTaxRate) {
        await taxModuleService.updateTaxRates({ id: defaultTaxRate.id, rate: defaultRate })
    } else {
        await taxModuleService.createTaxRates([{
            tax_region_id: region.id,
            name: "Default GST",
            code: "GST_DEFAULT",
            rate: defaultRate,
            is_default: true
        }])
    }

    // Manage Category Overrides
    const existingCategoryRates = region.tax_rates?.filter(tr => !tr.is_default && tr.rules?.some(r => r.reference === "product_category")) || []
    if (existingCategoryRates.length > 0) {
        await taxModuleService.deleteTaxRates(existingCategoryRates.map(tr => tr.id))
    }

    if (categoryRates && categoryRates.length > 0) {
        const ratesToCreateMap = new Map<string, any>()

        for (const cr of categoryRates) {
            ratesToCreateMap.set(cr.category_id, {
                tax_region_id: region.id,
                name: `GST Category Override`,
                code: `GST_CAT_${cr.category_id}`,
                rate: cr.rate,
                is_default: false,
                rules: [{ reference: "product_category", reference_id: cr.category_id }]
            })

            if (cr.is_recursive) {
                const descendantIds = getDescendantCategoryIds(cr.category_id)
                for (const descId of descendantIds) {
                    ratesToCreateMap.set(descId, {
                        tax_region_id: region.id,
                        name: `GST Category Override`,
                        code: `GST_CAT_${descId}`,
                        rate: cr.rate,
                        is_default: false,
                        rules: [{ reference: "product_category", reference_id: descId }]
                    })
                }
            }
        }

        const ratesToCreate = Array.from(ratesToCreateMap.values())
        if (ratesToCreate.length > 0) {
            await taxModuleService.createTaxRates(ratesToCreate)
        }
    }
  }

  res.json({ settings: updated, message: "Settings and tax rules orchestrated successfully." })
}
