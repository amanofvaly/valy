import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import IndiaGstTaxProvider from "./india-gst-tax-provider"

export default ModuleProvider(Modules.TAX, {
  services: [IndiaGstTaxProvider],
})
