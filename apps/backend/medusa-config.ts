import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    {
      resolve: "@medusajs/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-local",
            id: "local",
            options: {
              // Uploads land in `<cwd>/static`, which in production is a volume
              // mounted from the NAS. Without that mount the container's own
              // filesystem holds them and every deploy throws them away.
              //
              // backend_url is baked into the URL stored with each image, so a
              // wrong value here is a data problem rather than a config one:
              // the default is localhost:9000, which no customer's browser can
              // reach, and fixing it later means rewriting rows.
              backend_url: `${process.env.BACKEND_URL ?? "http://localhost:9000"}/static`,
            },
          },
        ],
      },
    },
    {
      resolve: "./src/modules/contact",
    },
    {
      resolve: "./src/modules/india-gst",
    },
    {
      resolve: "./src/modules/shipping-orchestrator",
    },
    {
      /*
       * Payments.
       *
       * `mode` is derived from NODE_ENV rather than set by hand: the two
       * environments take different keys, and the failure mode of getting it
       * wrong is a store that looks like it is taking money and is not. The
       * provider refuses to boot on a mismatched key pair, so a stray test key
       * in production is a crash at deploy rather than a silent hole in the
       * takings.
       */
      resolve: "@medusajs/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/cashfree",
            id: "cashfree",
            options: {
              appId: process.env.CASHFREE_APP_ID,
              secretKey: process.env.CASHFREE_SECRET_KEY,
              /*
               * `||` rather than `??` throughout: a container orchestrator
               * that declares a variable it has no value for sets it to the
               * empty string, not to undefined. Under `??` that empty string
               * wins, and the fallbacks below — including the API version the
               * client picks — get overridden with "".
               */
              mode:
                process.env.CASHFREE_MODE ||
                (process.env.NODE_ENV === "production"
                  ? "production"
                  : "sandbox"),
              apiVersion: process.env.CASHFREE_API_VERSION || undefined,
              // Where the bank's 3-D Secure page or the UPI app returns to.
              returnUrl: `${process.env.STOREFRONT_URL || "http://localhost:8000"}/order/confirmed/{order_id}`,
              notifyUrl: process.env.CASHFREE_NOTIFY_URL || undefined,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/tax",
      options: {
        providers: [
          {
            resolve: "./src/modules/india-gst/provider",
            id: "india-gst",
          },
        ],
      },
    },
    {
      resolve: "@medusajs/fulfillment",
      options: {
        providers: [
          {
            resolve: "./src/modules/shipping-orchestrator/provider",
            id: "shipping-orchestrator",
          },
        ],
      },
    },
  ]
})
