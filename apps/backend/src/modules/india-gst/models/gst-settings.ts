import { model } from "@medusajs/framework/utils"

export const GstSettings = model.define("gst_settings", {
  id: model.id().primaryKey(),
  origin_state_code: model.text().default("07"),
  company_gstin: model.text().nullable(),
})
