import { createFileRoute } from "@tanstack/react-router"
import { ContentScreen } from "../screens/content-screen"

export const Route = createFileRoute("/refund-cancellations")({
  head: () => ({ meta: [
    { title: "Refunds & Cancellations · Valy" },
    { name: "description", content: "Our refund and cancellation policy. Clear terms for returning machines and parts." },
  ] }),
  component: () => <ContentScreen page="Refunds" />,
})
