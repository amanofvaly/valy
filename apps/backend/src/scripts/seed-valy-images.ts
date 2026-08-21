import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Product imagery, assigned on one rule.
 *
 * There are no photographs of Valy machines yet — the plan lists it as a launch
 * blocker, and the homepage's own media file says the same about its Unsplash
 * placeholders. The rule this applies is that a placeholder is acceptable only
 * where it honestly depicts the class of thing being sold: a photograph of a
 * 3.5 inch drive stands in for a 3.5 inch drive, and a photograph of a
 * datacentre aisle does not stand in for a two-bay box on a shelf.
 *
 * So parts with an accurate stand-in keep one, and everything else carries no
 * image at all — the storefront renders a typed plate with the product's own
 * name and specifications, which is the truthful thing to show and reads as
 * deliberate rather than broken.
 *
 * Re-runnable. Replace the URLs here when the real photography arrives.
 */

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

/**
 * Handle -> images. An empty array means "no photograph, use the plate".
 *
 * The rule is stricter than it first looks. A photograph of unbranded drive
 * internals stands in for a drive, because that is what the class of component
 * looks like and nothing in the frame claims to be a particular model. A
 * recognisable RTX 2080 does not stand in for an Intel Arc A310, a desktop DIMM
 * does not stand in for a SODIMM, and a patch panel is not a network card.
 * Where the stand-in would misrepresent the specific product, there is none.
 */
const IMAGES: Record<string, string[]> = {
  /* Machines: nothing here honestly depicts a Valy build. */
  "flow-2": [],
  "flow-4": [],
  "hike-4": [],
  "hike-6": [],
  "summit-8": [],

  /* Spinning drives: unbranded internals, which is exactly the class. */
  "ironwolf-pro-nas-drive": [
    img("photo-1597852074816-d933c7d2b988"),
    img("photo-1601737487795-dab272f52420"),
  ],
  "wd-red-plus-nas-drive": [
    img("photo-1601737487795-dab272f52420"),
    img("photo-1597852074816-d933c7d2b988"),
  ],

  /* An M.2 stick is small and specific; the available stand-ins are 3.5 inch
     drives, which is a different object entirely. */
  "nvme-app-cache": [],
  "nvme-boot-drive": [],

  /* A full-height DIMM is the right object for the ECC module and the wrong
     one for a SODIMM, which is roughly half the length. */
  "ddr4-ecc-dimm": [img("photo-1562976540-1502c2145186")],
  "ddr4-sodimm": [],
  "ddr5-sodimm": [],

  /* A patch panel is cabling, not a network card. */
  "sfp-plus-10gbe-card": [],
  "multi-gig-network-card": [],

  /* The only card photography available is a recognisable consumer GPU, which
     is neither of the cards sold here. */
  "arc-a310-transcode-card": [],
  "rtx-a2000-compute-card": [],

  /* Stock photography for these is gaming hardware in coloured light, which is
     the opposite of what is being sold. */
  "eight-bay-chassis": [],
  "sfx-power-supply": [],
  "quiet-case-fan": [],

  /* Services are work, not objects. */
  "os-installation": [],
  "media-stack-setup": [],
  "photo-library-migration": [],
  "handover-session": [],
}

export default async function seedValyImages({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "thumbnail", "images.url"],
  })

  for (const product of products) {
    const wanted = IMAGES[product.handle]

    if (!wanted) {
      continue
    }

    const current = (product.images ?? []).map((i: any) => i.url as string)
    const same =
      current.length === wanted.length &&
      current.every((url, i) => url === wanted[i]) &&
      (product.thumbnail ?? null) === (wanted[0] ?? null)

    if (same) {
      continue
    }

    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: product.id },
        update: {
          images: wanted.map((url) => ({ url })),
          thumbnail: wanted[0] ?? null,
        } as any,
      },
    })

    logger.info(
      `${product.handle}: ${wanted.length ? `${wanted.length} image(s)` : "no photograph, plate"}.`
    )
  }

  logger.info("Image pass finished.")
}
