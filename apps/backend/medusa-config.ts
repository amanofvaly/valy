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
      resolve: "./src/modules/india-gst",
    },
    {
      resolve: "./src/modules/shipping-orchestrator",
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
