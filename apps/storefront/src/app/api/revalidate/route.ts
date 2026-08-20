import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

// ------------------------------------------------------------------
// POST /api/revalidate?tag=products&secret=...
//
// Called by the Medusa backend when catalogue data changes, so a published
// product or an edited price appears here without rebuilding the site.
//
// Only the tags below are accepted. Without that list this would be a public
// button for flushing any cache entry by name, and cart and customer tags are
// per-visitor — clearing them from outside would be meaningless at best.
// ------------------------------------------------------------------

const REVALIDATABLE_TAGS = [
  "products",
  "variants",
  "collections",
  "categories",
  "regions",
  "locales",
] as const

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET

  // Refuse rather than run unauthenticated: an unset secret is a
  // misconfiguration, not permission to accept anything.
  if (!secret) {
    return NextResponse.json(
      { revalidated: false, error: "REVALIDATE_SECRET is not configured" },
      { status: 500 }
    )
  }

  if (request.nextUrl.searchParams.get("secret") !== secret) {
    return NextResponse.json(
      { revalidated: false, error: "Invalid secret" },
      { status: 401 }
    )
  }

  const tag = request.nextUrl.searchParams.get("tag")

  if (!tag || !(REVALIDATABLE_TAGS as readonly string[]).includes(tag)) {
    return NextResponse.json(
      {
        revalidated: false,
        error: `Unknown tag: ${tag ?? "(none)"}`,
        allowed: REVALIDATABLE_TAGS,
      },
      { status: 400 }
    )
  }

  revalidateTag(tag)

  return NextResponse.json({ revalidated: true, tag })
}
