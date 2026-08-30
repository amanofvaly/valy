import {
  Badge,
  Button,
  Checkbox,
  Container,
  FocusModal,
  Heading,
  Select,
  Table,
  Tabs,
  Text,
  toast,
} from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"

// ------------------------------------------------------------------
// The shipping queue.
//
// Unit is a fulfilment, not an order: one order can be several parcels booked
// on different days, and a list of orders cannot show that without misreporting
// one of them. Oldest first, because the parcel that has waited longest is the
// one that should go out next.
// ------------------------------------------------------------------

type Shipment = {
  order_id: string
  display_id: number
  email: string
  city: string | null
  postal_code: string | null
  created_at: string
  customer: string
  total: number
  currency_code: string
  bucket: string
  items: Array<{ title: string; quantity: number }>
  awb: string | null
  quoted_courier: string | null
  booked_courier: string | null
  courier_match: string | null
  chargeable_weight_kg: number | null
  shipment_status_label: string | null
}

const TABS = [
  { value: "to_ship", label: "To ship" },
  { value: "awaiting_pickup", label: "Awaiting pickup" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
  { value: "all", label: "All" },
]

const PAGE_SIZES = ["25", "50", "100", "200"]

const formatMoney = (value: number, currency?: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency?.toUpperCase() || "INR",
    maximumFractionDigits: 2,
  }).format(value ?? 0)

/**
 * What cancelling this order would actually do, and whether it can be done.
 *
 * Spelled out per row because "cancel" means different things depending on how
 * far the parcel has got: nothing has been sent to Shiprocket for an order that
 * was never pushed, while one already booked has freight to refund. And past
 * pickup it cannot be undone at all — Shiprocket only cancels before collection,
 * so cancelling here would leave a cancelled order and a parcel still travelling
 * to the customer.
 */
const cancelEffect = (
  row: Shipment
): { allowed: boolean; where: string; reason?: string } => {
  if (row.bucket === "in_transit") {
    return {
      allowed: false,
      where: "—",
      reason: `Picked up${row.shipment_status_label ? ` (${row.shipment_status_label})` : ""} — needs an RTO in Shiprocket`,
    }
  }

  if (row.bucket === "delivered") {
    return { allowed: false, where: "—", reason: "Already delivered" }
  }

  if (row.awb) {
    return {
      allowed: true,
      where: "Shiprocket + Medusa",
      reason: "Courier booked — freight is refunded",
    }
  }

  if (row.quoted_courier) {
    return {
      allowed: true,
      where: "Shiprocket + Medusa",
      reason: "Order exists in Shiprocket, no courier booked",
    }
  }

  return {
    allowed: true,
    where: "Medusa only",
    reason: "Never pushed to Shiprocket",
  }
}

const ShipmentsView = () => {
  const [tab, setTab] = useState("to_ship")
  const [rows, setRows] = useState<Shipment[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pageSize, setPageSize] = useState("50")
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [preview, setPreview] = useState<any[] | null>(null)
  const [previewing, setPreviewing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)

    try {
      const response = await fetch(
        `/admin/shipping-orchestrator/shipments?state=${tab}&limit=${pageSize}&offset=${offset}`,
        { credentials: "include" }
      )
      const body = await response.json()

      setRows(body.shipments ?? [])
      setCounts(body.counts ?? {})
      setTotal(body.count ?? 0)
    } catch (e: any) {
      toast.error(`Could not load shipments: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [tab, pageSize, offset])

  useEffect(() => {
    load()
  }, [load])

  // Selection is per view: switching tabs or pages should not leave rows
  // selected that are no longer on screen and about to be booked.
  useEffect(() => {
    setSelected(new Set())
  }, [tab, offset, pageSize])

  const bookable = rows.filter((row) => row.bucket === "to_ship")
  const selectedBookable = bookable.filter((row) => selected.has(row.order_id))
  const selectedForCancel = rows.filter((row) => selected.has(row.order_id))
  const selectedCancellable = selectedForCancel.filter(
    (row) => cancelEffect(row).allowed
  )
  const selectedBlocked = selectedForCancel.filter(
    (row) => !cancelEffect(row).allowed
  )
  const allSelected =
    bookable.length > 0 && selectedBookable.length === bookable.length

  const toggleAll = () => {
    setSelected(
      allSelected
        ? new Set()
        : new Set(bookable.map((row) => row.order_id))
    )
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  /*
   * One at a time, not in parallel. Each booking is a courier assignment that
   * charges the wallet, and firing twenty at once at Shiprocket risks rate
   * limits part-way through — leaving some booked and some not, with no clear
   * record of which. Sequential is slower and always knows where it got to.
   */
  /*
   * Serviceability is a read, so this costs nothing and books nothing. It is
   * the only way to see the rate before the wallet is charged, since the
   * carrier's price now is not the price the customer was quoted at checkout.
   */
  const loadPreview = async (targets: Shipment[]) => {
    setPreviewing(true)
    setPreview([])

    const results: any[] = []

    for (const row of targets) {
      try {
        const response = await fetch(
          `/admin/shipping-orchestrator/orders/${row.order_id}/ship-preview`,
          { credentials: "include" }
        )
        results.push(await response.json())
      } catch (e: any) {
        results.push({
          order_id: row.order_id,
          display_id: row.display_id,
          blocked: e.message,
        })
      }
      setPreview([...results])
    }

    setPreviewing(false)
  }

  const runBulk = async (
    action: "ship" | "push" | "cancel",
    targets: Shipment[]
  ) => {
    setBooking(true)

    let ok = 0
    const failures: string[] = []
    const verb =
      action === "ship" ? "Shipping" : action === "push" ? "Pushing" : "Cancelling"

    for (const [index, row] of targets.entries()) {
      setProgress(
        `${verb} ${index + 1} of ${targets.length} — order #${row.display_id}`
      )

      try {
        const response = await fetch(
          `/admin/shipping-orchestrator/orders/${row.order_id}/${
            action === "cancel" ? "cancel" : "ship"
          }`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ book: action === "ship" }),
          }
        )
        const body = await response.json()

        if (!response.ok) {
          throw new Error(body?.message || "failed")
        }
        ok++
      } catch (e: any) {
        failures.push(`#${row.display_id}: ${e.message}`)
      }
    }

    setProgress(null)
    setBooking(false)

    if (ok > 0) {
      toast.success(
        `${
          action === "ship"
            ? "Shipped"
            : action === "push"
              ? "Pushed"
              : "Cancelled"
        } ${ok} order${ok === 1 ? "" : "s"}`
      )
    }
    if (failures.length > 0) {
      // Long, and deliberately so: each line is an order somebody has to look
      // at, and a toast that vanishes in three seconds is not a report.
      toast.error(`${failures.length} failed — ${failures.join(" · ")}`, {
        duration: 20000,
      })
    }

    await load()
  }

  const shippable = (preview ?? []).filter((p) => !p.blocked)
  const totalRate = shippable.reduce((sum, p) => sum + (p.rate ?? 0), 0)
  const previewCurrency = shippable[0]?.currency_code

  return (
    <>
      {/*
        Shown before Ship books anything. Cancel already confirmed itself while
        Ship — the action that spends money — went straight through, which was
        the wrong way round.
      */}
      <FocusModal
        open={preview !== null}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <FocusModal.Content>
          <FocusModal.Header>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="small"
                isLoading={booking}
                disabled={previewing || shippable.length === 0}
                onClick={async () => {
                  const targets = selectedBookable.filter((row) =>
                    shippable.some((p) => p.order_id === row.order_id)
                  )
                  setPreview(null)
                  await runBulk("ship", targets)
                }}
              >
                Book {shippable.length} courier
                {shippable.length === 1 ? "" : "s"}
                {totalRate > 0
                  ? ` · ${formatMoney(totalRate, previewCurrency)}`
                  : ""}
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setPreview(null)}
              >
                Back
              </Button>
            </div>
          </FocusModal.Header>

          <FocusModal.Body className="flex flex-col gap-4 overflow-y-auto p-6">
            <div className="flex flex-col gap-1">
              <Heading level="h2">Confirm shipping</Heading>
              <Text className="text-ui-fg-subtle text-sm">
                {previewing
                  ? `Checking rates… ${preview?.length ?? 0} of ${selectedBookable.length}`
                  : `Live carrier rates. Nothing is booked or charged until you confirm.`}
              </Text>
            </div>

            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Order</Table.HeaderCell>
                  <Table.HeaderCell>Quoted</Table.HeaderCell>
                  <Table.HeaderCell>Will book</Table.HeaderCell>
                  <Table.HeaderCell>Weight</Table.HeaderCell>
                  <Table.HeaderCell>Rate</Table.HeaderCell>
                  <Table.HeaderCell>Customer paid</Table.HeaderCell>
                  <Table.HeaderCell>Margin</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {(preview ?? []).map((p) => (
                  <Table.Row key={p.order_id}>
                    <Table.Cell>
                      <Text size="small" weight="plus">
                        #{p.display_id}
                      </Text>
                    </Table.Cell>

                    {p.blocked ? (
                      <Table.Cell>
                        {/*
                          Medusa's Table.Cell takes no colSpan, so a blocked row
                          says why in the first column and leaves the numeric
                          ones empty rather than inventing figures for a
                          shipment that will not be booked.
                        */}
                        <Text size="small" className="text-ui-tag-red-text">
                          {p.blocked}
                        </Text>
                      </Table.Cell>
                    ) : (
                      <>
                        <Table.Cell>
                          <Text size="small" className="text-ui-fg-subtle">
                            {p.quoted_courier ?? "\u2014"}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="small">{p.booked_courier}</Text>
                          {p.match !== "exact" && (
                            <Text
                              size="small"
                              className="text-ui-tag-orange-text"
                            >
                              {p.match === "cheapest"
                                ? "quoted carrier unavailable"
                                : "name match only"}
                            </Text>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="small" className="font-mono tabular-nums">
                            {p.weight} kg
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="small" className="font-mono tabular-nums">
                            {formatMoney(p.rate, p.currency_code)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="small" className="font-mono tabular-nums">
                            {formatMoney(p.charged, p.currency_code)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          {/*
                            What the customer paid for shipping, less what the
                            carrier wants for it. Red when it goes the wrong
                            way, which is the case worth catching before the
                            booking rather than after the invoice.
                          */}
                          <Text
                            size="small"
                            className={
                              p.margin < 0
                                ? "text-ui-tag-red-text font-mono tabular-nums"
                                : "font-mono tabular-nums"
                            }
                          >
                            {formatMoney(p.margin, p.currency_code)}
                          </Text>
                        </Table.Cell>
                      </>
                    )}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
      {/*
        Shown before anything is cancelled, because "cancel 5 orders" hides five
        different consequences — one refunds freight, one touches Shiprocket at
        all, one cannot be undone. The table is the confirmation.
      */}
      <FocusModal open={confirmCancel} onOpenChange={setConfirmCancel}>
        <FocusModal.Content>
          <FocusModal.Header>
            <div className="flex items-center gap-3">
              <Button
                variant="danger"
                size="small"
                isLoading={booking}
                disabled={selectedCancellable.length === 0}
                onClick={async () => {
                  setConfirmCancel(false)
                  await runBulk("cancel", selectedCancellable)
                }}
              >
                Cancel {selectedCancellable.length} order
                {selectedCancellable.length === 1 ? "" : "s"}
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setConfirmCancel(false)}
              >
                Back
              </Button>
            </div>
          </FocusModal.Header>

          <FocusModal.Body className="flex flex-col gap-4 overflow-y-auto p-6">
            <div className="flex flex-col gap-1">
              <Heading level="h2">Cancel orders</Heading>
              <Text className="text-ui-fg-subtle text-sm">
                {selectedBlocked.length > 0
                  ? `${selectedCancellable.length} will be cancelled. ${selectedBlocked.length} cannot be and will be left alone.`
                  : `${selectedCancellable.length} order${selectedCancellable.length === 1 ? "" : "s"} will be cancelled.`}
              </Text>
            </div>

            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Order</Table.HeaderCell>
                  <Table.HeaderCell>Items</Table.HeaderCell>
                  <Table.HeaderCell>Cancelled in</Table.HeaderCell>
                  <Table.HeaderCell>Why</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {selectedForCancel.map((row) => {
                  const effect = cancelEffect(row)

                  return (
                    <Table.Row key={row.order_id}>
                      <Table.Cell>
                        <Text size="small" weight="plus">
                          #{row.display_id}
                        </Text>
                        <Text size="small" className="text-ui-fg-subtle">
                          {row.customer || row.email}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="small">
                          {row.items
                            .map((i) => `${i.quantity}\u00d7 ${i.title}`)
                            .join(", ") || "\u2014"}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        {effect.allowed ? (
                          <Badge size="2xsmall" color="orange">
                            {effect.where}
                          </Badge>
                        ) : (
                          <Badge size="2xsmall" color="red">
                            Not cancelled
                          </Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="small" className="text-ui-fg-subtle">
                          {effect.reason}
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>

    <Container className="divide-y p-0">
      <div className="flex flex-col gap-1 px-6 py-4">
        <Heading level="h1">Shipments</Heading>
        <Text className="text-ui-fg-subtle text-sm">
          Oldest first. Shipping an order fulfils it, books the courier and
          requests a pickup — and charges the freight to your Shiprocket wallet.
        </Text>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="px-6 pt-4">
          <Tabs.List>
            {TABS.map((t) => (
              <Tabs.Trigger key={t.value} value={t.value}>
                {t.label}
                {counts[t.value] ? ` (${counts[t.value]})` : ""}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            {(selectedBookable.length > 0 ||
              selectedCancellable.length > 0) && (
              <>
                <Button
                  variant="primary"
                  size="small"
                  isLoading={booking}
                  onClick={() => loadPreview(selectedBookable)}
                >
                  Ship {selectedBookable.length} order
                  {selectedBookable.length === 1 ? "" : "s"}
                </Button>
                {/*
                  The free half, offered beside the one that spends. Pushing
                  creates the order in Shiprocket and stops; the courier is then
                  chosen in their panel and the tracking webhook brings the
                  result back here.
                */}
                <Button
                  variant="secondary"
                  size="small"
                  isLoading={booking}
                  onClick={() => runBulk("push", selectedBookable)}
                >
                  Push to Shiprocket
                </Button>
                {/*
                  Cancellable only before the courier has it. Past that the
                  server refuses anyway, but offering the button would imply it
                  is possible.
                */}
                {selectedForCancel.length > 0 && (
                  <Button
                    variant="danger"
                    size="small"
                    isLoading={booking}
                    onClick={() => setConfirmCancel(true)}
                  >
                    Cancel {selectedForCancel.length}
                  </Button>
                )}
              </>
            )}
            {progress && (
              <Text size="small" className="text-ui-fg-subtle">
                {progress}
              </Text>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Text size="small" className="text-ui-fg-subtle">
              Per page
            </Text>
            <Select value={pageSize} onValueChange={setPageSize}>
              <Select.Trigger className="w-24">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {PAGE_SIZES.map((size) => (
                  <Select.Item key={size} value={size}>
                    {size}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-8">
            <Text className="text-ui-fg-subtle">Loading…</Text>
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-8">
            <Text className="text-ui-fg-subtle">
              Nothing here.
            </Text>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell className="w-10">
                    {bookable.length > 0 && (
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                      />
                    )}
                  </Table.HeaderCell>
                  <Table.HeaderCell>Order</Table.HeaderCell>
                  <Table.HeaderCell>Items</Table.HeaderCell>
                  <Table.HeaderCell>Destination</Table.HeaderCell>
                  <Table.HeaderCell>Total</Table.HeaderCell>
                  <Table.HeaderCell>Weight</Table.HeaderCell>
                  <Table.HeaderCell>Courier</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {rows.map((row) => {
                  const canBook = row.bucket === "to_ship"

                  return (
                    <Table.Row key={row.order_id}>
                      <Table.Cell>
                        {canBook && (
                          <Checkbox
                            checked={selected.has(row.order_id)}
                            onCheckedChange={() => toggleOne(row.order_id)}
                          />
                        )}
                      </Table.Cell>

                      <Table.Cell>
                        <a
                          href={`/app/orders/${row.order_id}`}
                          className="text-ui-fg-interactive"
                        >
                          #{row.display_id}
                        </a>
                        <Text size="small" className="text-ui-fg-subtle">
                          {new Date(row.created_at).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" }
                          )}
                        </Text>
                      </Table.Cell>

                      <Table.Cell>
                        <Text size="small">
                          {row.items
                            .map((i) => `${i.quantity}× ${i.title}`)
                            .join(", ") || "—"}
                        </Text>
                      </Table.Cell>

                      <Table.Cell>
                        <Text size="small">{row.customer || row.email}</Text>
                        <Text size="small" className="text-ui-fg-subtle">
                          {row.city ?? "—"} {row.postal_code ?? ""}
                        </Text>
                      </Table.Cell>

                      <Table.Cell>
                        {/*
                          Tabular figures and right-aligned, so a column of
                          amounts can be scanned down rather than read.
                        */}
                        <Text size="small" className="font-mono tabular-nums">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: row.currency_code?.toUpperCase() || "INR",
                            maximumFractionDigits: 2,
                          }).format(row.total ?? 0)}
                        </Text>
                      </Table.Cell>

                      <Table.Cell>
                        <Text size="small">
                          {row.chargeable_weight_kg != null
                            ? `${row.chargeable_weight_kg} kg`
                            : "—"}
                        </Text>
                      </Table.Cell>

                      <Table.Cell>
                        {/*
                          Quoted and booked are different facts and used to
                          render identically, so a carrier nobody had booked
                          read as though it had been.
                        */}
                        <Text size="small">
                          {row.booked_courier ?? row.quoted_courier ?? "—"}
                        </Text>
                        {!row.booked_courier && row.quoted_courier && (
                          <Text size="small" className="text-ui-fg-muted">
                            quoted
                          </Text>
                        )}
                        {row.awb && (
                          <Text
                            size="small"
                            className="text-ui-fg-subtle font-mono"
                          >
                            {row.awb}
                          </Text>
                        )}
                        {row.courier_match &&
                          row.courier_match !== "exact" && (
                            <Text
                              size="small"
                              className="text-ui-tag-orange-text"
                            >
                              not the quoted carrier
                            </Text>
                          )}
                      </Table.Cell>

                      <Table.Cell>
                        <Badge
                          size="2xsmall"
                          color={
                            row.bucket === "delivered"
                              ? "green"
                              : row.bucket === "to_ship"
                                ? "orange"
                                : "blue"
                          }
                        >
                          {row.shipment_status_label ??
                            TABS.find((t) => t.value === row.bucket)?.label ??
                            row.bucket}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            {total === 0
              ? "0"
              : `${offset + 1}–${Math.min(offset + rows.length, total)} of ${total}`}
          </Text>
          <div className="flex gap-2">
            <Button
              size="small"
              variant="secondary"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - Number(pageSize)))}
            >
              Prev
            </Button>
            <Button
              size="small"
              variant="secondary"
              disabled={offset + rows.length >= total}
              onClick={() => setOffset(offset + Number(pageSize))}
            >
              Next
            </Button>
          </div>
        </div>
      </Tabs>
    </Container>
    </>
  )
}

export default ShipmentsView
