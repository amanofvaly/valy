/*
 * `next/headers`, deliberately inert.
 *
 * It exists so the legacy `@lib/data/*` catalogue modules import cleanly and
 * can run inside server functions — which is what keeps sorting, faceting and
 * filtering identical to the old store rather than reimplemented.
 *
 * It returns no cookies on purpose. The only caller is `getAuthHeaders`, and
 * the reads that go through here — products, facets, categories — are public
 * and need the publishable key, not a customer token. Anything that genuinely
 * needs the signed-in customer goes through an `/api/*` route handler instead,
 * which has the real request. Importing the request here would drag the
 * server runtime into the browser bundle.
 */
type CookieEntry = { name: string; value: string }

export async function cookies() {
  return {
    get: (_name: string): CookieEntry | undefined => undefined,
    getAll: (): CookieEntry[] => [],
    has: (_name: string) => false,
    set: () => {},
    delete: () => {},
  }
}

export async function headers() {
  return new Headers()
}
