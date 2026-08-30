import { createFileRoute } from "@tanstack/react-router"
import { DEFAULT_COUNTRY } from "../../app/lib/market"
import { flowPriceQuery } from "../data/catalogue"
import Home from "../screens/home-screen"

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(flowPriceQuery(DEFAULT_COUNTRY)),
  head: () => ({ meta: [{ name: "description", content: "Photo backup and sync, media streaming, home automation, network monitoring, virtualization and more - all on a machine you own. Free and open source apps to run your home on your terms." }] }),
  component: Home,
})
