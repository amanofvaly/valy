import { createFileRoute } from "@tanstack/react-router"
import { ContentScreen } from "../screens/content-screen"

export const Route = createFileRoute("/$countryCode/terms")({
  head: () => ({ meta: [
    { title: "Terms of sale · Valy" },
    { name: "description", content: "Warranty, returns, delivery, GST invoicing and what happens when something breaks. Written to be read." },
  ] }),
  component: () => <ContentScreen page="Terms" />,
})
