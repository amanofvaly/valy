import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// ====================================================================
// Turn Cashfree on for every region that bills in INR.
//
// Registering the provider in `medusa-config.ts` makes Medusa aware of it;
// it does not make it selectable. A payment provider is offered at checkout
// only where a region links to it, and that link is a row rather than a
// setting — which means a fresh environment has the provider installed,
// configured, and invisible to customers until this runs.
//
// Idempotent: regions that already have it are left alone, so this is safe
// to run on every deploy.
//
//   pnpm exec medusa exec ./src/scripts/enable-cashfree.ts
//
// The equivalent by hand is Admin → Settings → Regions → India → Payment
// providers. This exists so that production does not depend on somebody
// remembering to do that.
// ====================================================================

const PROVIDER_ID = "pp_cashfree_cashfree"

export default async function enableCashfree({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const regionModule = container.resolve(Modules.REGION)
  const paymentModule = container.resolve(Modules.PAYMENT)

  const providers = await paymentModule.listPaymentProviders({
    id: PROVIDER_ID,
  })

  if (!providers.length) {
    logger.error(
      `${PROVIDER_ID} is not registered. Check the payment module's providers in medusa-config.ts, and that CASHFREE_APP_ID and CASHFREE_SECRET_KEY are set — the provider refuses to load without them.`
    )
    return
  }

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "payment_providers.id"],
  })

  const inrRegions = regions.filter(
    (region: { currency_code: string }) =>
      region.currency_code?.toLowerCase() === "inr"
  )

  if (!inrRegions.length) {
    logger.warn("No INR region found, so there is nothing to enable Cashfree on.")
    return
  }

  for (const region of inrRegions) {
    const existing: string[] = (region.payment_providers ?? [])
      .map((provider) => provider?.id)
      .filter((id): id is string => Boolean(id))

    if (existing.includes(PROVIDER_ID)) {
      logger.info(`${region.name}: Cashfree already enabled.`)
      continue
    }

    await regionModule.updateRegions(region.id as string, {
      payment_providers: [...existing, PROVIDER_ID],
    } as never)

    logger.info(`${region.name}: Cashfree enabled.`)
  }
}
