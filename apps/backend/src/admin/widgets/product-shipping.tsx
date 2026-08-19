import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  DetailWidgetProps,
  AdminProduct,
} from "@medusajs/framework/types"
import {
  Container,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  Button,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"

// ------------------------------------------------------------------
// Product-level and variant-level shipping override widget.
// Persists to product.metadata and variant.metadata via the admin API.
// Keys are read by the shipping-orchestrator provider at calc time.
// ------------------------------------------------------------------

type ShippingMeta = {
  ships_separately?: boolean | string
  free_shipping?: boolean | string
  shipping_flat_override?: number | string
  shipping_flat_surcharge?: number | string
  shipping_percent_surcharge?: number | string
}

const boolMeta = (v: boolean | string | undefined) =>
  v === true || v === "true"

const numMeta = (v: number | string | undefined) => {
  if (v === undefined || v === null || v === "") return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const ProductShippingWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const productMeta = (product.metadata || {}) as ShippingMeta

  const [pShipsSep, setPShipsSep] = useState(boolMeta(productMeta.ships_separately))
  const [pFree, setPFree] = useState(boolMeta(productMeta.free_shipping))
  const [pOverride, setPOverride] = useState(String(numMeta(productMeta.shipping_flat_override)))
  const [pFlat, setPFlat] = useState(String(numMeta(productMeta.shipping_flat_surcharge)))
  const [pPct, setPPct] = useState(String(numMeta(productMeta.shipping_percent_surcharge)))
  const [saving, setSaving] = useState(false)

  // Variant overrides: local state keyed by variant id
  const [variants, setVariants] = useState<Record<string, ShippingMeta>>(() => {
    const initial: Record<string, ShippingMeta> = {}
    for (const v of product.variants || []) {
      initial[v.id] = (v.metadata || {}) as ShippingMeta
    }
    return initial
  })

  useEffect(() => {
    // Re-sync when the product prop changes (e.g. after admin refetch)
    const initial: Record<string, ShippingMeta> = {}
    for (const v of product.variants || []) {
      initial[v.id] = (v.metadata || {}) as ShippingMeta
    }
    setVariants(initial)
  }, [product])

  const patchProduct = async (patch: Partial<ShippingMeta>) => {
    setSaving(true)
    try {
      const res = await fetch(`/admin/products/${product.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...(product.metadata || {}),
            ...patch,
          },
        }),
      })
      if (res.ok) {
        toast.success("Product shipping updated")
      } else {
        toast.error("Failed to update product")
      }
    } catch {
      toast.error("Failed to update product")
    }
    setSaving(false)
  }

  const patchVariant = async (
    variantId: string,
    patch: Partial<ShippingMeta>
  ) => {
    setSaving(true)
    try {
      const current = variants[variantId] || {}
      const res = await fetch(
        `/admin/products/${product.id}/variants/${variantId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            metadata: {
              ...current,
              ...patch,
            },
          }),
        }
      )
      if (res.ok) {
        toast.success("Variant shipping updated")
        setVariants((prev) => ({
          ...prev,
          [variantId]: { ...current, ...patch },
        }))
      } else {
        toast.error("Failed to update variant")
      }
    } catch {
      toast.error("Failed to update variant")
    }
    setSaving(false)
  }

  const savePersistProduct = () => {
    patchProduct({
      ships_separately: pShipsSep,
      free_shipping: pFree,
      shipping_flat_override: numMeta(pOverride),
      shipping_flat_surcharge: numMeta(pFlat),
      shipping_percent_surcharge: numMeta(pPct),
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Shipping Overrides</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Product-level defaults. Variant values (below) win when set.
          </Text>
        </div>
        <Button
          variant="primary"
          size="small"
          onClick={savePersistProduct}
          isLoading={saving}
        >
          Save Product
        </Button>
      </div>

      <div className="px-6 py-4 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Switch checked={pShipsSep} onCheckedChange={setPShipsSep} />
          <Label>Ships separately (own AWB, isolated box)</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={pFree} onCheckedChange={setPFree} />
          <Label>Free shipping (skip this item)</Label>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Flat override (₹ per unit — replaces calc)</Label>
          <Input
            type="number"
            value={pOverride}
            onChange={(e) => setPOverride(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Flat surcharge (₹ per unit — on top)</Label>
          <Input
            type="number"
            value={pFlat}
            onChange={(e) => setPFlat(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Percent surcharge (% — on top; max across items wins)</Label>
          <Input
            type="number"
            value={pPct}
            onChange={(e) => setPPct(e.target.value)}
          />
        </div>
      </div>

      {(product.variants || []).length > 0 && (
        <div className="px-6 py-4">
          <Heading level="h3" className="text-base mb-2">
            Per-variant overrides
          </Heading>
          <Text size="small" className="text-ui-fg-subtle mb-4">
            Any variant field set here overrides the product-level value
            above for that specific variant.
          </Text>

          <div className="flex flex-col gap-4">
            {(product.variants || []).map((v: any) => {
              const meta = variants[v.id] || {}
              return (
                <Container
                  key={v.id}
                  className="flex flex-col gap-3 bg-ui-bg-subtle"
                >
                  <div className="flex items-center justify-between">
                    <Text weight="plus">{v.title || v.sku || v.id}</Text>
                    <Text size="xsmall" className="text-ui-fg-muted">
                      {v.sku || v.id}
                    </Text>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={boolMeta(meta.ships_separately)}
                        onCheckedChange={(next) =>
                          patchVariant(v.id, { ships_separately: next })
                        }
                      />
                      <Label>Ships separately</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={boolMeta(meta.free_shipping)}
                        onCheckedChange={(next) =>
                          patchVariant(v.id, { free_shipping: next })
                        }
                      />
                      <Label>Free shipping</Label>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Flat override (₹)</Label>
                      <Input
                        type="number"
                        defaultValue={String(numMeta(meta.shipping_flat_override))}
                        onBlur={(e) => {
                          const n = numMeta(e.target.value)
                          if (n !== numMeta(meta.shipping_flat_override)) {
                            patchVariant(v.id, {
                              shipping_flat_override: n,
                            })
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Flat surcharge (₹)</Label>
                      <Input
                        type="number"
                        defaultValue={String(numMeta(meta.shipping_flat_surcharge))}
                        onBlur={(e) => {
                          const n = numMeta(e.target.value)
                          if (n !== numMeta(meta.shipping_flat_surcharge)) {
                            patchVariant(v.id, {
                              shipping_flat_surcharge: n,
                            })
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <Label>Percent surcharge (%)</Label>
                      <Input
                        type="number"
                        defaultValue={String(numMeta(meta.shipping_percent_surcharge))}
                        onBlur={(e) => {
                          const n = numMeta(e.target.value)
                          if (n !== numMeta(meta.shipping_percent_surcharge)) {
                            patchVariant(v.id, {
                              shipping_percent_surcharge: n,
                            })
                          }
                        }}
                      />
                    </div>
                  </div>
                </Container>
              )
            })}
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductShippingWidget
