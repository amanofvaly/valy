import type { QueryClient } from "@tanstack/react-query"
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { OptimisticCartProvider } from "@modules/cart/context/optimistic-cart"
import { absoluteUrl } from "../../app/lib/market"
import "../../app/styles/globals.css"

type RouterContext = { queryClient: QueryClient }

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { name: "theme-color", content: "#ffffff" },
      { title: "Valy — homelab servers" },
      { name: "description", content: "Preconfigured homelab servers for India. Shop systems, drives, memory, and accessories." },
      { property: "og:title", content: "Valy — homelab servers" },
      { property: "og:description", content: "Preconfigured homelab servers for India. Shop systems, drives, memory, and accessories." },
      { property: "og:url", content: absoluteUrl("/") },
      { property: "og:site_name", content: "Valy" },
      { property: "og:image", content: absoluteUrl("/og.jpg") },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Valy — homelab servers" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_IN" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Valy — homelab servers" },
      /* Deliberately not the OG copy: the old store wrote this line separately. */
      { name: "twitter:description", content: "Preconfigured homelab servers for Indian homes and offices, and the drives, memory and cards that fit them." },
      { name: "twitter:image", content: absoluteUrl("/og.jpg") },
    ],
    links: [
      /* Next generated these from `app/icon.svg` and `app/favicon.ico`; here
       * they are declared, so the SVG mark is used where it is supported. */
      { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:opsz,wght@14..32,100..900&display=swap" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => <StatusPage title="404" detail="The page could not be found." />,
  errorComponent: ({ error }) => <StatusPage title="Something went wrong" detail={error.message} />,
})

function RootComponent() {
  return (
    <RootDocument>
      <OptimisticCartProvider><Outlet /></OptimisticCartProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-mode="light" style={{ "--font-sans": "Inter", "--font-mono": "IBM Plex Mono" } as React.CSSProperties}>
      <head><HeadContent /></head>
      <body className="min-h-screen bg-paper text-ink">
        <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper">Skip to content</a>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function StatusPage({ title, detail }: { title: string; detail: string }) {
  return (
    <main id="content" className="container-page flex min-h-screen flex-col justify-center py-24">
      <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 max-w-prose text-muted">{detail}</p>
      <a className="mt-8 w-fit text-sm font-medium text-accent underline underline-offset-4" href="/">Return home</a>
    </main>
  )
}
