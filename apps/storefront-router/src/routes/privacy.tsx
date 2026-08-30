import { createFileRoute } from "@tanstack/react-router"
import { ContentScreen } from "../screens/content-screen"

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: "Privacy · Valy" },
    { name: "description", content: "What we collect, why, how long we keep it, and the long list of things we do not do with it." },
  ] }),
  component: () => <ContentScreen page="Privacy" />,
})
