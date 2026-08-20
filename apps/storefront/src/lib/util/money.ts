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

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "en-US",
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
