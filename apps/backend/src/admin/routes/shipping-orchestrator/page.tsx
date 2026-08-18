import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { Container, Heading, Text, Button, Select, Input, Switch, toast } from "@medusajs/ui"

const ShippingOrchestrator = () => {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [rules, setRules] = useState<any[]>([])

  useEffect(() => {
    fetch("/admin/shipping-orchestrator", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setSettings(data.settings)
        if (data.rules) setRules(data.rules)
        return fetch("/admin/product-categories", { credentials: "include" })
      })
      .then(res => res.json())
      .then(data => {
        if (data.product_categories) setCategories(data.product_categories)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/admin/shipping-orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ settings, rules })
      })
      if (res.ok) {
        toast.success("Settings saved successfully")
      } else {
        toast.error("Failed to save settings")
      }
    } catch (e) {
      toast.error("Failed to save settings")
    }
    setSaving(false)
  }

  const handleAddRule = () => {
    setRules([...rules, { 
      operator: "eq", 
      attribute: "category_id", 
      value: "", 
      action_type: "flat_rate", 
      action_value: 0 
    }])
  }

  const handleRuleChange = (index: number, field: string, val: string | number) => {
    const newRules = [...rules]
    newRules[index] = { ...newRules[index], [field]: val }
    setRules(newRules)
  }

  const handleRemoveRule = (index: number) => {
    const newRules = [...rules]
    newRules.splice(index, 1)
    setRules(newRules)
  }

  if (loading) return <Container>Loading...</Container>

  return (
    <Container className="flex flex-col gap-y-6">
      <Heading>Unified Shipping Orchestrator</Heading>
      <Text className="text-ui-fg-subtle">
        Control your entire logistics engine. Route to Shiprocket, configure volumetric maths, and manage free shipping thresholds.
      </Text>

      <div className="grid grid-cols-2 gap-6 mt-4">
        {/* Master Controls */}
        <Container className="flex flex-col gap-4 bg-ui-bg-subtle">
          <Heading level="h2" className="text-lg">Core Engine</Heading>
          
          <div className="flex flex-col gap-2">
            <Text weight="plus" size="small">Active Provider</Text>
            <Select 
              value={settings.active_provider} 
              onValueChange={(val) => setSettings({...settings, active_provider: val})}
            >
              <Select.Trigger><Select.Value /></Select.Trigger>
              <Select.Content>
                <Select.Item value="shiprocket">Shiprocket (Live API)</Select.Item>
                <Select.Item value="manual_slabs">Manual Weight Slabs</Select.Item>
              </Select.Content>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Text weight="plus" size="small">Volumetric Divisor</Text>
            <Input 
              type="number"
              value={settings.volumetric_divisor} 
              onChange={(e) => setSettings({...settings, volumetric_divisor: Number(e.target.value)})}
            />
            <Text size="xsmall" className="text-ui-fg-muted">Standard is 5000 (LxWxH / 5000)</Text>
          </div>

          <div className="flex flex-col gap-2">
            <Text weight="plus" size="small">Fallback Item Weight (grams)</Text>
            <Input 
              type="number"
              value={settings.fallback_weight_grams} 
              onChange={(e) => setSettings({...settings, fallback_weight_grams: Number(e.target.value)})}
            />
            <Text size="xsmall" className="text-ui-fg-muted">Used if a product has no weight defined</Text>
          </div>
        </Container>

        {/* Pricing Controls */}
        <Container className="flex flex-col gap-4 bg-ui-bg-subtle">
          <Heading level="h2" className="text-lg">Pricing & Thresholds</Heading>
          
          <div className="flex flex-col gap-2">
            <Text weight="plus" size="small">Free Shipping Threshold (₹)</Text>
            <Input 
              type="number"
              value={settings.free_shipping_threshold} 
              onChange={(e) => setSettings({...settings, free_shipping_threshold: Number(e.target.value)})}
            />
            <Text size="xsmall" className="text-ui-fg-muted">Set to 0 to disable</Text>
          </div>

          <div className="flex flex-col gap-2">
            <Text weight="plus" size="small">Global Markup Type</Text>
            <Select 
              value={settings.global_markup_type} 
              onValueChange={(val) => setSettings({...settings, global_markup_type: val})}
            >
              <Select.Trigger><Select.Value /></Select.Trigger>
              <Select.Content>
                <Select.Item value="none">No Markup (Pass actual cost)</Select.Item>
                <Select.Item value="flat">Flat Fee (Add ₹X)</Select.Item>
                <Select.Item value="percentage">Percentage (Add X%)</Select.Item>
              </Select.Content>
            </Select>
          </div>

          {settings.global_markup_type !== "none" && (
            <div className="flex flex-col gap-2">
              <Text weight="plus" size="small">Markup Value</Text>
              <Input 
                type="number"
                value={settings.global_markup_value} 
                onChange={(e) => setSettings({...settings, global_markup_value: Number(e.target.value)})}
              />
            </div>
          )}
        </Container>
      </div>

      {/* Dynamic Rule Mapping */}
      <Container className="flex flex-col gap-4 bg-ui-bg-subtle">
        <div className="flex items-center justify-between">
          <Heading level="h2" className="text-lg">Category Rules & Overrides</Heading>
          <Button variant="secondary" size="small" onClick={handleAddRule}>
            Add Rule
          </Button>
        </div>
        <Text className="text-ui-fg-subtle text-sm mb-2">
          Map specific product categories to custom shipping behavior. For example, assign a flat ₹1000 fee to all "Heavy Furniture" items.
        </Text>

        {rules.length === 0 ? (
          <Text className="text-ui-fg-muted text-sm italic">No custom rules configured.</Text>
        ) : (
          <div className="flex flex-col gap-3">
            {rules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-ui-bg-base p-3 rounded-md border">
                <Text className="text-sm font-medium shrink-0">If Category is</Text>
                
                <Select 
                  value={rule.value} 
                  onValueChange={(val) => handleRuleChange(idx, "value", val)}
                >
                  <Select.Trigger className="w-[200px]"><Select.Value placeholder="Select Category" /></Select.Trigger>
                  <Select.Content>
                    {categories.map(c => (
                      <Select.Item key={c.id} value={c.id}>{c.name}</Select.Item>
                    ))}
                  </Select.Content>
                </Select>

                <Text className="text-sm font-medium shrink-0">then</Text>

                <Select 
                  value={rule.action_type} 
                  onValueChange={(val) => handleRuleChange(idx, "action_type", val)}
                >
                  <Select.Trigger className="w-[200px]"><Select.Value /></Select.Trigger>
                  <Select.Content>
                    <Select.Item value="flat_rate">Apply Flat Rate (₹)</Select.Item>
                    <Select.Item value="free">Mark Free Shipping</Select.Item>
                    <Select.Item value="skip_api">Skip Shiprocket API</Select.Item>
                  </Select.Content>
                </Select>

                {rule.action_type === "flat_rate" && (
                  <Input 
                    type="number" 
                    placeholder="Amount (₹)"
                    value={rule.action_value} 
                    onChange={(e) => handleRuleChange(idx, "action_value", Number(e.target.value))}
                    className="w-[120px]"
                  />
                )}

                <Button variant="danger" size="small" className="ml-auto" onClick={() => handleRemoveRule(idx)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </Container>

      <div className="flex justify-end mt-4">
        <Button variant="primary" onClick={handleSave} isLoading={saving}>
          Save Orchestrator Settings
        </Button>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Shipping Orchestrator",
})

export default ShippingOrchestrator
