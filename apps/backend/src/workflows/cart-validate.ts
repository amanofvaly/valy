import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { MedusaError } from "@medusajs/framework/utils"

completeCartWorkflow.hooks.validate(async ({ cart }) => {
  const gstin = cart.metadata?.gstin as string

  if (gstin) {
    // Basic regex for Indian GSTIN
    // Format: 2 digits (State), 10 chars (PAN), 1 char (Entity), 1 char (Z), 1 char (Checksum)
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    if (!gstinRegex.test(gstin)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The provided GSTIN format is invalid."
      )
    }
  }
})
