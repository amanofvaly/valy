import { MedusaService } from "@medusajs/framework/utils"
import { GstSettings } from "./models/gst-settings"

class IndiaGstModuleService extends MedusaService({
  GstSettings,
}) {}

export default IndiaGstModuleService
