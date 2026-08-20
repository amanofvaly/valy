import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

// ------------------------------------------------------------------
// Shipping readiness banner on Settings -> Locations & Shipping.
//
// This is where a merchant sets up delivery, so it is where they should learn
// that something is still missing — rather than finding out from a customer
// who could not check out.
// ------------------------------------------------------------------

type HealthCheck = {
  id: string
  level: "error" | "warning" | "ok"
  title: string
  detail: string
  action?: string
}

type Health = {
  status: "error" | "warning" | "ok"
  summary: { errors: number; warnings: number; checkout_ready: boolean }
  checks: HealthCheck[]
}

const ShippingReadinessWidget = () => {
  const [health, setHealth] = useState<Health | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch("/admin/shipping-orchestrator/health", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setHealth)
      .catch(() => setFailed(true))
  }, [])

  // Nothing to say when everything is fine, or when the check itself is
  // unavailable — an empty banner is worse than no banner.
  if (failed || !health || health.status === "ok") {
    return null
  }

  const blocking = health.summary.errors > 0

  return (
    <Container className="mb-4 flex flex-col gap-3 divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge color={blocking ? "red" : "orange"} size="2xsmall">
              {blocking ? "Checkout blocked" : "Needs attention"}
            </Badge>
            <Heading level="h2">Shipping setup is incomplete</Heading>
          </div>
          <Text size="small" className="text-ui-fg-subtle">
            {blocking
              ? `${health.summary.errors} problem${
                  health.summary.errors === 1 ? "" : "s"
                } will stop customers from choosing a delivery option.`
              : `${health.summary.warnings} setting${
                  health.summary.warnings === 1 ? "" : "s"
                } may not behave the way you expect.`}
          </Text>
        </div>
        <Button
          variant="secondary"
          size="small"
          onClick={() => {
            window.location.href = "/app/shipping-orchestrator"
          }}
        >
          Review setup
        </Button>
      </div>

      <div className="flex flex-col gap-3 px-6 py-4">
        {health.checks.slice(0, 3).map((check) => (
          <div key={check.id} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <Badge
                color={check.level === "error" ? "red" : "orange"}
                size="2xsmall"
              >
                {check.level === "error" ? "Blocking" : "Review"}
              </Badge>
              <Text size="small" className="font-medium">
                {check.title}
              </Text>
            </div>
            <Text size="small" className="text-ui-fg-subtle">
              {check.action ?? check.detail}
            </Text>
          </div>
        ))}
        {health.checks.length > 3 && (
          <Text size="small" className="text-ui-fg-muted">
            and {health.checks.length - 3} more
          </Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "location.list.before",
})

export default ShippingReadinessWidget
