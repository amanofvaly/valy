import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { IBM_Plex_Mono, Inter } from "next/font/google"
import "styles/globals.css"

/**
 * Inter, at last actually fetched.
 *
 * The Medusa preset hardcoded `font-family: Inter` inside all 34 of its `txt-*`
 * classes and nothing in the app ever loaded the file, so every page outside
 * the homepage rendered in the system fallback while claiming not to. Archivo
 * is gone with the industrial headings it was bought for.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  // The whole range in one variable file, so a 600 heading next to a 400
  // paragraph costs nothing extra.
  axes: ["opsz"],
})

/** Data only: capacities, wattage, dB(A), prices, order numbers, SKUs. */
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Valy — homelab servers",
    template: "%s · Valy",
  },
  description:
    "Preconfigured homelab servers for India. Shop systems, drives, memory, and accessories.",
  openGraph: {
    title: "Valy — homelab servers",
    description:
      "Preconfigured homelab servers for India. Shop systems, drives, memory, and accessories.",
    url: "/",
    siteName: "Valy",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Valy — homelab servers",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Valy — homelab servers",
    description:
      "Preconfigured homelab servers for Indian homes and offices, and the drives, memory and cards that fit them.",
    images: ["/og.jpg"],
  },
}

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  // The configurator and the checkout have small controls. Pinch-zoom stays.
  maximumScale: 5,
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="light"
      className={`${inter.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen bg-paper text-ink">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
        >
          Skip to content
        </a>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
