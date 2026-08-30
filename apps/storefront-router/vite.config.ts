import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { nitro } from "nitro/vite"
import path from "node:path"

const shim = (name: string) => path.resolve(import.meta.dirname, `app/shims/${name}.tsx`)

export default defineConfig({
  /*
   * Vercel's optimizer only exists on Vercel. A local production build keeps
   * serving the original files rather than pointing at an endpoint that is
   * not there.
   */
  define: {
    __IMAGE_OPTIMIZER__: JSON.stringify(Boolean(process.env.VERCEL)),
  },
  plugins: [
    tanstackStart(),
    nitro({ preset: "vercel" }),
    viteReact(),
    tsconfigPaths(),
  ],
  envDir: "../storefront",
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  ssr: {
    noExternal: ["lodash", /^@radix-ui\//, /^@headlessui\//],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "server-only": path.resolve(import.meta.dirname, "app/shims/server-only.ts"),
      "@modules/common/components/localized-client-link": path.resolve(
        import.meta.dirname,
        "app/components/localized-link.tsx"
      ),
      "@lib/data/cart-actions": path.resolve(
        import.meta.dirname,
        "app/lib/cart-actions.client.ts"
      ),
      "@lib/data/contact-actions": path.resolve(
        import.meta.dirname,
        "app/lib/contact-actions.client.ts"
      ),
      "@lib/data/fulfillment": path.resolve(
        import.meta.dirname,
        "app/lib/fulfillment.client.ts"
      ),
      "@lib/data/order-actions": path.resolve(
        import.meta.dirname,
        "app/lib/order-actions.client.ts"
      ),
      "@lib/data/customer-actions": path.resolve(
        import.meta.dirname,
        "app/lib/customer-actions.client.ts"
      ),
      "next/headers": path.resolve(import.meta.dirname, "app/shims/next-headers.ts"),
      "next/link": shim("next-link"),
      "next/navigation": shim("next-navigation"),
      "next/image": shim("next-image"),
      "next/dynamic": shim("next-dynamic"),
    },
  },
})
