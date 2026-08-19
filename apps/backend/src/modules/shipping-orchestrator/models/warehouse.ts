import { model } from "@medusajs/framework/utils"

export const SoWarehouse = model.define("so_warehouse", {
  id: model.id().primaryKey(),

  name: model.text(),
  pincode: model.text(),
  city: model.text().default(""),
  state: model.text().default(""),

  is_primary: model.boolean().default(false),
  is_drop_ship: model.boolean().default(false),
  vendor_webhook_url: model.text().nullable(),

})
