import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
  /** Rendered when `amount` is not a finite number. */
  fallback?: string
}

/**
 * Money, formatted the way the people paying it write it.
 *
 * The default locale is `en-IN` because the store sells in one country and one
 * currency, and Indian digit grouping is not a variant of the Western one — it
 * groups the last three digits and then in pairs, so 161999 is written
 * 1,61,999. `en-US` rendered it 161,999, which is not how any Indian price tag,
 * invoice or bank statement writes it.
 *
 * Fractions run 0 to 2 rather than Intl's fixed 2 for currency. Catalogue
 * prices are whole rupees, so a forced `.00` on every figure on every page is
 * noise; a GST split that genuinely lands on paise still shows them.
 */
export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits = 0,
  maximumFractionDigits = 2,
  locale = "en-IN",
  fallback = "—",
}: ConvertToLocaleParams) => {
  // Intl formats `undefined`/`NaN` as the literal string "NaN", which is how a
  // missing price ends up rendered as a price. A dash is the honest answer.
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return fallback
  }

  return currency_code && !isEmpty(currency_code)
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency_code,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(amount)
    : amount.toString()
}
