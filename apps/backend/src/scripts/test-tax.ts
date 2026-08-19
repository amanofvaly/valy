import { Modules } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

export default async function myScript({
  container,
}: {
  container: MedusaContainer
}) {
  const taxModuleService = container.resolve(Modules.TAX)
  
  try {
      const providers = await taxModuleService.listTaxProviders({})
      console.log("Providers available:", providers.map(p => p.id))
      
      let taxRegions = await taxModuleService.listTaxRegions({ country_code: "in" })
      if (taxRegions.length === 0) {
          taxRegions = await taxModuleService.createTaxRegions([{
              country_code: "in"
          }])
          console.log("Created tax region without provider:", taxRegions)
      }
  } catch(e) {
      console.error("ERROR", e)
  }
}
