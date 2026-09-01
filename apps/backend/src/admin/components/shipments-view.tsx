import {
  Badge,
  Button,
  Checkbox,
  Container,
  Copy,
  Drawer,
  DropdownMenu,
  FocusModal,
  Heading,
  Input,
  Label,
  Prompt,
  Select,
  Table,
  Tabs,
  Text,
  toast,
} from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import {
  ageInDays,
  cancelEffect,
  describeAge,
  formatMoney,
  PAGE_SIZES,
  Shipment,
  TABS,
} from "../lib/orders"

// ------------------------------------------------------------------
// The shipping queue.
//
// Unit is a fulfilment, not an order: one order can be several parcels booked
// on different days, and a list of orders cannot show that without misreporting
// one of them. Oldest first, because the parcel that has waited longest is the
// one that should go out next.
// ------------------------------------------------------------------

const ShipmentsView = () => {
  const [tab, setTab] = useState("to_ship")
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
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
  /*
   * Pre-ticked, and deliberately so: the money going back is the default
   * outcome of cancelling, not an extra someone has to remember. Unticking is
   * for the rare order settled outside the system.
   */
  const [refundOnCancel, setRefundOnCancel] = useState(true)
  const [confirmComplete, setConfirmComplete] = useState(false)
  const [completeNote, setCompleteNote] = useState("")
  const [confirmRefund, setConfirmRefund] = useState(false)
  const [results, setResults] = useState<{
    action: string
    ok: number
    failures: string[]
  } | null>(null)
  /*
   * Partial refunds are per-row and never bulk. The amount is typed, and a
   * typed number applied to twenty orders at once is a way to send the wrong
   * money to twenty customers.
   */
  const [refundRow, setRefundRow] = useState<Shipment | null>(null)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundNote, setRefundNote] = useState("")
  const [detail, setDetail] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [preview, setPreview] = useState<any[] | null>(null)
  const [previewing, setPreviewing] = useState(false)

  // Typing in the search box should not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim())
      setOffset(0)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        state: tab,
        limit: pageSize,
        offset: String(offset),
      })

      // The server has always matched on display id, email, customer and
      // postcode; nothing ever sent it anything to match.
      if (query) {
        params.set("q", query)
      }

      const response = await fetch(
        `/admin/shipping-orchestrator/shipments?${params.toString()}`,
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
  }, [tab, pageSize, offset, query])

  useEffect(() => {
    load()
  }, [load])

  // Selection is per view: switching tabs or pages should not leave rows
  // selected that are no longer on screen and about to be booked.
  useEffect(() => {
    setSelected(new Set())
  }, [tab, offset, pageSize, query])

  const bookable = rows.filter((row) => row.bucket === "to_ship")
  const selectedBookable = bookable.filter((row) => selected.has(row.order_id))
  const selectedForCancel = rows.filter((row) => selected.has(row.order_id))
  const selectedCancellable = selectedForCancel.filter(
    (row) => cancelEffect(row).allowed
  )
  const selectedBlocked = selectedForCancel.filter(
    (row) => !cancelEffect(row).allowed
  )
  const selectedRefundable = selectedForCancel.filter(
    (row) => row.refund_owed > 0.01 || row.phantom_refund > 0.01
  )
  /*
   * Cancelled orders included, deliberately. Medusa refuses to set
   * `status = completed` on one, but "cancelled and settled outside the
   * system" is the case manual completion exists for — the server records it
   * in metadata instead.
   */
  const selectedCompletable = selectedForCancel.filter(
    (row) => row.status !== "completed" && !row.closed_by_hand
  )

  /*
   * Every row is selectable, not just the shippable ones. Selection used to be
   * limited to `to_ship`, which meant a cancelled order owing a refund could
   * not be ticked at all — the one row most in need of a bulk action was the
   * one row you could not select.
   */
  const completeOutstanding = selectedCompletable.filter(
    (row) =>
      row.customer_owes > 0.01 ||
      row.refund_owed > 0.01 ||
      row.phantom_refund > 0.01
  )

  const cancelRefundTotal = selectedCancellable.reduce(
    (sum, row) => sum + (row.refund_owed ?? 0),
    0
  )

  const allSelected = rows.length > 0 && selected.size === rows.length

  const toggleAll = () => {
    setSelected(
      allSelected ? new Set() : new Set(rows.map((row) => row.order_id))
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

  /*
   * The list says what needs doing; the drawer says what happened. Between
   * them they cover the ordinary day, which is the point — the stock Orders
   * page stays for the genuinely deep cases rather than for every question.
   */
  const openDetail = async (row: Shipment) => {
    setDetail({ order: { display_id: row.display_id }, events: [] })
    setDetailLoading(true)

    try {
      const response = await fetch(
        `/admin/shipping-orchestrator/orders/${row.order_id}`,
        { credentials: "include" }
      )
      const body = await response.json()

      if (!response.ok) {
        throw new Error(body?.message || "failed")
      }

      setDetail(body)
    } catch (e: any) {
      toast.error(`Could not open order #${row.display_id}: ${e.message}`)
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const submitRefund = async () => {
    if (!refundRow) {
      return
    }

    const amount = Number(refundAmount)
    const owed = Math.max(refundRow.refund_owed, refundRow.phantom_refund)

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter an amount to refund.")
      return
    }

    if (amount > owed + 0.01) {
      toast.error(
        `Only ${formatMoney(owed, refundRow.currency_code)} is still captured on this order.`
      )
      return
    }

    setBooking(true)

    try {
      const response = await fetch(
        `/admin/shipping-orchestrator/orders/${refundRow.order_id}/refund`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            note: refundNote || undefined,
          }),
        }
      )
      const body = await response.json()

      if (!response.ok) {
        throw new Error(body?.message || "failed")
      }

      toast.success(
        `Refunded ${formatMoney(amount, refundRow.currency_code)} on order #${refundRow.display_id}`
      )
      setRefundRow(null)
      await load()
    } catch (e: any) {
      // Left open, with the reason, so the amount does not have to be retyped.
      toast.error(`Refund failed: ${e.message}`, { duration: 20000 })
    } finally {
      setBooking(false)
    }
  }

  const runBulk = async (
    action: "ship" | "push" | "cancel" | "refund" | "complete",
    targets: Shipment[]
  ) => {
    setBooking(true)

    let ok = 0
    const failures: string[] = []
    const verb = {
      ship: "Shipping",
      push: "Pushing",
      cancel: "Cancelling",
      refund: "Refunding",
      complete: "Completing",
    }[action]

    for (const [index, row] of targets.entries()) {
      setProgress(
        `${verb} ${index + 1} of ${targets.length} — order #${row.display_id}`
      )

      try {
        const path =
          action === "ship" || action === "push" ? "ship" : action

        /*
         * Refund amounts are never typed into a bulk action. The server
         * refunds whatever the order still owes, so a slip cannot send the
         * wrong number to twenty customers at once. A typed, partial refund is
         * a per-order decision.
         */
        const payload =
          action === "cancel"
            ? { refund: refundOnCancel }
            : action === "complete"
              ? { note: completeNote || undefined }
              : action === "refund"
                ? {}
              : { book: action === "ship" }

        const response = await fetch(
          `/admin/shipping-orchestrator/orders/${row.order_id}/${path}`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
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
          {
            ship: "Shipped",
            push: "Pushed",
            cancel: "Cancelled",
            refund: "Refunded",
            complete: "Completed",
          }[action]
        } ${ok} order${ok === 1 ? "" : "s"}`
      )
    }

    /*
     * Failures stay on the page until they are dismissed. They used to be a
     * twenty-second toast, on the reasoning that three seconds was not a
     * report — which was right, and twenty is not either. Every line here is
     * an order somebody has to go and look at, and now that these actions move
     * money, one of them can be a customer who has not been paid back.
     */
    setResults(
      failures.length > 0 ? { action, ok, failures } : null
    )

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
                {selectedCancellable.length} order
                {selectedCancellable.length === 1 ? "" : "s"} will be cancelled
                {cancelRefundTotal > 0.01 &&
                  ` · ${formatMoney(cancelRefundTotal, selectedCancellable[0]?.currency_code)} will be refunded`}
                {selectedBlocked.length > 0 &&
                  ` · ${selectedBlocked.length} cannot be and will be left alone`}
                .
              </Text>
            </div>

            <div className="bg-ui-bg-subtle flex flex-col gap-2 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="refund-on-cancel"
                  checked={refundOnCancel}
                  onCheckedChange={(v) => setRefundOnCancel(v === true)}
                />
                <Label htmlFor="refund-on-cancel" size="small" weight="plus">
                  {cancelRefundTotal > 0.01
                    ? `Refund ${formatMoney(cancelRefundTotal, selectedCancellable[0]?.currency_code)} to the customer`
                    : "Refund the customer (nothing is captured on these orders)"}
                </Label>
              </div>
              {!refundOnCancel && cancelRefundTotal > 0.01 && (
                <Text size="small" className="text-ui-tag-orange-text">
                  No refund. {formatMoney(cancelRefundTotal, selectedCancellable[0]?.currency_code)}{" "}
                  stays captured and you settle it outside the system. Medusa
                  returns captured money whenever an order is cancelled, so
                  these will be refused rather than quietly refunded anyway.
                </Text>
              )}
              <Text size="small" className="text-ui-fg-subtle">
                If a refund fails the order is <b>not</b> cancelled — cancelling
                anyway would record a refund that never happened, which is
                exactly how order #1 came to show money returned that never
                left. You will be told which one failed and why.
              </Text>
            </div>

            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Order</Table.HeaderCell>
                  <Table.HeaderCell>Items</Table.HeaderCell>
                  <Table.HeaderCell>Captured</Table.HeaderCell>
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
                        <Text size="small" className="font-mono tabular-nums">
                          {row.refund_owed > 0.01
                            ? formatMoney(row.refund_owed, row.currency_code)
                            : "\u2014"}
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

      {/*
        Refunding is its own confirmation because it is the only bulk action
        that moves money outward. The amount is shown, never entered.
      */}
      <Prompt open={confirmRefund} onOpenChange={setConfirmRefund}>
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>Refund {selectedRefundable.length} order{selectedRefundable.length === 1 ? "" : "s"}</Prompt.Title>
            <Prompt.Description>
              {formatMoney(
                selectedRefundable.reduce(
                  (sum, row) =>
                    sum + Math.max(row.refund_owed, row.phantom_refund),
                  0
                ),
                selectedRefundable[0]?.currency_code
              )}{" "}
              goes back to the customers. Each order is refunded whatever it
              still owes — nothing is estimated here. Refunds that the provider
              rejects are reported rather than recorded, so the books cannot
              claim money that never left.
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel>Back</Prompt.Cancel>
            <Prompt.Action
              onClick={async () => {
                setConfirmRefund(false)
                await runBulk("refund", selectedRefundable)
              }}
            >
              Refund
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>

      {/*
        Completing is an assertion that you are finished with an order, not a
        claim that its books balance. Anything still unaccounted for is named
        here and carried onto the row afterwards, and has to be explained —
        this is the one action that silences a money warning, and an
        unexplained override is how the original problem stayed invisible.
      */}
      <FocusModal open={confirmComplete} onOpenChange={setConfirmComplete}>
        <FocusModal.Content>
          <FocusModal.Header>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="small"
                isLoading={booking}
                disabled={
                  completeOutstanding.length > 0 && !completeNote.trim()
                }
                onClick={async () => {
                  setConfirmComplete(false)
                  await runBulk("complete", selectedCompletable)
                }}
              >
                Mark {selectedCompletable.length} complete
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setConfirmComplete(false)}
              >
                Back
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-1">
              <Heading level="h2">Close these orders out</Heading>
              <Text className="text-ui-fg-subtle text-sm">
                They leave the working queues and rest in Completed.
              </Text>
            </div>

            {completeOutstanding.length > 0 && (
              <div className="bg-ui-bg-subtle flex flex-col gap-2 rounded-lg p-4">
                <Text size="small" weight="plus" className="text-ui-tag-orange-text">
                  {completeOutstanding.length} still {completeOutstanding.length === 1 ? "has" : "have"} money unaccounted for
                </Text>
                {completeOutstanding.map((row) => (
                  <Text
                    key={row.order_id}
                    size="small"
                    className="text-ui-fg-subtle"
                  >
                    #{row.display_id} —{" "}
                    {formatMoney(
                      Math.max(
                        row.customer_owes,
                        row.refund_owed,
                        row.phantom_refund
                      ),
                      row.currency_code
                    )}
                  </Text>
                ))}
                <Text size="small" className="text-ui-fg-subtle">
                  Closing them stops these amounts appearing in the money
                  queues. The figure stays on each row so it is never lost.
                </Text>
                <Label size="small" weight="plus" htmlFor="complete-note">
                  Why is this settled?
                </Label>
                <Input
                  id="complete-note"
                  placeholder="Refunded by bank transfer / sandbox payment, no real money / written off"
                  value={completeNote}
                  onChange={(e) => setCompleteNote(e.target.value)}
                />
              </div>
            )}
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>

      {/*
        The order's own history. Every complaint about the old screen came down
        to not being able to see the sequence — when the money arrived, when
        the parcel went, whether a refund was even attempted.
      */}
      <Drawer open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>
              Order #{detail?.order?.display_id}
            </Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-5 overflow-y-auto">
            {detailLoading && (
              <Text size="small" className="text-ui-fg-subtle">
                Loading…
              </Text>
            )}

            {detail?.order?.label && (
              <div className="flex flex-col gap-1">
                <Badge size="2xsmall" color={detail.order.tone}>
                  {detail.order.label}
                </Badge>
                <Text size="small" className="text-ui-fg-subtle">
                  {detail.order.detail}
                </Text>
              </div>
            )}

            {detail?.order?.money && (
              <div className="flex flex-col gap-1">
                <Text size="small" weight="plus">
                  Money
                </Text>
                {[
                  ["Order total", detail.order.money.total, ""],
                  ["Captured", detail.order.money.captured, ""],
                  ["Refunded", detail.order.money.refunded, ""],
                  [
                    "Owed by customer",
                    detail.order.money.customer_owes,
                    "text-ui-tag-orange-text",
                  ],
                  [
                    "To refund",
                    detail.order.money.refund_owed,
                    "text-ui-tag-red-text",
                  ],
                  [
                    "Recorded but never issued",
                    detail.order.money.phantom_refund,
                    "text-ui-tag-red-text",
                  ],
                ]
                  .filter(
                    ([label, value]) =>
                      Number(value) > 0.01 ||
                      label === "Order total" ||
                      label === "Captured"
                  )
                  .map(([label, value, tone]) => (
                    <div
                      key={String(label)}
                      className="flex items-center justify-between"
                    >
                      <Text size="small" className="text-ui-fg-subtle">
                        {label}
                      </Text>
                      <Text
                        size="small"
                        className={`font-mono tabular-nums ${tone}`}
                      >
                        {formatMoney(
                          Number(value),
                          detail.order.currency_code
                        )}
                      </Text>
                    </div>
                  ))}
              </div>
            )}

            {detail?.events?.length > 0 && (
              <div className="flex flex-col gap-2">
                <Text size="small" weight="plus">
                  History
                </Text>
                {detail.events.map((event: any, index: number) => (
                  <div
                    key={`${event.kind}-${index}`}
                    className="flex flex-col gap-0.5 border-l-2 pl-3"
                  >
                    <div className="flex items-center gap-2">
                      <Badge size="2xsmall" color={event.tone ?? "grey"}>
                        {event.title}
                      </Badge>
                      <Text size="small" className="text-ui-fg-muted">
                        {new Date(event.at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </div>
                    {event.detail && (
                      <Text size="small" className="text-ui-fg-subtle">
                        {event.detail}
                      </Text>
                    )}
                  </div>
                ))}
              </div>
            )}

            {detail?.order?.items?.length > 0 && (
              <div className="flex flex-col gap-1">
                <Text size="small" weight="plus">
                  Items
                </Text>
                {detail.order.items.map((item: any, index: number) => (
                  <Text key={index} size="small" className="text-ui-fg-subtle">
                    {item.quantity}&#215; {item.title}
                    {item.requires_shipping
                      ? ` — ${item.fulfilled} fulfilled`
                      : " — no shipping"}
                  </Text>
                ))}
              </div>
            )}
          </Drawer.Body>
          <Drawer.Footer>
            {detail?.order?.order_id && (
              <a
                href={`/app/orders/${detail.order.order_id}`}
                className="text-ui-fg-interactive text-sm"
              >
                Open in Medusa
              </a>
            )}
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>

      {/*
        Per-row, and pre-filled with what the order owes. Editable because a
        part refund is a real thing — a damaged item on a three-item order —
        and capped server-side at what is actually captured.
      */}
      <FocusModal
        open={!!refundRow}
        onOpenChange={(v) => !v && setRefundRow(null)}
      >
        <FocusModal.Content>
          <FocusModal.Header>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="small"
                isLoading={booking}
                onClick={submitRefund}
              >
                Refund
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setRefundRow(null)}
              >
                Back
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-1">
              <Heading level="h2">
                Refund order #{refundRow?.display_id}
              </Heading>
              <Text className="text-ui-fg-subtle text-sm">
                {refundRow &&
                  `${formatMoney(refundRow.captured, refundRow.currency_code)} captured · ${formatMoney(refundRow.refunded, refundRow.currency_code)} already returned · ${formatMoney(Math.max(refundRow.refund_owed, refundRow.phantom_refund), refundRow.currency_code)} still owed.`}
              </Text>
            </div>

            {refundRow && refundRow.phantom_refund > 0.01 && (
              <Text size="small" className="text-ui-tag-red-text">
                This order was recorded as refunded but the payment provider has
                no matching refund, so the money never left. Refunding now
                actually returns it — the books already believe it is gone, so
                they will then double-count until corrected.
              </Text>
            )}

            <div className="flex flex-col gap-2">
              <Label size="small" weight="plus" htmlFor="refund-amount">
                Amount
              </Label>
              <Input
                id="refund-amount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
              <Label size="small" weight="plus" htmlFor="refund-note">
                Note
              </Label>
              <Input
                id="refund-note"
                placeholder="Why this is being refunded"
                value={refundNote}
                onChange={(e) => setRefundNote(e.target.value)}
              />
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>

    <Container className="divide-y p-0">
      <div className="flex flex-col gap-1 px-6 py-4">
        <Heading level="h1">Order desk</Heading>
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

        {results && (
          <div className="mx-6 mt-4 flex flex-col gap-2 rounded-lg border border-ui-border-error bg-ui-bg-subtle p-4">
            <div className="flex items-start justify-between gap-3">
              <Text size="small" weight="plus" className="text-ui-tag-red-text">
                {results.failures.length}{" "}
                {results.action === "refund"
                  ? "refund"
                  : results.action === "cancel"
                    ? "cancellation"
                    : results.action}
                {results.failures.length === 1 ? "" : "s"} failed
                {results.ok > 0 && ` — ${results.ok} succeeded`}
              </Text>
              <Button
                variant="transparent"
                size="small"
                onClick={() => setResults(null)}
              >
                Dismiss
              </Button>
            </div>
            {results.failures.map((failure, index) => (
              <Text key={index} size="small" className="text-ui-fg-subtle">
                {failure}
              </Text>
            ))}
            {results.action === "refund" && (
              <Text size="small" className="text-ui-fg-subtle">
                Nothing was recorded for these — the books have not been
                credited, so the orders still show the money as owed.
              </Text>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            {selected.size > 0 && (
              <>
                {selectedBookable.length > 0 && (
                <Button
                  variant="primary"
                  size="small"
                  isLoading={booking}
                  onClick={() => loadPreview(selectedBookable)}
                >
                  Ship {selectedBookable.length} order
                  {selectedBookable.length === 1 ? "" : "s"}
                </Button>
                )}
                {/*
                  The free half, offered beside the one that spends. Pushing
                  creates the order in Shiprocket and stops; the courier is then
                  chosen in their panel and the tracking webhook brings the
                  result back here.
                */}
                {selectedBookable.length > 0 && (
                <Button
                  variant="secondary"
                  size="small"
                  isLoading={booking}
                  onClick={() => runBulk("push", selectedBookable)}
                >
                  Push to Shiprocket
                </Button>
                )}
                {/*
                  The amount is never typed here — the server returns whatever
                  the order still owes. A box you type into is a box you can
                  fat-finger across twenty customers at once.
                */}
                {selectedRefundable.length > 0 && (
                  <Button
                    variant="secondary"
                    size="small"
                    isLoading={booking}
                    onClick={() => setConfirmRefund(true)}
                  >
                    Refund{" "}
                    {formatMoney(
                      selectedRefundable.reduce(
                        (sum, row) =>
                          sum + Math.max(row.refund_owed, row.phantom_refund),
                        0
                      ),
                      selectedRefundable[0]?.currency_code
                    )}
                  </Button>
                )}
                {selectedCompletable.length > 0 && (
                  <Button
                    variant="transparent"
                    size="small"
                    isLoading={booking}
                    onClick={() => setConfirmComplete(true)}
                  >
                    Mark {selectedCompletable.length} complete
                  </Button>
                )}
                {/*
                  Cancellable only before the courier has it. Past that the
                  server refuses anyway, but offering the button would imply it
                  is possible.
                */}
                {/*
                  Label and payload both come from `selectedCancellable`. They
                  used to disagree — the count was every selected row, the
                  action only the eligible ones — so the button offered to
                  cancel five and cancelled three.
                */}
                {selectedCancellable.length > 0 && (
                  <Button
                    variant="danger"
                    size="small"
                    isLoading={booking}
                    onClick={() => setConfirmCancel(true)}
                  >
                    Cancel {selectedCancellable.length}
                  </Button>
                )}
                {selectedBlocked.length > 0 && (
                  <Text size="small" className="text-ui-fg-subtle">
                    {selectedBlocked.length} cannot be cancelled
                  </Text>
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
            <Input
              size="small"
              type="search"
              placeholder="Order, email, name or pincode"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
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
                    {rows.length > 0 && (
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                      />
                    )}
                  </Table.HeaderCell>
                  <Table.HeaderCell>Order</Table.HeaderCell>
                  <Table.HeaderCell>Items</Table.HeaderCell>
                  <Table.HeaderCell>Ship to</Table.HeaderCell>
                  <Table.HeaderCell>Money</Table.HeaderCell>
                  <Table.HeaderCell>Courier</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell className="w-10" />
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {rows.map((row) => {
                  return (
                    <Table.Row key={row.order_id}>
                      <Table.Cell>
                        {/*
                          Every row, not just the shippable ones. The toolbar
                          decides which actions a selection supports; the
                          checkbox no longer decides it for it. Selection used
                          to be limited to `to_ship`, so a cancelled order
                          owing a refund could not be ticked — the row most in
                          need of an action was the one you could not pick.
                        */}
                        <Checkbox
                          checked={selected.has(row.order_id)}
                          onCheckedChange={() => toggleOne(row.order_id)}
                        />
                      </Table.Cell>

                      <Table.Cell>
                        <button
                          type="button"
                          className="text-ui-fg-interactive"
                          onClick={() => openDetail(row)}
                        >
                          #{row.display_id}
                        </button>
                        {/*
                          Age, not the date. "12 Aug" does not tell you it has
                          been sitting for five days; the exact date is on the
                          title attribute for when it matters.
                        */}
                        <Text
                          size="small"
                          className={
                            ageInDays(row.created_at) > 3 &&
                            ["to_ship", "payment_pending", "refund_due", "needs_attention"].includes(
                              row.bucket
                            )
                              ? "text-ui-tag-orange-text"
                              : "text-ui-fg-subtle"
                          }
                          title={new Date(row.created_at).toLocaleString("en-IN")}
                        >
                          {describeAge(row.created_at)}
                        </Text>
                      </Table.Cell>

                      <Table.Cell>
                        {/*
                          One line. A five-item order used to blow the row
                          height apart and was the loudest source of noise on
                          the screen; the rest is one hover away.
                        */}
                        <Text
                          size="small"
                          title={row.items
                            .map((i) => `${i.quantity}× ${i.title}`)
                            .join(", ")}
                        >
                          {row.items.length === 0
                            ? "—"
                            : `${row.items[0].quantity}× ${row.items[0].title}`}
                        </Text>
                        {row.items.length > 1 && (
                          <Text size="small" className="text-ui-fg-muted">
                            +{row.items.length - 1} more
                          </Text>
                        )}
                      </Table.Cell>

                      <Table.Cell>
                        <Text size="small">{row.customer || row.email}</Text>
                        <Text size="small" className="text-ui-fg-subtle">
                          {row.city ?? "—"} {row.postal_code ?? ""}
                        </Text>
                      </Table.Cell>

                      <Table.Cell>
                        {/*
                          Tabular figures, so a column of amounts can be
                          scanned down rather than read.

                          The second line appears only when something is
                          actually wrong. A column that prints a number on
                          every row is a column you learn to skip, and the one
                          time it mattered — a cancelled order still holding
                          the customer's money — it would have been skipped
                          too.
                        */}
                        <Text size="small" className="font-mono tabular-nums">
                          {formatMoney(row.total, row.currency_code)}
                        </Text>
                        {row.phantom_refund > 0.01 ? (
                          <Text
                            size="small"
                            className="text-ui-tag-red-text font-mono tabular-nums"
                          >
                            {formatMoney(row.phantom_refund, row.currency_code)}{" "}
                            not returned
                          </Text>
                        ) : row.refund_owed > 0.01 ? (
                          <Text
                            size="small"
                            className="text-ui-tag-red-text font-mono tabular-nums"
                          >
                            {formatMoney(row.refund_owed, row.currency_code)} to
                            refund
                          </Text>
                        ) : row.customer_owes > 0.01 ? (
                          <Text
                            size="small"
                            className="text-ui-tag-orange-text font-mono tabular-nums"
                          >
                            {formatMoney(row.customer_owes, row.currency_code)}{" "}
                            unpaid
                          </Text>
                        ) : null}
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
                          <div className="flex items-center gap-1">
                            <Text
                              size="small"
                              className="text-ui-fg-subtle font-mono"
                            >
                              {row.awb}
                            </Text>
                            {/* So it can be pasted into Shiprocket rather than
                                transcribed by hand. */}
                            <Copy content={row.awb} className="text-ui-fg-muted" />
                          </div>
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
                        {/*
                          One sentence, decided by the server: a badge that
                          names the state and a line carrying the fact behind
                          it. Medusa's own `payment_status` is never shown —
                          it reports `partially_captured` for a fully captured
                          payment whenever the order was cancelled, which is
                          arithmetic, not money.
                        */}
                        <Badge size="2xsmall" color={row.tone}>
                          {row.label}
                        </Badge>
                        {row.detail && (
                          <Text size="small" className="text-ui-fg-subtle">
                            {/*
                              Shiprocket's own wording wins while a parcel is
                              moving: "OUT FOR DELIVERY" is more use than "on
                              its way to the customer".
                            */}
                            {row.bucket === "in_transit" &&
                            row.shipment_status_label
                              ? row.shipment_status_label
                              : row.detail}
                          </Text>
                        )}
                      </Table.Cell>

                      <Table.Cell>
                        {/*
                          Per-row actions, including the ones that are never
                          safe in bulk. A partial refund needs an amount typed
                          against one order; the same box applied to a
                          selection is a way to send the wrong money to
                          everybody at once.
                        */}
                        <DropdownMenu>
                          <DropdownMenu.Trigger asChild>
                            <Button variant="transparent" size="small">
                              &#8943;
                            </Button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content>
                            <DropdownMenu.Item
                              onClick={() => openDetail(row)}
                            >
                              Open
                            </DropdownMenu.Item>
                            {(row.refund_owed > 0.01 ||
                              row.phantom_refund > 0.01) && (
                              <DropdownMenu.Item
                                onClick={() => {
                                  setRefundRow(row)
                                  setRefundAmount(
                                    String(
                                      Math.max(
                                        row.refund_owed,
                                        row.phantom_refund
                                      )
                                    )
                                  )
                                  setRefundNote("")
                                }}
                              >
                                Refund&#8230;
                              </DropdownMenu.Item>
                            )}
                            {row.status !== "completed" && !row.closed_by_hand && (
                              <DropdownMenu.Item
                                onClick={() => {
                                  setSelected(new Set([row.order_id]))
                                  setConfirmComplete(true)
                                }}
                              >
                                Mark complete
                              </DropdownMenu.Item>
                            )}
                            {cancelEffect(row).allowed && (
                              <DropdownMenu.Item
                                onClick={() => {
                                  setSelected(new Set([row.order_id]))
                                  setRefundOnCancel(true)
                                  setConfirmCancel(true)
                                }}
                              >
                                Cancel order
                              </DropdownMenu.Item>
                            )}
                          </DropdownMenu.Content>
                        </DropdownMenu>
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
