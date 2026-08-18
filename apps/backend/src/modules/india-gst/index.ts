import { Module } from "@medusajs/framework/utils"
import IndiaGstModuleService from "./service"

export const INDIA_GST_MODULE = "india_gst"

export default Module(INDIA_GST_MODULE, {
  service: IndiaGstModuleService,
})
