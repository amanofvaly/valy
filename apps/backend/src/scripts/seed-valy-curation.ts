import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createProductTagsWorkflow,
  deleteCollectionsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Curation pass over the catalogue.
 *
 * A Medusa product belongs to exactly one collection, so a lineup collection
 * and a curated-set collection cannot both hold the same machine. The taxonomy
 * that results:
 *
 *   categories   what a thing IS      Machines / Parts / Services
 *   collections  who it is FOR        Starting out / Plex builds
 *   tags         what it DOES         quiet, transcoding, ecc, 10gbe, ...
 *
 * The Machines category is the lineup, which makes a separate "The range"
 * collection a duplicate of it — so this removes it. Safe to re-run.
 */

const COLLECTION_BY_HANDLE: Record<string, string> = {
  "flow-2": "starting-out",
  "flow-4": "starting-out",
  "wd-red-plus-nas-drive": "starting-out",
  "nvme-boot-drive": "starting-out",
  "os-installation": "starting-out",
  "photo-library-migration": "starting-out",
  "handover-session": "starting-out",

  "hike-4": "plex-builds",
  "hike-6": "plex-builds",
  "summit-8": "plex-builds",
  "ironwolf-pro-nas-drive": "plex-builds",
  "arc-a310-transcode-card": "plex-builds",
  "media-stack-setup": "plex-builds",
  "nvme-app-cache": "plex-builds",
}

const TAGS_BY_HANDLE: Record<string, string[]> = {
  "flow-2": ["quiet", "low-power", "made-to-order"],
  "flow-4": ["quiet", "low-power", "made-to-order"],
  "hike-4": ["transcoding", "quiet", "made-to-order"],
  "hike-6": ["transcoding", "ecc", "10gbe", "made-to-order"],
  "summit-8": ["transcoding", "ecc", "10gbe", "rack-friendly", "made-to-order"],

  "ironwolf-pro-nas-drive": ["in-stock"],
  "wd-red-plus-nas-drive": ["quiet", "low-power", "in-stock"],
  "nvme-app-cache": ["in-stock"],
  "nvme-boot-drive": ["in-stock"],
  "ddr4-sodimm": ["in-stock"],
  "ddr5-sodimm": ["in-stock"],
  "ddr4-ecc-dimm": ["ecc", "in-stock"],
  "sfp-plus-10gbe-card": ["10gbe", "in-stock"],
  "multi-gig-network-card": ["in-stock"],
  "arc-a310-transcode-card": ["transcoding", "low-power", "in-stock"],
  "rtx-a2000-compute-card": ["in-stock"],
  "eight-bay-chassis": ["rack-friendly", "in-stock"],
  "sfx-power-supply": ["quiet", "in-stock"],
  "quiet-case-fan": ["quiet", "in-stock"],

  "os-installation": ["included-with-machines"],
  "media-stack-setup": ["transcoding"],
  "photo-library-migration": [],
  "handover-session": [],
}

const ALL_TAGS = [
  ...new Set(Object.values(TAGS_BY_HANDLE).flat()),
]

export default async function seedValyCuration({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  /* ---- tags ------------------------------------------------------------ */

  const { data: existingTags } = await query.graph({
    entity: "product_tag",
    fields: ["id", "value"],
  })
  const tagByValue = new Map<string, string>(
    existingTags.map((t) => [t.value, t.id])
  )

  const missingTags = ALL_TAGS.filter((v) => !tagByValue.has(v))
  if (missingTags.length) {
    const { result } = await createProductTagsWorkflow(container).run({
      input: { product_tags: missingTags.map((value) => ({ value })) },
    })
    result.forEach((t) => tagByValue.set(t.value, t.id))
    logger.info(`Created tags: ${missingTags.join(", ")}.`)
  }

  /* ---- collections ----------------------------------------------------- */

  const { data: collections } = await query.graph({
    entity: "product_collection",
    fields: ["id", "handle"],
  })
  const collectionByHandle = new Map<string, string>(
    collections.map((c) => [c.handle, c.id])
  )

  /* ---- reassign -------------------------------------------------------- */

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "collection_id", "tags.id", "tags.value"],
  })

  for (const product of products) {
    const wantedCollection = COLLECTION_BY_HANDLE[product.handle]
    const wantedTags = TAGS_BY_HANDLE[product.handle]

    if (wantedCollection === undefined && wantedTags === undefined) {
      continue
    }

    const update: Record<string, unknown> = {}

    const collectionId = wantedCollection
      ? (collectionByHandle.get(wantedCollection) ?? null)
      : null
    if (collectionId !== product.collection_id) {
      update.collection_id = collectionId
    }

    if (wantedTags) {
      const currentTagIds = new Set(
        (product.tags ?? []).map((t: any) => t.id as string)
      )
      const wantedTagIds = wantedTags
        .map((v) => tagByValue.get(v))
        .filter(Boolean) as string[]

      const differs =
        wantedTagIds.length !== currentTagIds.size ||
        wantedTagIds.some((id) => !currentTagIds.has(id))

      if (differs) {
        update.tag_ids = wantedTagIds
      }
    }

    if (!Object.keys(update).length) {
      continue
    }

    await updateProductsWorkflow(container).run({
      input: { selector: { id: product.id }, update: update as any },
    })
    logger.info(
      `Updated ${product.handle}: ${Object.keys(update).join(", ")}.`
    )
  }

  /* ---- drop the duplicate lineup collection ---------------------------- */

  const theRange = collectionByHandle.get("the-range")
  if (theRange) {
    await deleteCollectionsWorkflow(container).run({ input: { ids: [theRange] } })
    logger.info(
      'Removed the "the-range" collection — the Machines category is the lineup.'
    )
  }

  logger.info("Curation pass finished.")
}
