import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import {
  SHIPPING_ORCHESTRATOR_PROVIDER_ID,
  rulesForTier,
} from "../modules/shipping-orchestrator"
import { mirrorShippingOptionWorkflow } from "./mirror-shipping-option"

// ====================================================================
// Input
// ====================================================================

export type ProvisionNativeShippingInput = {
  stock_location_id: string
  warehouse_name: string
}

// ====================================================================
// Constants
// ====================================================================

const OWNED_BY = "shipping-orchestrator"
const TIERS = [
  { code: "standard", label: "Standard Delivery" },
  { code: "express", label: "Express Delivery" },
  { code: "hyperlocal", label: "Local Delivery" },
] as const

// ====================================================================
// Step: find our fulfillment provider id
// ====================================================================

const resolveProviderStep = createStep(
  "resolve-provider",
  async (_input: Record<string, never>, { container }) => {
    const fulfillmentService = container.resolve(Modules.FULFILLMENT) as any
    const providers = await fulfillmentService.listFulfillmentProviders({
      id: SHIPPING_ORCHESTRATOR_PROVIDER_ID,
    })
    if (!providers?.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Fulfillment provider ${SHIPPING_ORCHESTRATOR_PROVIDER_ID} not registered — check medusa-config.ts`
      )
    }
    return new StepResponse({ provider_id: providers[0].id })
  }
)

// ====================================================================
// Step: ensure default shipping profile
// ====================================================================

const ensureShippingProfileStep = createStep(
  "ensure-shipping-profile",
  async (_input: Record<string, never>, { container }) => {
    const fulfillmentService = container.resolve(Modules.FULFILLMENT) as any

    const profiles = await fulfillmentService.listShippingProfiles({})
    let profile = profiles.find((p: any) => p.type === "default") || profiles[0]

    if (!profile) {
      profile = await fulfillmentService.createShippingProfiles({
        name: "Default",
        type: "default",
      })
    }

    return new StepResponse({ shipping_profile_id: profile.id })
  }
)

// ====================================================================
// Step: ensure fulfillment set + service zone linked to the location
// ====================================================================

const ensureFulfillmentSetStep = createStep(
  "ensure-fulfillment-set",
  async (input: ProvisionNativeShippingInput, { container }) => {
    const fulfillmentService = container.resolve(Modules.FULFILLMENT) as any
    const link = container.resolve(ContainerRegistrationKeys.LINK) as any
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

    // 1. Find a fulfillment set linked to this location that we own
    const { data: linked } = await query.graph({
      entity: "stock_location",
      fields: ["id", "address.country_code", "fulfillment_sets.*"],
      filters: { id: input.stock_location_id },
    })

    const existingSets = (linked?.[0]?.fulfillment_sets || []).filter(
      (s: any) => s?.id
    )
    let ownedSet = existingSets.find(
      (s: any) => s.metadata?.owned_by === OWNED_BY
    )

    // A link outlives the record it points at, so a set that was deleted in
    // the native admin still shows up here. Building a service zone under it
    // fails with "fulfillment set does not exist"; treat it as absent and
    // provision a fresh one instead.
    if (ownedSet?.id) {
      const [live] = await fulfillmentService.listFulfillmentSets({
        id: ownedSet.id,
      })
      if (!live) {
        ownedSet = undefined
      }
    }

    // Names are labels: nothing keys off them, ownership lives in metadata.
    // They are set once, at creation, and never rewritten afterwards — an
    // existing name belongs to whoever set it. Renaming on every save is how
    // a cosmetic tidy-up took checkout down.
    const setName = `${input.warehouse_name} delivery`
    const zoneName = `${input.warehouse_name} area`

    // Which country this area covers. Taken from the warehouse's own address,
    // falling back to the countries the store actually sells to. It used to be
    // the literal "in", so a store deploying anywhere else silently got a
    // delivery area for India and no way to know why checkout was empty.
    let countryCode: string | undefined =
      linked?.[0]?.address?.country_code || undefined

    if (!countryCode) {
      const { data: regions } = await query.graph({
        entity: "region",
        fields: ["id", "countries.iso_2"],
      })
      countryCode = (regions ?? [])
        .flatMap((r: any) => r.countries ?? [])
        .map((c: any) => c.iso_2)
        .find(Boolean)
    }

    if (!ownedSet) {
      ownedSet = await fulfillmentService.createFulfillmentSets({
        name: setName,
        type: "shipping",
        metadata: { owned_by: OWNED_BY },
      })

      await link.create({
        [Modules.STOCK_LOCATION]: {
          stock_location_id: input.stock_location_id,
        },
        [Modules.FULFILLMENT]: {
          fulfillment_set_id: ownedSet.id,
        },
      })
    }

    // 2. Ensure a service zone exists
    const zones = await fulfillmentService.listServiceZones({
      fulfillment_set_id: ownedSet.id,
    })
    let zone = zones.find((z: any) => z.metadata?.owned_by === OWNED_BY) || zones[0]

    if (!zone) {
      zone = await fulfillmentService.createServiceZones({
        name: zoneName,
        fulfillment_set_id: ownedSet.id,
        metadata: { owned_by: OWNED_BY },
        geo_zones: countryCode
          ? [{ type: "country", country_code: countryCode }]
          : [],
      })
    }

    return new StepResponse({
      fulfillment_set_id: ownedSet.id,
      service_zone_id: zone.id,
    })
  }
)

// ====================================================================
// Step: ensure the location is reachable from the sales channels
// ====================================================================

const ensureSalesChannelLinkStep = createStep(
  "ensure-sales-channel-link",
  async (input: { stock_location_id: string }, { container }) => {
    const salesChannelService = container.resolve(Modules.SALES_CHANNEL) as any
    const link = container.resolve(ContainerRegistrationKeys.LINK) as any
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

    // Checkout only reaches a fulfillment set through
    // sales channel -> stock location -> fulfillment set. Provisioning the
    // set without this link leaves the store with no shipping options at all
    // and nothing in the response to explain why, so it has to be part of
    // provisioning rather than a manual step in the native admin.
    const { data: linked } = await query.graph({
      entity: "stock_location",
      fields: ["id", "sales_channels.id"],
      filters: { id: input.stock_location_id },
    })

    const alreadyLinked = new Set(
      (linked?.[0]?.sales_channels ?? []).map((sc: any) => sc.id)
    )

    const channels = await salesChannelService.listSalesChannels({})
    let created = 0

    for (const channel of channels) {
      if (alreadyLinked.has(channel.id)) {
        continue
      }

      await link.create({
        [Modules.SALES_CHANNEL]: { sales_channel_id: channel.id },
        [Modules.STOCK_LOCATION]: {
          stock_location_id: input.stock_location_id,
        },
      })
      created++
    }

    return new StepResponse({ linked_sales_channels: created })
  }
)

// ====================================================================
// Step: ensure three tiered shipping options exist
// ====================================================================

/** Rules come back with ids and timestamps; updates take the bare shape. */
const stripRule = (r: any) => ({
  attribute: r.attribute,
  operator: r.operator,
  value: r.value,
})

/** Rules the option is missing, compared by attribute. */
const missingRules = (option: any, expected: { attribute: string }[]) => {
  const present = new Set((option.rules ?? []).map((r: any) => r.attribute))
  return expected.filter((r) => !present.has(r.attribute))
}

const ensureShippingOptionsStep = createStep(
  "ensure-shipping-options",
  async (
    input: {
      service_zone_id: string
      shipping_profile_id: string
      provider_id: string
    },
    { container }
  ) => {
    const fulfillmentService = container.resolve(Modules.FULFILLMENT) as any

    const existing = await fulfillmentService.listShippingOptions(
      { service_zone_id: input.service_zone_id },
      { relations: ["rules"] }
    )

    const created: any[] = []
    let ruled = 0

    for (const tier of TIERS) {
      const gates = rulesForTier(tier.code)

      const already = existing.find(
        (o: any) => o.data?.tier === tier.code && o.metadata?.owned_by === OWNED_BY
      )

      if (already) {
        // Backfill gating rules on options provisioned before they existed.
        // Without them the option is listed unconditionally and has to be
        // hidden client-side after a failed price call — which is what produced
        // the flicker of a disabled option on every interaction.
        const missing = missingRules(already, gates)
        if (missing.length) {
          await fulfillmentService.updateShippingOptions(already.id, {
            rules: [...(already.rules ?? []).map(stripRule), ...missing],
          })
          ruled++
        }
        continue
      }

      const opt = await fulfillmentService.createShippingOptions({
        name: tier.label,
        service_zone_id: input.service_zone_id,
        shipping_profile_id: input.shipping_profile_id,
        provider_id: input.provider_id,
        price_type: "calculated",
        type: {
          label: tier.label,
          description: tier.label,
          code: tier.code,
        },
        data: { tier: tier.code },
        metadata: { owned_by: OWNED_BY, tier: tier.code },
        rules: gates,
      })
      created.push(opt)
    }

    return new StepResponse({ created_count: created.length, ruled_count: ruled })
  }
)

// ====================================================================
// Step: give every option we own its extension row
// ====================================================================

const mirrorOwnedOptionsStep = createStep(
  "mirror-owned-options",
  async (input: { service_zone_id: string }, { container }) => {
    const fulfillmentService = container.resolve(Modules.FULFILLMENT) as any

    // Without an extension row a per-option surcharge or courier mask is
    // stored nowhere and silently does nothing, so it is created alongside
    // the option rather than backfilled later.
    const options = await fulfillmentService.listShippingOptions({
      service_zone_id: input.service_zone_id,
    })

    let mirrored = 0

    for (const option of options ?? []) {
      if (option.provider_id !== SHIPPING_ORCHESTRATOR_PROVIDER_ID) {
        continue
      }
      await mirrorShippingOptionWorkflow(container).run({
        input: { native_option_id: option.id },
      })
      mirrored++
    }

    return new StepResponse({ mirrored_options: mirrored })
  }
)

// ====================================================================
// Workflow
// ====================================================================

export const provisionNativeShippingWorkflow = createWorkflow(
  "provision-native-shipping",
  (input: ProvisionNativeShippingInput) => {
    const provider = resolveProviderStep({})
    const profile = ensureShippingProfileStep({})
    const set = ensureFulfillmentSetStep(input)
    ensureSalesChannelLinkStep({
      stock_location_id: input.stock_location_id,
    })
    const opts = ensureShippingOptionsStep({
      service_zone_id: set.service_zone_id,
      shipping_profile_id: profile.shipping_profile_id,
      provider_id: provider.provider_id,
    })
    mirrorOwnedOptionsStep({ service_zone_id: set.service_zone_id })
    return new WorkflowResponse(opts)
  }
)
