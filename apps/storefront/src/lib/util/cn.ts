import clsx from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Class-name joiner, importable from server and client alike.
 *
 * It lives here rather than in the component file because a server component
 * cannot call a function out of a `"use client"` module — it can only render
 * one. Nearly eighty files call this.
 *
 * `clsx` alone left a caller's `className` and the component's own class both in
 * the output, where whichever came later in the stylesheet won rather than the
 * more specific one. `twMerge` makes the caller's the winner, which is what
 * every call site already assumed was happening.
 */
export const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs))

/** The name 78 files already import it under. */
export const clx = clsx

export default cn
