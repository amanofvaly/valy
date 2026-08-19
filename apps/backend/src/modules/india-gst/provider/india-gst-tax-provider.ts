import { ITaxProvider, TaxTypes } from "@medusajs/framework/types"

export default class IndiaGstTaxProvider implements ITaxProvider {
  static identifier = "india-gst"

  getIdentifier(): string {
    return IndiaGstTaxProvider.identifier
  }

  async getTaxLines(
    itemLines: TaxTypes.ItemTaxCalculationLine[],
    shippingLines: TaxTypes.ShippingTaxCalculationLine[],
    context: TaxTypes.TaxCalculationContext
  ): Promise<(TaxTypes.ItemTaxLineDTO | TaxTypes.ShippingTaxLineDTO)[]> {
    const lines: (TaxTypes.ItemTaxLineDTO | TaxTypes.ShippingTaxLineDTO)[] = []
    
    // Default to Delhi (07) if not configured yet
    const originState = "07"
    
    let destState = ""
    if (context.address && context.address.province_code) {
        destState = context.address.province_code
    }

    // A simple match for intra-state vs inter-state
    const isIntrastate = originState === destState

    for (const itemLine of itemLines) {
        const rates = itemLine.rates || []
        for (const rate of rates) {
            const rateValue = rate.rate ?? 0
            if (isIntrastate) {
                const halfRate = rateValue / 2
                lines.push({
                    line_item_id: itemLine.line_item.id,
                    rate_id: rate.id,
                    name: "CGST",
                    rate: halfRate,
                    code: "CGST",
                    provider_id: this.getIdentifier()
                } as any)
                lines.push({
                    line_item_id: itemLine.line_item.id,
                    rate_id: rate.id,
                    name: "SGST",
                    rate: halfRate,
                    code: "SGST",
                    provider_id: this.getIdentifier()
                } as any)
            } else {
                lines.push({
                    line_item_id: itemLine.line_item.id,
                    rate_id: rate.id,
                    name: "IGST",
                    rate: rateValue,
                    code: "IGST",
                    provider_id: this.getIdentifier()
                } as any)
            }
        }
    }

    for (const shippingLine of shippingLines) {
        const rates = shippingLine.rates || []
        for (const rate of rates) {
            const rateValue = rate.rate ?? 0
            if (isIntrastate) {
                const halfRate = rateValue / 2
                lines.push({
                    shipping_line_id: shippingLine.shipping_line.id,
                    rate_id: rate.id,
                    name: "CGST",
                    rate: halfRate,
                    code: "CGST",
                    provider_id: this.getIdentifier()
                } as any)
                lines.push({
                    shipping_line_id: shippingLine.shipping_line.id,
                    rate_id: rate.id,
                    name: "SGST",
                    rate: halfRate,
                    code: "SGST",
                    provider_id: this.getIdentifier()
                } as any)
            } else {
                lines.push({
                    shipping_line_id: shippingLine.shipping_line.id,
                    rate_id: rate.id,
                    name: "IGST",
                    rate: rateValue,
                    code: "IGST",
                    provider_id: this.getIdentifier()
                } as any)
            }
        }
    }

    return lines
  }
}
