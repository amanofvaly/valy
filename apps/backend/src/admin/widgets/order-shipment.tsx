import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"
import {
  Badge,
  Button,
  Container,
  Heading,
  Text,
  toast,
} from "@medusajs/ui"
import { useState } from "react"

// ------------------------------------------------------------------
// Shipment state for an order, and the one action that moves it on.
//
// A fulfilment creates the Shiprocket order, which is free and tells nobody to
// collect anything. Booking the courier is what costs money, so it is a
// deliberate press rather than a side effect of fulfilling — and the button
// says what it will do before it does it.
// ------------------------------------------------------------------

type ShipmentData = {
  shiprocket_order_ids?: string
  shiprocket_shipment_ids?: string
  shiprocket_awb_codes?: string
  courier_name?: string
  booked_courier_names?: string
  courier_match?: string
  chargeable_weight_kg?: number
  pickup_scheduled_at?: string
}

const OrderShipmentWidget = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const [busy, setBusy] = useState<string | null>(null)
  const [refreshed, setRefreshed] = useState(0)

  const fulfillments = ((order as any).fulfillments ?? []).filter(
    (f: any) => !f.canceled_at
  )

  const shipFulfillment = async (fulfillmentId: string) => {
    setBusy(fulfillmentId)

    try {
      const response = await fetch(
        `/admin/shipping-orchestrator/fulfillments/${fulfillmentId}/ship`,
        { method: "POST", credentials: "include" }
      )
      const body = await response.json()

      if (!response.ok) {
        throw new Error(body?.message || "Could not book the courier")
      }

      const booked = (body.assigned ?? [])
        .map((a: any) => `${a.courier} ${a.awb}`)
        .join(", ")

      toast.success(`Courier booked and pickup requested: ${booked}`)
      setRefreshed((n) => n + 1)
    } catch (e: any) {
      // Left on screen rather than as a toast that vanishes: if the rollback
      // also failed, this text is the only warning that money has moved.
      toast.error(e.message, { duration: 10000 })
    } finally {
      setBusy(null)
    }
  }

  if (fulfillments.length === 0) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Shipment</Heading>
        </div>
        <div className="px-6 py-4">
          <Text className="text-ui-fg-subtle text-sm">
            Nothing is fulfilled yet. Fulfilling an order creates it in
            Shiprocket, which is free — the courier is booked separately, from
            here.
          </Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0" key={refreshed}>
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Shipment</Heading>
      </div>

      {fulfillments.map((fulfillment: any) => {
        const data = (fulfillment.data ?? {}) as ShipmentData
        const awb = data.shiprocket_awb_codes
        const shipped = !!awb
        const quoted = data.courier_name
        const booked = data.booked_courier_names
        const mismatch =
          shipped && data.courier_match && data.courier_match !== "exact"

        return (
          <div key={fulfillment.id} className="flex flex-col gap-3 px-6 py-4">
            {/*
              Stacked, not a row. This widget sits in the order page's side
              column, which is too narrow to put a badge and a button on one
              line — they overlapped, and the badge lost.
            */}
            <div className="flex flex-wrap items-center gap-2">
              <Text size="small" weight="plus">
                {data.shiprocket_order_ids
                  ? `Shiprocket #${data.shiprocket_order_ids}`
                  : "Not in Shiprocket"}
              </Text>
              <Badge color={shipped ? "green" : "orange"} size="2xsmall">
                {shipped ? "Awaiting pickup" : "Not booked"}
              </Badge>
            </div>

            <div className="text-ui-fg-subtle grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {quoted && (
                <Text size="small">
                  Quoted at checkout: <strong>{quoted}</strong>
                </Text>
              )}
              {booked && (
                <Text size="small">
                  Booked: <strong>{booked}</strong>
                </Text>
              )}
              {awb && (
                <Text size="small">
                  AWB: <strong>{awb}</strong>
                </Text>
              )}
              {data.chargeable_weight_kg != null && (
                <Text size="small">
                  Chargeable weight:{" "}
                  <strong>{data.chargeable_weight_kg} kg</strong>
                </Text>
              )}
            </div>

            {mismatch && (
              /*
               * Surfaced rather than buried, because the customer was quoted a
               * price against the carrier named above and this one is not it.
               */
              <Text size="small" className="text-ui-tag-orange-text">
                Booked a different carrier than the one quoted
                {data.courier_match === "cheapest"
                  ? " — the quoted carrier was not serviceable, so the cheapest available was used."
                  : " — the quoted carrier was matched by name only."}
              </Text>
            )}

            {!shipped && !data.shiprocket_shipment_ids && (
              <Text size="small" className="text-ui-fg-subtle">
                This fulfilment has no Shiprocket shipment, so there is nothing
                to book. It was created before the integration, or the push
                failed.
              </Text>
            )}

            {!shipped && data.shiprocket_shipment_ids && (
              <div className="flex flex-col gap-1.5">
                <Button
                  size="small"
                  variant="primary"
                  className="w-full"
                  isLoading={busy === fulfillment.id}
                  onClick={() => shipFulfillment(fulfillment.id)}
                >
                  Book courier &amp; request pickup
                </Button>
                {/*
                  Said before the press, not after. This is the step that spends
                  money, and the wallet is not somewhere an operator can see
                  from here.
                */}
                <Text size="small" className="text-ui-fg-subtle">
                  Charges the freight to your Shiprocket wallet. Refunded if the
                  shipment is cancelled.
                </Text>
              </div>
            )}
          </div>
        )
      })}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderShipmentWidget
