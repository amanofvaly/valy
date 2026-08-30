import { lazy, Suspense } from "react"

export default function dynamic(
  loader: () => Promise<{ default: React.ComponentType<any> }> | Promise<React.ComponentType<any>>,
  options?: { loading?: React.ComponentType; ssr?: boolean }
) {
  const Lazy = lazy(async () => {
    const loaded = await loader()
    return typeof loaded === "function" ? { default: loaded } : loaded
  })

  return function DynamicComponent(props: Record<string, unknown>) {
    const Loading = options?.loading
    return <Suspense fallback={Loading ? <Loading /> : null}><Lazy {...props} /></Suspense>
  }
}
