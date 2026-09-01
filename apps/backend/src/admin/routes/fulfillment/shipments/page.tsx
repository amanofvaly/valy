import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Navigate } from "react-router-dom"

/**
 * The sidebar needs a child that names the queue rather than leaving it
 * implied by its absence, but mounting the view twice gave two URLs, two
 * independent copies of a heavy stateful component, and a back button that
 * moved between them without appearing to change anything. The nav entry
 * stays; the second mount does not.
 */
const OrdersPage = () => <Navigate to="/fulfillment" replace />

export const config = defineRouteConfig({
  label: "Orders",
})

export default OrdersPage
