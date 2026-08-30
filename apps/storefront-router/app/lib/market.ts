export const DEFAULT_COUNTRY = (import.meta.env.NEXT_PUBLIC_DEFAULT_REGION || import.meta.env.VITE_DEFAULT_REGION || "in").toLowerCase()

export function marketPath(countryCode: string | undefined, path: string) {
  const suffix = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`
  const country = countryCode?.toLowerCase() || DEFAULT_COUNTRY

  return country === DEFAULT_COUNTRY ? suffix || "/" : `/${country}${suffix}`
}

export function resolveCountry(countryCode?: string) {
  return countryCode?.toLowerCase() || DEFAULT_COUNTRY
}

export function countryFromPath(pathname: string) {
  const first = pathname.split("/").filter(Boolean)[0]?.toLowerCase()
  return first && /^[a-z]{2}$/.test(first) ? first : DEFAULT_COUNTRY
}

export const BASE_URL =
  (import.meta.env?.NEXT_PUBLIC_BASE_URL as string | undefined) ||
  (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_BASE_URL : undefined) ||
  "http://localhost:8100"

/** Absolute, because Open Graph consumers do not resolve relative URLs. */
export const absoluteUrl = (path: string) => new URL(path, BASE_URL).toString()
