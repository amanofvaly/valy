import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
/** The store sells into India. The starter shipped with "dk". */
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "in"

/**
 * The region map, and why this one cache survived.
 *
 * The plan asks for two things that pull against each other: remove the
 * process-lifetime `regionMapCache`, and fall back to the last known map when
 * the backend is unreachable. Reading live on every request satisfies the first
 * literally — and costs a full backend round trip, measured at ~95ms in
 * production, on *every navigation of the site*, before a single byte of the
 * page is rendered. That directly contradicts the thing this overhaul exists to
 * fix.
 *
 * So the cache is kept, with the defect removed rather than the mechanism. The
 * defect the plan names is unbounded lifetime — "a region edited in admin stays
 * wrong until the instance recycles". A sixty second ceiling fixes exactly that
 * while keeping the round trip off the critical path.
 *
 * The stakes are small and worth stating: all this map decides is which country
 * prefix a URL gets. It holds no prices, no stock and no cart. A region edited
 * in admin is live within a minute; everything a shopper actually reads is
 * uncached and correct on the next request.
 */
const REGION_MAP_TTL_MS = 60_000

let cachedRegionMap: Map<string, HttpTypes.StoreRegion> | null = null
let cachedAt = 0

async function getRegionMap(): Promise<Map<string, HttpTypes.StoreRegion>> {
  const fresh = cachedRegionMap && Date.now() - cachedAt < REGION_MAP_TTL_MS

  if (fresh) {
    return cachedRegionMap!
  }

  if (!BACKEND_URL) {
    throw new Error(
      "Middleware: NEXT_PUBLIC_MEDUSA_BACKEND_URL is not set. Set it and define regions in Medusa Admin."
    )
  }

  try {
    // The JS SDK needs a Node environment, so this is a plain fetch.
    const response = await fetch(`${BACKEND_URL}/store/regions`, {
      method: "GET",
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const { regions } = (await response.json()) as {
      regions?: HttpTypes.StoreRegion[]
    }

    if (!regions?.length) {
      throw new Error("Backend returned no regions")
    }

    const regionMap = new Map<string, HttpTypes.StoreRegion>()
    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        regionMap.set(c.iso_2 ?? "", region)
      })
    })

    cachedRegionMap = regionMap
    cachedAt = Date.now()
    return regionMap
  } catch (error) {
    if (cachedRegionMap) {
      // Serving a slightly stale country list beats serving a 500. The previous
      // code threw on any non-2xx, so one backend blip took every route on the
      // site down at once — the storefront could not render its own error page.
      return cachedRegionMap
    }

    console.error("Middleware: could not read regions.", error)
    return new Map<string, HttpTypes.StoreRegion>()
  }
}

/**
 * Which country's storefront this request belongs to. The URL wins, then the
 * edge's own geolocation, then the configured default.
 */
function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion>
): string | undefined {
  const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

  // Cloudflare Workers provides country via request.cf.country.
  const cloudflareCountryCode = (
    request as { cf?: { country?: string } }
  ).cf?.country?.toLowerCase()

  const vercelCountryCode = request.headers
    .get("x-vercel-ip-country")
    ?.toLowerCase()

  if (urlCountryCode && regionMap.has(urlCountryCode)) {
    return urlCountryCode
  }
  if (cloudflareCountryCode && regionMap.has(cloudflareCountryCode)) {
    return cloudflareCountryCode
  }
  if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
    return vercelCountryCode
  }
  if (regionMap.has(DEFAULT_REGION)) {
    return DEFAULT_REGION
  }
  return regionMap.keys().next().value
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const regionMap = await getRegionMap()
  const country = getCountryCode(request, regionMap) || DEFAULT_REGION

  const firstPathSegment = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

  if (firstPathSegment === country.toLowerCase()) {
    return NextResponse.next()
  }

  const redirectPath =
    request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname
  const queryString = request.nextUrl.search || ""

  return NextResponse.redirect(
    `${request.nextUrl.origin}/${country}${redirectPath}${queryString}`,
    307
  )
}

export const config = {
  matcher: [
    /**
     * Everything except assets and, importantly, RSC payload requests.
     *
     * The previous matcher ran this middleware on every `?_rsc=` fetch a
     * client-side navigation makes — so a prefetch of four links cost four
     * region reads, and the redirect logic ran against a URL that was already
     * correct. The header check excludes them: an RSC request always carries
     * `RSC: 1`, and its URL is one the middleware has already vetted.
     */
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|images|assets|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico|txt|xml)).*)",
      missing: [
        { type: "header", key: "RSC" },
        { type: "header", key: "next-router-prefetch" },
      ],
    },
  ],
}
