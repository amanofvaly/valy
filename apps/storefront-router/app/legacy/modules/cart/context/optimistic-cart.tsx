"use client"

import {
  createContext,
  useCallback,
  useContext,
  useOptimistic,
  useTransition,
} from "react"

/**
 * The cart badge, moved before the server replies.
 *
 * The rule the plan sets is that adding to cart increments the badge and flips
 * the button to "Added" before the round trip finishes. The badge lives in the
 * header and the button lives on the product page, so something has to carry
 * the intent between them.
 *
 * The base value here is deliberately `0`, not the real cart count. React
 * reverts an optimistic value when the transition that set it settles — and the
 * transition includes the `revalidatePath` the server action performs, so by
 * the time the delta drops back to zero the server-rendered count already
 * includes the item. The number never dips, and no reconciliation code is
 * needed to make that true.
 */

type OptimisticCartState = {
  /** How many items are in flight, to be added to the server's own count. */
  delta: number
  /** Run a cart mutation, showing `count` extra items until it settles. */
  addOptimistic: (count: number, action: () => Promise<void>) => void
  isPending: boolean
}

const OptimisticCartContext = createContext<OptimisticCartState>({
  delta: 0,
  addOptimistic: (_count, action) => {
    void action()
  },
  isPending: false,
})

export const useOptimisticCart = () => useContext(OptimisticCartContext)

export const OptimisticCartProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [delta, setDelta] = useOptimistic(0, (_current, next: number) => next)
  const [isPending, startTransition] = useTransition()

  const addOptimistic = useCallback(
    (count: number, action: () => Promise<void>) => {
      startTransition(async () => {
        setDelta(count)
        await action()
      })
    },
    [setDelta]
  )

  return (
    <OptimisticCartContext.Provider value={{ delta, addOptimistic, isPending }}>
      {children}
    </OptimisticCartContext.Provider>
  )
}
