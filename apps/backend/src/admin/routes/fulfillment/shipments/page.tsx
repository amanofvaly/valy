import { defineRouteConfig } from "@medusajs/admin-sdk"
import ShipmentsView from "../../../components/shipments-view"

/**
 * The same view the section lands on, listed as a child so the sidebar names
 * both halves rather than leaving "Shipments" implied by its absence.
 */
const ShipmentsPage = () => <ShipmentsView />

export const config = defineRouteConfig({
  label: "Shipments",
})

export default ShipmentsPage
