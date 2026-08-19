import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Input, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

const GstSettingsPage = () => {
  const [companyGstin, setCompanyGstin] = useState("")
  const [defaultRate, setDefaultRate] = useState<number>(18)
  const [categoryRates, setCategoryRates] = useState<{category_id: string, rate: number, is_recursive?: boolean}[]>([])
  
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Fetch settings
    fetch("/admin/gst", {
        headers: { "Content-Type": "application/json" }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setCompanyGstin(data.settings.company_gstin || "")
        }
        if (data.defaultRate !== undefined) setDefaultRate(data.defaultRate)
        if (data.categoryRates) setCategoryRates(data.categoryRates)
        
        // Fetch categories
        return fetch("/admin/product-categories")
      })
      .then((res) => res.json())
      .then((data) => {
         if (data.product_categories) {
            setCategories(data.product_categories)
         }
         setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const handleAddCategoryRate = () => {
     setCategoryRates([...categoryRates, { category_id: "", rate: 0, is_recursive: false }])
  }

  const handleCategoryRateChange = (index: number, field: string, value: string | number | boolean) => {
     const newRates = [...categoryRates]
     newRates[index] = { ...newRates[index], [field]: value }
     setCategoryRates(newRates)
  }

  const handleRemoveCategoryRate = (index: number) => {
     const newRates = [...categoryRates]
     newRates.splice(index, 1)
     setCategoryRates(newRates)
  }

  const handleSave = async () => {
    setSaving(true)

    // Extract state code
    const origin_state_code = companyGstin.length >= 2 ? companyGstin.substring(0, 2) : "07"

    try {
      const res = await fetch("/admin/gst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            origin_state_code, 
            company_gstin: companyGstin,
            defaultRate: Number(defaultRate),
            categoryRates: categoryRates.map(cr => ({ ...cr, rate: Number(cr.rate) }))
        }),
      })
      if (res.ok) {
        toast.success("GST Settings updated", {
            description: "Your settings and tax rules have been perfectly orchestrated."
        })
      } else {
        toast.error("Failed to update settings")
      }
    } catch (e) {
      toast.error("Error updating settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
      return <Container className="p-8">Loading...</Container>
  }

  return (
    <Container className="p-8">
      <Heading className="mb-8">India GST Control Center</Heading>
      
      <div className="flex flex-col gap-8 max-w-2xl">
        {/* General Settings */}
        <div className="flex flex-col gap-4">
            <Heading level="h2" className="text-base">General</Heading>
            <div>
              <label className="text-ui-fg-subtle text-small font-medium mb-2 block">Company GSTIN</label>
              <Input 
                value={companyGstin}
                onChange={(e) => setCompanyGstin(e.target.value)}
                placeholder="e.g. 07AAAAA0000A1Z5"
              />
              <p className="text-ui-fg-muted text-small mt-2">
                We will automatically extract your Warehouse State Code from the first two digits.
              </p>
            </div>
            <div>
              <label className="text-ui-fg-subtle text-small font-medium mb-2 block">Default GST Rate (%)</label>
              <Input 
                type="number"
                value={defaultRate}
                onChange={(e) => setDefaultRate(Number(e.target.value))}
                placeholder="18"
              />
              <p className="text-ui-fg-muted text-small mt-2">
                This is your base tax rate applied to all products without a category override.
              </p>
            </div>
        </div>

        {/* Category Overrides */}
        <div className="flex flex-col gap-4">
            <Heading level="h2" className="text-base">Category Overrides</Heading>
            <p className="text-ui-fg-muted text-small">
                Assign specific GST percentages to different product categories (e.g. 5% for Apparel).
            </p>

            {categoryRates.map((cr, i) => (
                <div key={i} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="text-ui-fg-subtle text-small font-medium mb-2 block">Category</label>
                        <select 
                            className="w-full h-8 px-2 rounded-md border border-ui-border-base bg-ui-bg-base text-ui-fg-base text-small"
                            value={cr.category_id}
                            onChange={(e) => handleCategoryRateChange(i, "category_id", e.target.value)}
                        >
                            <option value="">Select Category</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-32">
                        <label className="text-ui-fg-subtle text-small font-medium mb-2 block">Rate (%)</label>
                        <Input 
                            type="number"
                            value={cr.rate}
                            onChange={(e) => handleCategoryRateChange(i, "rate", e.target.value)}
                            placeholder="18"
                        />
                    </div>
                    <div className="flex items-center h-8 gap-2 mb-1 border px-3 rounded-md border-ui-border-base bg-ui-bg-subtle">
                        <input 
                            type="checkbox" 
                            id={`recursive-${i}`}
                            checked={!!cr.is_recursive}
                            onChange={(e) => handleCategoryRateChange(i, "is_recursive", e.target.checked)}
                        />
                        <label htmlFor={`recursive-${i}`} className="text-ui-fg-subtle text-small">Apply Recursively</label>
                    </div>
                    <Button variant="danger" className="mb-1" onClick={() => handleRemoveCategoryRate(i)}>Remove</Button>
                </div>
            ))}

            <Button variant="secondary" onClick={handleAddCategoryRate} className="w-max mt-2">Add Override</Button>
        </div>

        <hr className="border-ui-border-base" />

        <Button variant="primary" onClick={handleSave} isLoading={saving} className="w-max">Save Settings</Button>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "India GST",
})

export default GstSettingsPage
