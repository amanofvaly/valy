/*
 * The bare `next` import, which the legacy page files use only for its
 * `Metadata` type. Typed loosely on purpose: nothing reads it at runtime, and
 * route metadata is declared in each route's `head()` instead.
 */
export type Metadata = Record<string, unknown>
export type Viewport = Record<string, unknown>
