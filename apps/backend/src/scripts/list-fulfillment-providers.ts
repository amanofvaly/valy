import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function listProviders({
  container,
}: {
  container: MedusaContainer
}) {
  const fulfillmentService = container.resolve(Modules.FULFILLMENT) as any
  const providers = await fulfillmentService.listFulfillmentProviders({})
  console.log(
    "Fulfillment providers registered:",
    JSON.stringify(
      providers.map((p: any) => ({ id: p.id, is_enabled: p.is_enabled })),
      null,
      2
    )
  )
}
