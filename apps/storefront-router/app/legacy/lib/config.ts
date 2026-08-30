import { getLocaleHeader } from "@lib/util/get-locale-header"
import Medusa, { FetchArgs, FetchInput } from "@medusajs/js-sdk"

/*
 * Vite exposes NEXT_PUBLIC_* on `import.meta.env`, not `process.env`. Reading
 * only `process.env` here left the SDK with no publishable key, so every call
 * through it came back 400 and was swallowed by the callers' `.catch`.
 */
const env = (name: string) =>
  (import.meta.env?.[name] as string | undefined) || process.env[name] || undefined

const MEDUSA_BACKEND_URL =
  env("NEXT_PUBLIC_MEDUSA_BACKEND_URL") || "http://localhost:9000"

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: import.meta.env?.DEV ?? process.env.NODE_ENV === "development",
  publishableKey: env("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY"),
})

const originalFetch = sdk.client.fetch.bind(sdk.client)

sdk.client.fetch = async <T>(
  input: FetchInput,
  init?: FetchArgs
): Promise<T> => {
  const headers = init?.headers ?? {}
  let localeHeader: Record<string, string | null> | undefined
  try {
    localeHeader = await getLocaleHeader()
    headers["x-medusa-locale"] ??= localeHeader["x-medusa-locale"]
  } catch {}

  const newHeaders = {
    ...localeHeader,
    ...headers,
  }
  init = {
    ...init,
    headers: newHeaders,
  }
  return originalFetch(input, init)
}
