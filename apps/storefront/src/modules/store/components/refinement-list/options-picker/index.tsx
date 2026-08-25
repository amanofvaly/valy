"use client"

import { cn } from "@lib/util/cn"
import { ChevronDownMini } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import * as Accordion from "@radix-ui/react-accordion"
import { useState } from "react"
import { useBrowse } from "../../browse-frame"

/**
 * The catalogue facets.
 *
 * The options come from `/store/product-options?is_exclusive=false`, which is
 * the scoping that matters: shared options — RAM, Capacity, Drive type — are
 * facets that span the whole catalogue, while a machine's own Storage bundles
 * are exclusive to it and belong in its configurator, not in this rail.
 *
 * They now arrive as props from the server. The picker used to fetch them from
 * the browser on mount, so the filter rail appeared one round trip after the
 * page it sits beside.
 */

type OptionsPickerProps = {
  facets: HttpTypes.StoreProductOption[]
}

const OptionsPicker = ({ facets }: OptionsPickerProps) => {
  const { selectedValueIds, toggleOptionValue, clearFilters } = useBrowse()
  const [openItems, setOpenItems] = useState<string[]>(() =>
    facets.map((f) => f.id)
  )

  const usable = facets
    .map((option) => ({
      id: option.id,
      title: option.title || "Option",
      values: (option.values ?? [])
        .map((v) => ({ id: v.id, label: v.value }))
        .filter((v): v is { id: string; label: string } => !!v.id && !!v.label),
    }))
    .filter((option) => option.values.length > 0)

  if (!usable.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Hidden inside the filter sheet, whose own title already says it. */}
      <div
        data-facets-label
        className="flex items-center justify-between"
      >
        
        {selectedValueIds.length > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="pressable rounded text-xs text-accent hover:text-accent-strong"
          >
            Clear {selectedValueIds.length}
          </button>
        )}
      </div>

      <Accordion.Root
        type="multiple"
        value={openItems}
        onValueChange={(v) => setOpenItems(v as string[])}
        className="flex flex-col"
      >
        {usable.map((option) => {
          const selectedCount = option.values.filter((v) =>
            selectedValueIds.includes(v.id)
          ).length

          return (
            <Accordion.Item
              key={option.id}
              value={option.id}
              className="border-b border-line last:border-b-0"
            >
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-2 py-3 text-left focus-visible:outline-none">
                  <span className="flex items-baseline gap-1.5 text-sm text-ink">
                    {option.title}
                    {selectedCount > 0 && (
                      <span className="font-mono text-2xs text-accent">
                        {selectedCount}
                      </span>
                    )}
                  </span>
                  <ChevronDownMini className="shrink-0 text-muted transition-transform duration-150 group-radix-state-open:rotate-180" />
                </Accordion.Trigger>
              </Accordion.Header>

              <Accordion.Content className="overflow-hidden radix-state-closed:animate-accordion-close radix-state-open:animate-accordion-open">
                <div className="flex flex-wrap gap-1.5 pb-4">
                  {option.values.map((value) => {
                    const selected = selectedValueIds.includes(value.id)

                    return (
                      <button
                        key={value.id}
                        type="button"
                        onClick={() => toggleOptionValue(value.id)}
                        aria-pressed={selected}
                        className={cn(
                          "pressable rounded border px-2.5 py-1.5 font-mono text-2xs",
                          "focus-visible:outline-none",
                          selected
                            ? "border-accent bg-accent-wash text-accent"
                            : "border-line bg-paper text-muted hover:border-line-strong hover:text-ink active:bg-surface"
                        )}
                      >
                        {value.label}
                      </button>
                    )
                  })}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          )
        })}
      </Accordion.Root>
    </div>
  )
}

export default OptionsPicker
