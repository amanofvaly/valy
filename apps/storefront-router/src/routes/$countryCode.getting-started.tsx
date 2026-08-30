import { createFileRoute } from "@tanstack/react-router"
import { ContentScreen } from "../screens/content-screen"

export const Route = createFileRoute("/$countryCode/getting-started")({
  head: () => ({ meta: [
    { title: "Getting started · Valy" },
    { name: "description", content: "How much space you actually need, what redundancy costs, and the cheapest sensible way to move a photo library off the cloud. With a RAID calculator." },
  ] }),
  component: () => <ContentScreen page="GettingStarted" />,
})
