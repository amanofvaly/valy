const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/**
 * The backend's own host, for deployments that serve product images from
 * Medusa's local file provider (`/static/...`) rather than S3. The optimizer
 * rejects any host missing from `remotePatterns` with a 400, which reads on
 * the page as every product image being broken, so this is derived from the
 * URL we already point the storefront at instead of being hardcoded per env.
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const backendPattern = (() => {
  if (!BACKEND_URL) {
    return []
  }

  try {
    const { protocol, hostname, port } = new URL(BACKEND_URL)
    return [
      {
        protocol: protocol.replace(":", ""),
        hostname,
        ...(port ? { port } : {}),
      },
    ]
  } catch {
    console.warn(
      `Ignoring unparseable NEXT_PUBLIC_MEDUSA_BACKEND_URL for image optimization: ${BACKEND_URL}`
    )
    return []
  }
})()

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    /**
     * Client-side router cache lifetime, in seconds.
     *
     * Next 15 defaults `dynamic` to 0, so a dynamic page is never reused on
     * back-navigation — pressing back refetches from the server, shows the
     * loading state again, and loses your place in a product list. Thirty
     * seconds means going back replays the page you were just on.
     *
     * The freshness cost is bounded by that number and applies only to a page
     * the visitor already had open, so the worst case is seeing what they saw
     * moments ago. This is the one place caching is deliberate.
     */
    staleTimes: {
      dynamic: 30,
      static: 180,
    },

    /**
     * Cross-document view transitions, so a navigation reads as motion rather
     * than a cut. Strictly an enhancement: `globals.css` defines the animation
     * only inside a `prefers-reduced-motion: no-preference` query, and a
     * browser without the API simply navigates.
     */
    viewTransition: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  /**
   * Both suppressions are gone. A refactor of this size without type checking
   * buries its own mistakes, and a lint rule that never fails the build is a
   * rule nobody is following.
   */
  eslint: {
    dirs: ["src"],
  },
  images: {
    // Photography is the largest thing on most of these pages. Unoptimized
    // means every visitor downloads the full-resolution file at whatever size
    // the layout happens to render it.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        // The production file store, named explicitly rather than left to
        // `backendPattern`. Product images uploaded through admin carry an
        // absolute api.valy.in URL baked in at upload time, so a developer
        // pointed at localhost:9000 still has to be able to render them —
        // otherwise every seeded photograph 400s in local development only.
        protocol: "https",
        hostname: "api.valy.in",
        pathname: "/static/**",
      },
      ...backendPattern,
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig
