"use client"

import { updateLocale } from "@lib/data/locale-actions"
import { Locale } from "@lib/data/locales"
import NativeSelect from "@modules/common/components/native-select"
import { useRouter } from "next/navigation"
import { useMemo, useTransition } from "react"

/**
 * Language preference. Sets the `x-medusa-locale` header the backend translates
 * against, and writes the choice onto the cart so an order carries the language
 * its confirmation email should be sent in.
 */

const DEFAULT_VALUE = ""

/** "de" renders as "German", using the browser's own language table. */
const displayName = (code: string, fallback: string, inLocale: string) => {
  try {
    return new Intl.DisplayNames([inLocale], { type: "language" }).of(code) ?? fallback
  } catch {
    return fallback
  }
}

type LanguageSelectProps = {
  locales: Locale[]
  currentLocale: string | null
}

const LanguageSelect = ({ locales, currentLocale }: LanguageSelectProps) => {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const options = useMemo(
    () =>
      locales.map((locale) => ({
        code: locale.code,
        label: displayName(locale.code, locale.name, currentLocale ?? "en-US"),
      })),
    [locales, currentLocale]
  )

  if (!options.length) {
    return null
  }

  return (
    <NativeSelect
      label="Language"
      value={currentLocale ?? DEFAULT_VALUE}
      disabled={isPending}
      data-testid="language-select"
      onChange={(e) => {
        const next = e.target.value
        startTransition(async () => {
          await updateLocale(next)
          router.refresh()
        })
      }}
    >
      <option value={DEFAULT_VALUE}>Site default</option>
      {options.map((o) => (
        <option key={o.code} value={o.code}>
          {o.label}
        </option>
      ))}
    </NativeSelect>
  )
}

export default LanguageSelect
