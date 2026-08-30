import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArchiveBox } from "@medusajs/icons"
import ShipmentsView from "../../components/shipments-view"

/**
 * Fulfilment lands on the shipping queue, not on settings.
 *
 * The queue is the daily job — orders come in and parcels go out. Settings is
 * warehouses, boxes and carrier rules, which are set up once and then rarely
 * touched, so making it the landing page put the least-used screen in the way
 * of the most-used one.
 */
const FulfillmentPage = () => <ShipmentsView />

export const config = defineRouteConfig({
  label: "Fulfillment",
  icon: ArchiveBox,
})

export default FulfillmentPage
