import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Archivo, IBM_Plex_Mono } from "next/font/google"
import "styles/globals.css"

/**
 * Display face. Archivo is loaded as a variable font with its width axis so the
 * `[font-stretch:108%]` / `[font-stretch:112%]` headings on the homepage
 * actually widen instead of being silently ignored.
 */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-display",
})

/** Monospace face for eyebrows, spec labels, and readouts. */
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="light"
      className={`${archivo.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
