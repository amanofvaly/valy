import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArchiveBox } from "@medusajs/icons"
import ShipmentsView from "../../components/shipments-view"

/**
 * The order desk lands on the work queue, not on settings.
 *
 * The queue is the daily job — orders arrive, money moves, parcels go out.
 * Settings is warehouses, boxes and carrier rules, which are set up once and
 * then rarely touched, so making it the landing page put the least-used screen
 * in the way of the most-used one.
 */
const OrderDeskPage = () => <ShipmentsView />

export const config = defineRouteConfig({
  label: "Order desk",
  icon: ArchiveBox,
})

export default OrderDeskPage
