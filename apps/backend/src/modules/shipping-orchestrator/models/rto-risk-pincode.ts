import { model } from "@medusajs/framework/utils"

export const RtoRiskPincode = model.define("so_rto_risk_pincode", {
  id: model.id().primaryKey(),

  pincode: model.text(),
  risk_level: model.enum(["high", "medium"]).default("medium"),
  block_cod: model.boolean().default(false),
})
