import "server-only"

import { sdk } from "@lib/config"
import { cache } from "react"

export type Locale = {
  code: string
  name: string
}

/**
 * Available locales. Returns null when the backend has no `/store/locales`
 * route, so the language select can hide itself rather than render empty.
 */
export const listLocales = cache(
  async (): Promise<Locale[] | null> =>
    sdk.client
      .fetch<{ locales: Locale[] }>(`/store/locales`, {
        method: "GET",
        cache: "no-store",
      })
      .then(({ locales }) => locales)
      .catch(() => null)
)
