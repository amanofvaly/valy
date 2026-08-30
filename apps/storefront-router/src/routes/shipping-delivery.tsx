import { createFileRoute } from "@tanstack/react-router"
import { ContentScreen } from "../screens/content-screen"

export const Route = createFileRoute("/shipping-delivery")({
  head: () => ({ meta: [
    { title: "Shipping & Delivery · Valy" },
    { name: "description", content: "How we build, pack, and ship your orders across India." },
  ] }),
  component: () => <ContentScreen page="Shipping" />,
})
