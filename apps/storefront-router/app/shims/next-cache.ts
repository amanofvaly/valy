/*
 * `next/cache`, as no-ops.
 *
 * These calls ended the legacy server actions to make Next re-render. There is
 * no equivalent data cache here — reads happen per request, and the client
 * actions call `refreshSession()` to re-read after a write.
 */
export const revalidatePath = (_path?: string, _type?: string) => {}
export const revalidateTag = (_tag?: string) => {}
export const unstable_cache = <T extends (...args: any[]) => any>(fn: T) => fn
