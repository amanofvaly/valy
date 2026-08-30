import { createFileRoute } from "@tanstack/react-router"
import { ContentScreen } from "../screens/content-screen"

export const Route = createFileRoute("/compatibility")({
  head: () => ({ meta: [
    { title: "What fits what · Valy" },
    { name: "description", content: "Any drive that fits the bay works. No approved-drive list, no locked features, no vendor-keyed parts. What actually constrains compatibility, and what does not." },
  ] }),
  component: () => <ContentScreen page="Compatibility" />,
})
