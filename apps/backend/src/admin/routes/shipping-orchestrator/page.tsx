import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import {
  Container,
  Heading,
  Text,
  Button,
  Select,
  Input,
  Switch,
  toast,
  Tabs,
  Badge,
  Label,
  Textarea,
} from "@medusajs/ui"

// ====================================================================
// Types
// ====================================================================

type Settings = Record<string, any>
type Rule = Record<string, any>
type WarehouseData = Record<string, any>
type BoxConfigData = Record<string, any>
type RtoPincodeData = Record<string, any>
type ShippingOptionRow = { native: Record<string, any>; extension: Record<string, any> | null }
type HealthCheck = {
  id: string
  level: "error" | "warning" | "ok"
  title: string
  detail: string
  action?: string
  tab?: string
}
type Health = {
  status: "error" | "warning" | "ok"
  summary: { errors: number; warnings: number; checkout_ready: boolean }
  checks: HealthCheck[]
}

// ====================================================================
// Main Component
// ====================================================================

const ShippingOrchestrator = () => {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [rules, setRules] = useState<Rule[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([])
  const [boxConfigs, setBoxConfigs] = useState<BoxConfigData[]>([])
  const [rtoPincodes, setRtoPincodes] = useState<RtoPincodeData[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [shippingOptions, setShippingOptions] = useState<ShippingOptionRow[]>([])
  const [serviceZones, setServiceZones] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("setup")
  const [health, setHealth] = useState<Health | null>(null)

  // --- Test Serviceability State ---
  const [testPickup, setTestPickup] = useState("")
  const [testDelivery, setTestDelivery] = useState("")
  const [testWeight, setTestWeight] = useState("0.5")
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  // ------------------------------------------------------------------
  // Load Data
  // ------------------------------------------------------------------

  const loadShippingOptions = () =>
    fetch("/admin/shipping-orchestrator/shipping-options", {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => setShippingOptions(d.options || []))
      .catch(() => setShippingOptions([]))

  const loadHealth = () =>
    fetch("/admin/shipping-orchestrator/health", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setHealth(d))
      .catch(() => setHealth(null))

  const loadServiceZones = () =>
    fetch("/admin/shipping-orchestrator/service-zones", {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => setServiceZones(d.service_zones || []))
      .catch(() => setServiceZones([]))

  const saveServiceZone = async (
    id: string,
    patch: Record<string, any>
  ) => {
    try {
      const res = await fetch(
        "/admin/shipping-orchestrator/service-zones",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id, ...patch }),
        }
      )
      if (res.ok) {
        toast.success("Service zone updated")
        loadServiceZones()
      } else {
        toast.error("Failed to update service zone")
      }
    } catch {
      toast.error("Failed to update service zone")
    }
  }

  useEffect(() => {
    Promise.all([
      fetch("/admin/shipping-orchestrator", { credentials: "include" }).then(
        (r) => r.json()
      ),
      fetch("/admin/product-categories", { credentials: "include" }).then(
        (r) => r.json()
      ),
    ])
      .then(([configData, catData]) => {
        setSettings(configData.settings)
        setRules(configData.rules || [])
        setWarehouses(configData.warehouses || [])
        setBoxConfigs(configData.box_configs || [])
        setRtoPincodes(configData.rto_pincodes || [])
        if (catData.product_categories)
          setCategories(catData.product_categories)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    loadShippingOptions()
    loadServiceZones()
    loadHealth()
  }, [])

  const saveShippingOption = async (
    nativeId: string,
    patch: Record<string, any>
  ) => {
    try {
      const res = await fetch(
        "/admin/shipping-orchestrator/shipping-options",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ native_option_id: nativeId, ...patch }),
        }
      )
      if (res.ok) {
        toast.success("Shipping option updated")
        loadShippingOptions()
      } else {
        toast.error("Failed to update shipping option")
      }
    } catch {
      toast.error("Failed to update shipping option")
    }
  }

  // ------------------------------------------------------------------
  // Save All
  // ------------------------------------------------------------------

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/admin/shipping-orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          settings,
          rules,
          warehouses,
          box_configs: boxConfigs,
          rto_pincodes: rtoPincodes,
        }),
      })
      if (res.ok) {
        toast.success("All settings saved successfully")
        
        // Reload config to get real IDs for any newly created items
        const configData = await fetch("/admin/shipping-orchestrator", { credentials: "include" }).then((r) => r.json())
        setSettings(configData.settings)
        setRules(configData.rules || [])
        setWarehouses(configData.warehouses || [])
        setBoxConfigs(configData.box_configs || [])
        setRtoPincodes(configData.rto_pincodes || [])
        
        // Re-run the readiness checks so the banner reflects what was just fixed.
        loadHealth()
      } else {
        toast.error("Failed to save settings")
      }
    } catch {
      toast.error("Failed to save settings")
    }
    setSaving(false)
  }

  // ------------------------------------------------------------------
  // Test Serviceability
  // ------------------------------------------------------------------

  const handleTestServiceability = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(
        "/admin/shipping-orchestrator/test-serviceability",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            pickup_postcode: testPickup,
            delivery_postcode: testDelivery,
            weight_kg: Number(testWeight),
          }),
        }
      )
      const data = await res.json()
      setTestResult(data)
    } catch {
      setTestResult({ serviceable: false, error: "Request failed" })
    }
    setTesting(false)
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }))
  }

  if (loading || !settings) return <Container>Loading...</Container>

  // ====================================================================
  // RENDER
  // ====================================================================

  return (
    <Container className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Heading>Shipping Orchestrator</Heading>
          <Text className="text-ui-fg-subtle">
            Unified control panel for your entire logistics engine.
          </Text>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                const res = await fetch(
                  "/admin/shipping-orchestrator/reconcile",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                  }
                )
                const data = await res.json()
                if (data.ok) {
                  toast.success(
                    `Reconciled: ${JSON.stringify(data.report)}`
                  )
                  loadShippingOptions()
                } else {
                  toast.error(`Reconcile failed: ${data.error}`)
                }
              } catch {
                toast.error("Reconcile failed")
              }
            }}
          >
            Reconcile Now
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={saving}>
            Save All Settings
          </Button>
        </div>
      </div>

      {health && health.status !== "ok" && activeTab !== "setup" && (
        <div
          className={
            "flex items-start justify-between gap-4 rounded-lg border px-4 py-3 " +
            (health.status === "error"
              ? "border-ui-border-error bg-ui-bg-subtle"
              : "border-ui-border-base bg-ui-bg-subtle")
          }
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Badge color={health.status === "error" ? "red" : "orange"}>
                {health.status === "error"
                  ? "Checkout blocked"
                  : "Needs attention"}
              </Badge>
              <Text className="font-medium">
                {health.summary.errors > 0 &&
                  `${health.summary.errors} problem${
                    health.summary.errors === 1 ? "" : "s"
                  } will stop customers from checking out`}
                {health.summary.errors === 0 &&
                  `${health.summary.warnings} setting${
                    health.summary.warnings === 1 ? "" : "s"
                  } left to review`}
              </Text>
            </div>
            <Text size="small" className="text-ui-fg-subtle">
              {health.checks[0]?.title}
              {health.checks.length > 1 &&
                ` and ${health.checks.length - 1} more`}
            </Text>
          </div>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setActiveTab("setup")}
          >
            Review setup
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="setup">
            Setup
            {health && health.summary.errors > 0 && (
              <Badge color="red" size="2xsmall" className="ml-2">
                {health.summary.errors}
              </Badge>
            )}
            {health &&
              health.summary.errors === 0 &&
              health.summary.warnings > 0 && (
                <Badge color="orange" size="2xsmall" className="ml-2">
                  {health.summary.warnings}
                </Badge>
              )}
          </Tabs.Trigger>
          <Tabs.Trigger value="engine">Core Engine</Tabs.Trigger>
          <Tabs.Trigger value="warehouses">Warehouses</Tabs.Trigger>
          <Tabs.Trigger value="shipping-options">Shipping Options</Tabs.Trigger>
          <Tabs.Trigger value="pricing">Pricing</Tabs.Trigger>
          <Tabs.Trigger value="rules">Rules Engine</Tabs.Trigger>
          <Tabs.Trigger value="couriers">Courier Controls</Tabs.Trigger>
          <Tabs.Trigger value="cod">COD & RTO</Tabs.Trigger>
          <Tabs.Trigger value="returns">Returns</Tabs.Trigger>
        </Tabs.List>

        {/* ============================================================ */}
        {/* TAB 0: SETUP & READINESS                                     */}
        {/* ============================================================ */}
        <Tabs.Content value="setup">
          <Container className="flex flex-col gap-4 bg-ui-bg-subtle mt-4">
            <div className="flex items-center justify-between">
              <div>
                <Heading level="h2" className="text-lg">
                  Setup &amp; readiness
                </Heading>
                <Text className="text-ui-fg-subtle" size="small">
                  Everything that has to be true before a customer can pick a
                  delivery option and pay.
                </Text>
              </div>
              <Button variant="secondary" size="small" onClick={loadHealth}>
                Re-check
              </Button>
            </div>

            {!health && (
              <Text className="text-ui-fg-subtle">Running checks…</Text>
            )}

            {health && health.checks.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-ui-border-base bg-ui-bg-base px-4 py-3">
                <Badge color="green">Ready</Badge>
                <Text>
                  Shipping is fully configured. Customers can select a delivery
                  option and check out.
                </Text>
              </div>
            )}

            {health && health.checks.length > 0 && (
              <div className="flex flex-col gap-3">
                {!health.summary.checkout_ready && (
                  <Text size="small" className="text-ui-fg-subtle">
                    Items marked <strong>Blocking</strong> stop checkout today.
                    Items marked <strong>Review</strong> still let customers buy,
                    but the result may not be what you intend.
                  </Text>
                )}

                {health.checks.map((check) => (
                  <div
                    key={check.id}
                    className="flex items-start justify-between gap-4 rounded-lg border border-ui-border-base bg-ui-bg-base px-4 py-3"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          color={check.level === "error" ? "red" : "orange"}
                          size="2xsmall"
                        >
                          {check.level === "error" ? "Blocking" : "Review"}
                        </Badge>
                        <Text className="font-medium">{check.title}</Text>
                      </div>
                      <Text size="small" className="text-ui-fg-subtle">
                        {check.detail}
                      </Text>
                      {check.action && (
                        <Text size="small" className="text-ui-fg-base">
                          → {check.action}
                        </Text>
                      )}
                    </div>
                    {check.tab && (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setActiveTab(check.tab!)}
                      >
                        Fix
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Container>
        </Tabs.Content>

        {/* ============================================================ */}
        {/* TAB 1: CORE ENGINE                                           */}
        {/* ============================================================ */}
        <Tabs.Content value="engine">
          <div className="grid grid-cols-2 gap-6 mt-4">
            <Container className="flex flex-col gap-4 bg-ui-bg-subtle">
              <Heading level="h2" className="text-lg">
                Provider & Volumetric
              </Heading>

              <div className="flex flex-col gap-2">
                <Label>Active Provider</Label>
                <Select
                  value={settings.active_provider}
                  onValueChange={(v) => updateSetting("active_provider", v)}
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="shiprocket">
                      Shiprocket (Live API)
                    </Select.Item>
                    <Select.Item value="manual_slabs">
                      Manual Weight Slabs
                    </Select.Item>
                    <Select.Item value="hyperlocal">
                      Hyperlocal Only
                    </Select.Item>
                  </Select.Content>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Volumetric Divisor</Label>
                <Input
                  type="number"
                  value={settings.volumetric_divisor}
                  onChange={(e) =>
                    updateSetting("volumetric_divisor", Number(e.target.value))
                  }
                />
                <Text size="xsmall" className="text-ui-fg-muted">
                  Standard is 5000 (L x W x H / 5000)
                </Text>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Fallback Item Weight (grams)</Label>
                <Input
                  type="number"
                  value={settings.fallback_weight_grams}
                  onChange={(e) =>
                    updateSetting(
                      "fallback_weight_grams",
                      Number(e.target.value)
                    )
                  }
                />
                <Text size="xsmall" className="text-ui-fg-muted">
                  Used when a product has no weight defined
                </Text>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Label>Fallback Slab Rate</Label>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    Charged when the courier API cannot be reached. Turn this
                    off and an outage makes delivery options unavailable
                    instead of quoting an estimate.
                  </Text>
                </div>
                <Switch
                  checked={settings.fallback_enabled !== false}
                  onCheckedChange={(v) => updateSetting("fallback_enabled", v)}
                />
              </div>

              {settings.fallback_enabled !== false && (
                <div className="flex flex-col gap-2">
                  <Label>Fallback Rate per 500g</Label>
                  <Input
                    type="number"
                    value={settings.fallback_rate_per_500g ?? 0}
                    onChange={(e) =>
                      updateSetting(
                        "fallback_rate_per_500g",
                        Number(e.target.value)
                      )
                    }
                  />
                  <Text size="xsmall" className="text-ui-fg-muted">
                    Also used as the only rate source when the provider is set
                    to Manual Weight Slabs.
                  </Text>
                </div>
              )}
            </Container>

            {/* API Settings */}
            <Container className="flex flex-col gap-4 bg-ui-bg-subtle">
              <Heading level="h2" className="text-lg">
                Shiprocket API Settings
              </Heading>

              <div className="flex flex-col gap-2">
                <Label>Shiprocket Email</Label>
                <Input
                  type="email"
                  value={settings.api_settings?.shiprocket_email || ""}
                  onChange={(e) =>
                    updateSetting("api_settings", {
                      ...settings.api_settings,
                      shiprocket_email: e.target.value,
                    })
                  }
                  placeholder="hello@example.com"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Shiprocket Password</Label>
                <Input
                  type="password"
                  value={settings.api_settings?.shiprocket_password || ""}
                  onChange={(e) =>
                    updateSetting("api_settings", {
                      ...settings.api_settings,
                      shiprocket_password: e.target.value,
                    })
                  }
                  placeholder={
                    settings.api_settings?.has_shiprocket_password
                      ? "•••••••• (leave blank to keep saved)"
                      : "••••••••"
                  }
                />
                {settings.api_settings?.has_shiprocket_password && (
                  <Text size="xsmall" className="text-ui-fg-muted">
                    A password is stored. Leave blank to keep it.
                  </Text>
                )}
              </div>

              <Button
                variant="secondary"
                size="small"
                onClick={async () => {
                  try {
                    const res = await fetch(
                      "/admin/shipping-orchestrator/test-connection",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                      }
                    )
                    const data = await res.json()
                    if (data.ok) {
                      toast.success(`Connected as ${data.email}`)
                    } else {
                      toast.error(`Connection failed: ${data.error}`)
                    }
                  } catch {
                    toast.error("Connection test failed")
                  }
                }}
              >
                Test Shiprocket Connection
              </Button>
            </Container>

            {/* Box Configurations */}
            <Container className="flex flex-col gap-4 bg-ui-bg-subtle">
              <div className="flex items-center justify-between">
                <Heading level="h2" className="text-lg">
                  Box Configurations
                </Heading>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() =>
                    setBoxConfigs([
                      ...boxConfigs,
                      {
                        name: "",
                        length_cm: 30,
                        width_cm: 20,
                        height_cm: 15,
                        max_weight_grams: 5000,
                      },
                    ])
                  }
                >
                  Add Box
                </Button>
              </div>
              <Text className="text-ui-fg-subtle text-sm">
                Define your standard shipping boxes. The engine will pack items
                into the best-fit box.
              </Text>

              {boxConfigs.length === 0 ? (
                <Text className="text-ui-fg-muted text-sm italic">
                  No boxes configured. Volumetric weight will be calculated per-item.
                </Text>
              ) : (
                <div className="flex flex-col gap-3">
                  {boxConfigs.map((box, idx) => (
                    <div
                      key={idx}
                      className="bg-ui-bg-base p-3 rounded-md border flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Box Name"
                          value={box.name || ""}
                          onChange={(e) => {
                            const updated = [...boxConfigs]
                            updated[idx] = { ...updated[idx], name: e.target.value }
                            setBoxConfigs(updated)
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => {
                            const updated = [...boxConfigs]
                            updated.splice(idx, 1)
                            setBoxConfigs(updated)
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <Text size="xsmall">L (cm)</Text>
                          <Input
                            type="number"
                            value={box.length_cm}
                            onChange={(e) => {
                              const updated = [...boxConfigs]
                              updated[idx] = {
                                ...updated[idx],
                                length_cm: Number(e.target.value),
                              }
                              setBoxConfigs(updated)
                            }}
                          />
                        </div>
                        <div>
                          <Text size="xsmall">W (cm)</Text>
                          <Input
                            type="number"
                            value={box.width_cm}
                            onChange={(e) => {
                              const updated = [...boxConfigs]
                              updated[idx] = {
                                ...updated[idx],
                                width_cm: Number(e.target.value),
                              }
                              setBoxConfigs(updated)
                            }}
                          />
                        </div>
                        <div>
                          <Text size="xsmall">H (cm)</Text>
                          <Input
                            type="number"
                            value={box.height_cm}
                            onChange={(e) => {
                              const updated = [...boxConfigs]
                              updated[idx] = {
                                ...updated[idx],
                                height_cm: Number(e.target.value),
                              }
                              setBoxConfigs(updated)
                            }}
                          />
                        </div>
                        <div>
                          <Text size="xsmall">Max Wt (g)</Text>
                          <Input
                            type="number"
                            value={box.max_weight_grams}
                            onChange={(e) => {
                              const updated = [...boxConfigs]
                              updated[idx] = {
                                ...updated[idx],
                                max_weight_grams: Number(e.target.value),
                              }
                              setBoxConfigs(updated)
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Container>
          </div>
        </Tabs.Content>

        {/* ============================================================ */}
        {/* TAB 2: WAREHOUSES                                            */}
        {/* ============================================================ */}
        <Tabs.Content value="warehouses">
          <Container className="flex flex-col gap-4 mt-4 bg-ui-bg-subtle">
            <div className="flex items-center justify-between">
              <Heading level="h2" className="text-lg">
                Warehouses & Pickup Locations
              </Heading>
              <Button
                variant="secondary"
                size="small"
                onClick={() =>
                  setWarehouses([
                    ...warehouses,
                    {
                      id: `new_${Date.now()}`,
                      name: "",
                      pincode: "",
                      city: "",
                      state: "",
                      is_primary: warehouses.length === 0,
                      is_drop_ship: false,
                      vendor_webhook_url: null,
                      stock_location_id: null,
                    },
                  ])
                }
              >
                Add Warehouse
              </Button>
            </div>
            <Text className="text-ui-fg-subtle text-sm">
              Each warehouse maps bidirectionally to a Medusa Stock Location.
              Shipping rates are calculated per origin pincode.
            </Text>

            {warehouses.length === 0 ? (
              <Text className="text-ui-fg-muted text-sm italic">
                No warehouses configured. Add one to enable warehouse-based routing.
              </Text>
            ) : (
              <div className="flex flex-col gap-4">
                {warehouses.map((wh, idx) => (
                  <div
                    key={wh.id || idx}
                    className="bg-ui-bg-base p-4 rounded-md border flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Warehouse Name"
                        value={wh.name || ""}
                        onChange={(e) => {
                          const updated = [...warehouses]
                          updated[idx] = { ...updated[idx], name: e.target.value }
                          setWarehouses(updated)
                        }}
                        className="flex-1"
                      />
                      {wh.is_primary && (
                        <Badge color="green">Primary</Badge>
                      )}
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => {
                          const updated = [...warehouses]
                          updated.splice(idx, 1)
                          setWarehouses(updated)
                        }}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Pincode</Label>
                        <Input
                          value={wh.pincode || ""}
                          onChange={(e) => {
                            const updated = [...warehouses]
                            updated[idx] = {
                              ...updated[idx],
                              pincode: e.target.value,
                            }
                            setWarehouses(updated)
                          }}
                        />
                      </div>
                      <div>
                        <Label>City</Label>
                        <Input
                          value={wh.city || ""}
                          onChange={(e) => {
                            const updated = [...warehouses]
                            updated[idx] = {
                              ...updated[idx],
                              city: e.target.value,
                            }
                            setWarehouses(updated)
                          }}
                        />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Input
                          value={wh.state || ""}
                          onChange={(e) => {
                            const updated = [...warehouses]
                            updated[idx] = {
                              ...updated[idx],
                              state: e.target.value,
                            }
                            setWarehouses(updated)
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={wh.is_primary}
                          onCheckedChange={(checked) => {
                            const updated = warehouses.map((w, i) => ({
                              ...w,
                              is_primary: i === idx ? checked : false,
                            }))
                            setWarehouses(updated)
                          }}
                        />
                        <Label>Primary Warehouse</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={wh.is_drop_ship}
                          onCheckedChange={(checked) => {
                            const updated = [...warehouses]
                            updated[idx] = {
                              ...updated[idx],
                              is_drop_ship: checked,
                            }
                            setWarehouses(updated)
                          }}
                        />
                        <Label>Drop-Ship Vendor</Label>
                      </div>
                    </div>

                    {wh.is_drop_ship && (
                      <div>
                        <Label>Vendor Webhook URL</Label>
                        <Input
                          placeholder="https://vendor.example.com/webhook"
                          value={wh.vendor_webhook_url || ""}
                          onChange={(e) => {
                            const updated = [...warehouses]
                            updated[idx] = {
                              ...updated[idx],
                              vendor_webhook_url: e.target.value,
                            }
                            setWarehouses(updated)
                          }}
                        />
                      </div>
                    )}

                    {wh.stock_location_id && (
                      <Text size="xsmall" className="text-ui-fg-muted">
                        Linked to Medusa Location: {wh.stock_location_id}
                      </Text>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Container>
        </Tabs.Content>

        {/* ============================================================ */}
        {/* TAB: SHIPPING OPTIONS (native + extension merged view)       */}
        {/* ============================================================ */}
        <Tabs.Content value="shipping-options">
          {/* --- Serviceable Area (edits native ServiceZone geo_zones) --- */}
          <Container className="flex flex-col gap-4 bg-ui-bg-subtle mt-4">
            <div className="flex items-center justify-between">
              <div>
                <Heading level="h2" className="text-lg">
                  Serviceable Area
                </Heading>
                <Text className="text-ui-fg-subtle" size="small">
                  Countries and pincode ranges where the auto-provisioned
                  options are offered.
                </Text>
              </div>
              <Button
                variant="secondary"
                size="small"
                onClick={loadServiceZones}
              >
                Reload
              </Button>
            </div>

            {serviceZones.length === 0 && (
              <Text className="text-ui-fg-muted">
                No service zones yet — add a warehouse to auto-provision one.
              </Text>
            )}

            {serviceZones.map((zone) => {
              const geoZones = zone.geo_zones || []
              const countries = geoZones
                .filter((g: any) => g.type === "country")
                .map((g: any) => g.country_code)
                .join(", ")
              const zips = geoZones
                .filter((g: any) => g.type === "zip")
                .map((g: any) => g.postal_expression)
                .join(", ")

              return (
                <Container
                  key={zone.id}
                  className="flex flex-col gap-3 bg-ui-bg-base"
                >
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {zone.id}
                  </Text>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <Label>Zone name</Label>
                      <Input
                        defaultValue={zone.name || ""}
                        onBlur={(e) => {
                          if (e.target.value !== zone.name) {
                            saveServiceZone(zone.id, {
                              name: e.target.value,
                            })
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Country codes (comma separated, e.g. in, us)</Label>
                      <Input
                        defaultValue={countries}
                        onBlur={(e) => {
                          const codes = e.target.value
                            .split(",")
                            .map((s) => s.trim().toLowerCase())
                            .filter(Boolean)
                          const otherZones = geoZones.filter(
                            (g: any) => g.type !== "country"
                          )
                          const nextGeo = [
                            ...otherZones,
                            ...codes.map((code) => ({
                              type: "country",
                              country_code: code,
                            })),
                          ]
                          saveServiceZone(zone.id, { geo_zones: nextGeo })
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <Label>
                        Pincode / ZIP expressions (comma separated,
                        e.g. 110001, 4000*)
                      </Label>
                      <Textarea
                        defaultValue={zips}
                        onBlur={(e) => {
                          const exprs = e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                          const otherZones = geoZones.filter(
                            (g: any) => g.type !== "zip"
                          )
                          const nextGeo = [
                            ...otherZones,
                            ...exprs.map((expr) => ({
                              type: "zip",
                              country_code:
                                geoZones.find((g: any) => g.type === "country")
                                  ?.country_code || "in",
                              postal_expression: expr,
                            })),
                          ]
                          saveServiceZone(zone.id, { geo_zones: nextGeo })
                        }}
                      />
                    </div>
                  </div>
                </Container>
              )
            })}
          </Container>

          <Container className="flex flex-col gap-4 bg-ui-bg-subtle mt-4">
            <div className="flex items-center justify-between">
              <div>
                <Heading level="h2" className="text-lg">
                  Native Shipping Options
                </Heading>
                <Text className="text-ui-fg-subtle" size="small">
                  Auto-provisioned per warehouse. Edits here update both the
                  Medusa native option and our extension fields.
                </Text>
              </div>
              <Button
                variant="secondary"
                size="small"
                onClick={loadShippingOptions}
              >
                Reload
              </Button>
            </div>

            {shippingOptions.length === 0 && (
              <Text className="text-ui-fg-muted">
                No native options yet. Add a warehouse to auto-provision
                Standard / Express / Local options.
              </Text>
            )}

            <div className="flex flex-col gap-4">
              {shippingOptions.map((row) => {
                const nativeId = row.native.id
                const currentName = row.native.name || ""
                const currentDisplay =
                  row.extension?.display_name ||
                  row.native.metadata?.display_name ||
                  ""
                const currentBlacklist = Array.isArray(
                  row.extension?.carrier_blacklist
                )
                  ? (row.extension?.carrier_blacklist as string[]).join(", ")
                  : ""
                const surchargeFlat = row.extension?.surcharge_flat ?? 0
                const surchargePct = row.extension?.surcharge_percent ?? 0

                return (
                  <Container
                    key={nativeId}
                    className="flex flex-col gap-3 bg-ui-bg-base"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge>{row.extension?.tier || "custom"}</Badge>
                        <Text
                          size="xsmall"
                          className="text-ui-fg-muted mt-1"
                        >
                          {nativeId}
                        </Text>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label>Native name</Label>
                        <Input
                          defaultValue={currentName}
                          onBlur={(e) => {
                            if (e.target.value !== currentName) {
                              saveShippingOption(nativeId, {
                                name: e.target.value,
                              })
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>Display name (customer-facing)</Label>
                        <Input
                          defaultValue={currentDisplay}
                          onBlur={(e) => {
                            if (e.target.value !== currentDisplay) {
                              saveShippingOption(nativeId, {
                                display_name: e.target.value,
                              })
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-1 col-span-2">
                        <Label>Per-option carrier blacklist (comma separated)</Label>
                        <Textarea
                          defaultValue={currentBlacklist}
                          onBlur={(e) => {
                            const next = e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                            saveShippingOption(nativeId, {
                              carrier_blacklist: next,
                            })
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>Surcharge flat (₹)</Label>
                        <Input
                          type="number"
                          defaultValue={String(surchargeFlat)}
                          onBlur={(e) => {
                            const n = Number(e.target.value) || 0
                            if (n !== surchargeFlat) {
                              saveShippingOption(nativeId, {
                                surcharge_flat: n,
                              })
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>Surcharge % on top of calc</Label>
                        <Input
                          type="number"
                          defaultValue={String(surchargePct)}
                          onBlur={(e) => {
                            const n = Number(e.target.value) || 0
                            if (n !== surchargePct) {
                              saveShippingOption(nativeId, {
                                surcharge_percent: n,
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
          </Container>
        </Tabs.Content>

        {/* ============================================================ */}
        {/* TAB 3: PRICING & THRESHOLDS                                  */}
        {/* ============================================================ */}
        <Tabs.Content value="pricing">
          <div className="grid grid-cols-2 gap-6 mt-4">
            <Container className="flex flex-col gap-4 bg-ui-bg-subtle">
              <Heading level="h2" className="text-lg">
                Free Shipping & Markups
              </Heading>

              <div className="flex flex-col gap-2">
                <Label>Free Shipping Threshold (Rs)</Label>
                <Input
                  type="number"
                  value={settings.free_shipping_threshold}
                  onChange={(e) =>
                    updateSetting(
                      "free_shipping_threshold",
                      Number(e.target.value)
                    )
                  }
                />
                <Text size="xsmall" className="text-ui-fg-muted">
                  Set to 0 to disable. Categories with "free_shipping_exclusion"
                  rule are exempt.
                </Text>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Global Markup Type</Label>
                <Select
                  value={settings.global_markup_type}
                  onValueChange={(v) =>
                    updateSetting("global_markup_type", v)
                  }
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="none">No Markup</Select.Item>
                    <Select.Item value="flat">Flat Fee (Rs X)</Select.Item>
                    <Select.Item value="percentage">
                      Percentage (X%)
                    </Select.Item>
                  </Select.Content>
                </Select>
              </div>

              {settings.global_markup_type !== "none" && (
                <div className="flex flex-col gap-2">
                  <Label>Markup Value</Label>
                  <Input
                    type="number"
                    value={settings.global_markup_value}
                    onChange={(e) =>
                      updateSetting(
                        "global_markup_value",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.absorb_split_shipment_cost}
                  onCheckedChange={(v) =>
                    updateSetting("absorb_split_shipment_cost", v)
                  }
                />
                <Label>Absorb Split Shipment Cost</Label>
              </div>
              <Text size="xsmall" className="text-ui-fg-muted">
                When enabled, only the highest shipment cost is charged
                if the order splits across warehouses.
              </Text>
            </Container>

            <Container className="flex flex-col gap-4 bg-ui-bg-subtle">
              <Heading level="h2" className="text-lg">
                Dynamic Surcharges
              </Heading>

              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.surcharge_enabled}
                  onCheckedChange={(v) =>
                    updateSetting("surcharge_enabled", v)
                  }
                />
                <Label>Enable Surcharge</Label>
              </div>

              {settings.surcharge_enabled && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label>Surcharge Label</Label>
                    <Input
                      placeholder="e.g. Festive Surcharge, Fuel Surcharge"
                      value={settings.surcharge_label}
                      onChange={(e) =>
                        updateSetting("surcharge_label", e.target.value)
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Surcharge Type</Label>
                    <Select
                      value={settings.surcharge_type}
                      onValueChange={(v) =>
                        updateSetting("surcharge_type", v)
                      }
                    >
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="flat">Flat (Rs)</Select.Item>
                        <Select.Item value="percentage">
                          Percentage (%)
                        </Select.Item>
                      </Select.Content>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Surcharge Value</Label>
                    <Input
                      type="number"
                      value={settings.surcharge_value}
                      onChange={(e) =>
                        updateSetting(
                          "surcharge_value",
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                </>
              )}

              {/* Hyperlocal */}
              <Heading level="h2" className="text-lg mt-4">
                Hyperlocal Delivery
              </Heading>

              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.hyperlocal_enabled}
                  onCheckedChange={(v) =>
                    updateSetting("hyperlocal_enabled", v)
                  }
                />
                <Label>Enable Hyperlocal Bypass</Label>
              </div>
              <Text size="xsmall" className="text-ui-fg-muted">
                If delivery pincode matches a warehouse pincode, skip
                Shiprocket and use the flat rate below.
              </Text>

              {settings.hyperlocal_enabled && (
                <div className="flex flex-col gap-2">
                  <Label>Hyperlocal Flat Rate (Rs)</Label>
                  <Input
                    type="number"
                    value={settings.hyperlocal_flat_rate}
                    onChange={(e) =>
                      updateSetting(
                        "hyperlocal_flat_rate",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
              )}
            </Container>
          </div>
        </Tabs.Content>

        {/* ============================================================ */}
        {/* TAB 4: RULES ENGINE                                          */}
        {/* ============================================================ */}
        <Tabs.Content value="rules">
          <Container className="flex flex-col gap-4 mt-4 bg-ui-bg-subtle">
            <div className="flex items-center justify-between">
              <Heading level="h2" className="text-lg">
                Shipping Rules
              </Heading>
              <Button
                variant="secondary"
                size="small"
                onClick={() =>
                  setRules([
                    ...rules,
                    {
                      target_type: "category",
                      target_id: "",
                      rule_type: "force_flat_rate",
                      value: { action_value: 0 },
                    },
                  ])
                }
              >
                Add Rule
              </Button>
            </div>
            <Text className="text-ui-fg-subtle text-sm">
              Map categories, pincodes, or customer groups to custom shipping
              behavior.
            </Text>

            {rules.length === 0 ? (
              <Text className="text-ui-fg-muted text-sm italic">
                No custom rules configured.
              </Text>
            ) : (
              <div className="flex flex-col gap-3">
                {rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="bg-ui-bg-base p-3 rounded-md border flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <Select
                        value={rule.target_type}
                        onValueChange={(v) => {
                          const updated = [...rules]
                          updated[idx] = { ...updated[idx], target_type: v }
                          setRules(updated)
                        }}
                      >
                        <Select.Trigger className="w-[160px]">
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Item value="category">Category</Select.Item>
                          <Select.Item value="product">Product</Select.Item>
                          <Select.Item value="pincode">Pincode</Select.Item>
                          <Select.Item value="customer_group">
                            Customer Group
                          </Select.Item>
                        </Select.Content>
                      </Select>

                      {rule.target_type === "category" ? (
                        <Select
                          value={rule.target_id}
                          onValueChange={(v) => {
                            const updated = [...rules]
                            updated[idx] = { ...updated[idx], target_id: v }
                            setRules(updated)
                          }}
                        >
                          <Select.Trigger className="w-[200px]">
                            <Select.Value placeholder="Select Category" />
                          </Select.Trigger>
                          <Select.Content>
                            {categories.map((c) => (
                              <Select.Item key={c.id} value={c.id}>
                                {c.name}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select>
                      ) : (
                        <Input
                          placeholder="Target ID / Value"
                          value={rule.target_id || ""}
                          onChange={(e) => {
                            const updated = [...rules]
                            updated[idx] = {
                              ...updated[idx],
                              target_id: e.target.value,
                            }
                            setRules(updated)
                          }}
                          className="w-[200px]"
                        />
                      )}

                      <Select
                        value={rule.rule_type}
                        onValueChange={(v) => {
                          const updated = [...rules]
                          updated[idx] = { ...updated[idx], rule_type: v }
                          setRules(updated)
                        }}
                      >
                        <Select.Trigger className="w-[220px]">
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Item value="force_flat_rate">
                            Flat Rate (Rs)
                          </Select.Item>
                          <Select.Item value="block_pincode">
                            Block Pincode
                          </Select.Item>
                          <Select.Item value="block_service">
                            Block Service
                          </Select.Item>
                          <Select.Item value="free_shipping_exclusion">
                            Exclude from Free Shipping
                          </Select.Item>
                          <Select.Item value="cod_block">
                            Block COD
                          </Select.Item>
                          <Select.Item value="cod_premium">
                            COD Premium
                          </Select.Item>
                          <Select.Item value="b2b_override">
                            B2B Override Rate
                          </Select.Item>
                          <Select.Item value="hyperlocal_bypass">
                            Hyperlocal Bypass
                          </Select.Item>
                          <Select.Item value="force_surface_only">
                            Surface Only
                          </Select.Item>
                        </Select.Content>
                      </Select>

                      {(rule.rule_type === "force_flat_rate" ||
                        rule.rule_type === "cod_premium" ||
                        rule.rule_type === "b2b_override") && (
                        <Input
                          type="number"
                          placeholder="Amount (Rs)"
                          value={(rule.value as any)?.action_value || 0}
                          onChange={(e) => {
                            const updated = [...rules]
                            updated[idx] = {
                              ...updated[idx],
                              value: {
                                ...(updated[idx].value as any),
                                action_value: Number(e.target.value),
                              },
                            }
                            setRules(updated)
                          }}
                          className="w-[120px]"
                        />
                      )}

                      {rule.rule_type === "block_pincode" && (
                        <Input
                          placeholder="Comma-separated pincodes"
                          value={
                            ((rule.value as any)?.pincodes || []).join(", ") ||
                            ""
                          }
                          onChange={(e) => {
                            const updated = [...rules]
                            updated[idx] = {
                              ...updated[idx],
                              value: {
                                pincodes: e.target.value
                                  .split(",")
                                  .map((p: string) => p.trim())
                                  .filter(Boolean),
                              },
                            }
                            setRules(updated)
                          }}
                          className="flex-1"
                        />
                      )}

                      <Button
                        variant="danger"
                        size="small"
                        className="ml-auto"
                        onClick={() => {
                          const updated = [...rules]
                          updated.splice(idx, 1)
                          setRules(updated)
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Container>
        </Tabs.Content>

        {/* ============================================================ */}
        {/* TAB 5: COURIER CONTROLS                                      */}
        {/* ============================================================ */}
        <Tabs.Content value="couriers">
          <div className="grid grid-cols-2 gap-6 mt-4">
            <Container className="flex flex-col gap-4 bg-ui-bg-subtle">
              <Heading level="h2" className="text-lg">
                Carrier Blacklist
              </Heading>
              <Text className="text-ui-fg-subtle text-sm">
                Comma-separated list of courier names to exclude from rate
                selection (e.g. "Xpressbees, Delhivery Surface").
              </Text>
              <Textarea
                placeholder="Xpressbees, Delhivery Surface, DTDC Economy"
                value={(settings.carrier_blacklist || []).join(", ")}
                onChange={(e) =>
                  updateSetting(
                    "carrier_blacklist",
                    e.target.value
                      .split(",")
                      .map((s: string) => s.trim())
                      .filter(Boolean)
                  )
                }
                rows={3}
              />

              <Heading level="h2" className="text-lg mt-4">
                Courier Display Names
              </Heading>
              <Text className="text-ui-fg-subtle text-sm">
                Map internal Shiprocket courier names to customer-facing labels.
                One per line: InternalName = Display Name
              </Text>
              <Textarea
                placeholder={`Bluedart = Standard Delivery (3-5 days)\nDelhivery = Express Delivery (1-2 days)`}
                value={Object.entries(settings.courier_display_map || {})
                  .map(([k, v]) => `${k} = ${v}`)
                  .join("\n")}
                onChange={(e) => {
                  const map: Record<string, string> = {}
                  e.target.value.split("\n").forEach((line: string) => {
                    const [key, ...rest] = line.split("=")
                    if (key && rest.length > 0) {
                      map[key.trim()] = rest.join("=").trim()
                    }
                  })
                  updateSetting("courier_display_map", map)
                }}
                rows={4}
              />
            </Container>

            <Container className="flex flex-col gap-4 bg-ui-bg-subtle">
              <Heading level="h2" className="text-lg">
                Serviceability Tester
              </Heading>
              <Text className="text-ui-fg-subtle text-sm">
                Test Shiprocket serviceability for any route without creating an
                order.
              </Text>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Pickup Pincode</Label>
                  <Input
                    value={testPickup}
                    onChange={(e) => setTestPickup(e.target.value)}
                    placeholder="110030"
                  />
                </div>
                <div>
                  <Label>Delivery Pincode</Label>
                  <Input
                    value={testDelivery}
                    onChange={(e) => setTestDelivery(e.target.value)}
                    placeholder="400001"
                  />
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    value={testWeight}
                    onChange={(e) => setTestWeight(e.target.value)}
                  />
                </div>
              </div>

              <Button
                variant="secondary"
                onClick={handleTestServiceability}
                isLoading={testing}
              >
                Test Serviceability
              </Button>

              {testResult && (
                <div
                  className={`p-3 rounded-md border ${
                    testResult.serviceable
                      ? "bg-ui-bg-interactive border-ui-border-interactive"
                      : "bg-ui-bg-subtle border-ui-border-error"
                  }`}
                >
                  <Text weight="plus">
                    {testResult.serviceable
                      ? `Serviceable - ${testResult.courier_count} couriers available`
                      : `Not Serviceable${testResult.error ? `: ${testResult.error}` : ""}`}
                  </Text>
                  {testResult.couriers?.length > 0 && (
                    <div className="mt-2 text-sm">
                      {testResult.couriers
                        .slice(0, 5)
                        .map((c: any, i: number) => (
                          <div key={i} className="flex justify-between">
                            <span>{c.courier_name}</span>
                            <span>Rs {c.rate} | {c.etd}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </Container>
          </div>
        </Tabs.Content>

        {/* ============================================================ */}
        {/* TAB 6: COD & RTO                                             */}
        {/* ============================================================ */}
        <Tabs.Content value="cod">
          <div className="grid grid-cols-2 gap-6 mt-4">
            <Container className="flex flex-col gap-4 bg-ui-bg-subtle">
              <Heading level="h2" className="text-lg">
                COD Controls
              </Heading>

              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.absorb_cod_fee}
                  onCheckedChange={(v) => updateSetting("absorb_cod_fee", v)}
                />
                <Label>Absorb COD Fee</Label>
              </div>
              <Text size="xsmall" className="text-ui-fg-muted">
                If enabled, the COD handling charge from the courier is not
                passed to the customer.
              </Text>

              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.cod_premium_enabled}
                  onCheckedChange={(v) =>
                    updateSetting("cod_premium_enabled", v)
                  }
                />
                <Label>Enable COD Risk Premium</Label>
              </div>

              {settings.cod_premium_enabled && (
                <div className="flex flex-col gap-2">
                  <Label>COD Premium Amount (Rs)</Label>
                  <Input
                    type="number"
                    value={settings.cod_premium_value}
                    onChange={(e) =>
                      updateSetting(
                        "cod_premium_value",
                        Number(e.target.value)
                      )
                    }
                  />
                  <Text size="xsmall" className="text-ui-fg-muted">
                    Added to shipping cost for RTO-risky pincodes when COD is
                    selected.
                  </Text>
                </div>
              )}
            </Container>

            <Container className="flex flex-col gap-4 bg-ui-bg-subtle">
              <div className="flex items-center justify-between">
                <Heading level="h2" className="text-lg">
                  RTO Risk Pincodes
                </Heading>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() =>
                    setRtoPincodes([
                      ...rtoPincodes,
                      { pincode: "", risk_level: "medium", block_cod: false },
                    ])
                  }
                >
                  Add Pincode
                </Button>
              </div>
              <Text className="text-ui-fg-subtle text-sm">
                Pincodes with high RTO rates. COD can be blocked or a premium
                applied.
              </Text>

              {rtoPincodes.length === 0 ? (
                <Text className="text-ui-fg-muted text-sm italic">
                  No RTO risk pincodes configured. (Placeholder for Shiprocket
                  RTO data integration)
                </Text>
              ) : (
                <div className="flex flex-col gap-2">
                  {rtoPincodes.map((rto, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-ui-bg-base p-2 rounded-md border"
                    >
                      <Input
                        placeholder="Pincode"
                        value={rto.pincode || ""}
                        onChange={(e) => {
                          const updated = [...rtoPincodes]
                          updated[idx] = {
                            ...updated[idx],
                            pincode: e.target.value,
                          }
                          setRtoPincodes(updated)
                        }}
                        className="w-[140px]"
                      />
                      <Select
                        value={rto.risk_level}
                        onValueChange={(v) => {
                          const updated = [...rtoPincodes]
                          updated[idx] = { ...updated[idx], risk_level: v }
                          setRtoPincodes(updated)
                        }}
                      >
                        <Select.Trigger className="w-[120px]">
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Item value="high">High Risk</Select.Item>
                          <Select.Item value="medium">
                            Medium Risk
                          </Select.Item>
                        </Select.Content>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rto.block_cod}
                          onCheckedChange={(checked) => {
                            const updated = [...rtoPincodes]
                            updated[idx] = {
                              ...updated[idx],
                              block_cod: checked,
                            }
                            setRtoPincodes(updated)
                          }}
                        />
                        <Label>Block COD</Label>
                      </div>
                      <Button
                        variant="danger"
                        size="small"
                        className="ml-auto"
                        onClick={() => {
                          const updated = [...rtoPincodes]
                          updated.splice(idx, 1)
                          setRtoPincodes(updated)
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Container>
          </div>
        </Tabs.Content>

        {/* ============================================================ */}
        {/* TAB 7: RETURNS                                               */}
        {/* ============================================================ */}
        <Tabs.Content value="returns">
          <Container className="flex flex-col gap-4 mt-4 bg-ui-bg-subtle max-w-lg">
            <Heading level="h2" className="text-lg">
              Return & Reverse Pickup
            </Heading>

            <div className="flex flex-col gap-2">
              <Label>Reverse Pickup Fee (Rs)</Label>
              <Input
                type="number"
                value={settings.reverse_pickup_fee}
                onChange={(e) =>
                  updateSetting(
                    "reverse_pickup_fee",
                    Number(e.target.value)
                  )
                }
              />
              <Text size="xsmall" className="text-ui-fg-muted">
                Set to 0 for free returns. Otherwise, this amount is deducted
                from the refund.
              </Text>
            </div>
          </Container>
        </Tabs.Content>
      </Tabs>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Shipping Orchestrator",
})

export default ShippingOrchestrator
