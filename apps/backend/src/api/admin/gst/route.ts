import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { INDIA_GST_MODULE } from "../../../modules/india-gst"
import { saveGstSettingsWorkflow } from "../../../workflows/save-gst-settings"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const indiaGstModuleService = req.scope.resolve(INDIA_GST_MODULE)
  const taxModuleService = req.scope.resolve(Modules.TAX)
  
  const settings = await indiaGstModuleService.listGstSettings()
  
  // Fetch native tax rates for India to get the default rate and category overrides
  const taxRegions: any[] = await taxModuleService.listTaxRegions({ country_code: "in" }, { relations: ["tax_rates", "tax_rates.rules"] })
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
  const { origin_state_code, company_gstin, defaultRate, categoryRates } = req.body as any

  const { result } = await saveGstSettingsWorkflow(req.scope).run({
    input: {
      origin_state_code,
      company_gstin,
      defaultRate,
      categoryRates: categoryRates || [],
    },
  })

  res.json({ settings: result, message: "Settings and tax rules orchestrated successfully." })
}
