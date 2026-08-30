import { createFileRoute } from "@tanstack/react-router"
import { ContentScreen } from "../screens/content-screen"

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact · Valy" },
    { name: "description", content: "Write to us about a machine, an order, a warranty claim or whether a part fits." },
  ] }),
  component: () => <ContentScreen page="Contact" />,
})
