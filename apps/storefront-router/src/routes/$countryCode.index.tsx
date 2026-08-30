import { createFileRoute } from "@tanstack/react-router"
import { flowPriceQuery } from "../data/catalogue"
import Home from "../screens/home-screen"

export const Route = createFileRoute("/$countryCode/")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(flowPriceQuery(params.countryCode.toLowerCase())),
  head: () => ({ meta: [{ name: "description", content: "Photo backup and sync, media streaming, home automation, network monitoring, virtualization and more - all on a machine you own. Free and open source apps to run your home on your terms." }] }),
  component: Home,
})
