import { model } from "@medusajs/framework/utils"

export const BoxConfig = model.define("so_box_config", {
  id: model.id().primaryKey(),

  name: model.text(),
  length_cm: model.number(),
  width_cm: model.number(),
  height_cm: model.number(),
  max_weight_grams: model.number(),
})
