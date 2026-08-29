"use client"

import { Badge, Input } from "@modules/common/components/ui"
import React from "react"

import { applyPromotions } from "@lib/data/cart-actions"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Trash from "@modules/common/icons/trash"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  const { promotions = [] } = cart
  const removePromotionCode = async (code: string) => {
    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )

    await applyPromotions(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")

    const code = formData.get("code")
    if (!code) {
      return
    }
    const input = document.getElementById("promotion-input") as HTMLInputElement
    const codes = promotions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)
    codes.push(code.toString())

    try {
      await applyPromotions(codes)
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e))
    }

    if (input) {
      input.value = ""
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <form action={(a) => addPromotionCode(a)} className="flex flex-col gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          aria-expanded={isOpen}
          className="pressable self-start rounded text-sm text-accent hover:text-accent-strong"
          data-testid="add-discount-button"
        >
          {isOpen ? "Hide promotion code" : "Add a promotion code"}
        </button>

        {isOpen && (
          <>
            <div className="flex w-full items-end gap-2">
              <Input
                className="flex-1"
                id="promotion-input"
                name="code"
                type="text"
                label="Code"
                autoFocus={false}
                data-testid="discount-input"
              />
              {/*
               * Not blue. It sits on the same screen as "Go to checkout",
               * which is the action, and a second gradient beside it would put
               * a coupon field level with the purchase.
               */}
              <SubmitButton
                variant="secondary"
                data-testid="discount-apply-button"
              >
                Apply
              </SubmitButton>
            </div>

            <ErrorMessage
              error={errorMessage}
              data-testid="discount-error-message"
            />
          </>
        )}
      </form>

      {promotions.length > 0 && (
        <ul className="flex flex-col gap-2">
          {promotions.map((promotion) => (
            <li
              key={promotion.id}
              className="flex items-center justify-between gap-2"
              data-testid="discount-row"
            >
              <span
                className="flex min-w-0 items-baseline gap-1.5"
                data-testid="discount-code"
              >
                <Badge color={promotion.is_automatic ? "green" : "grey"}>
                  {promotion.code}
                </Badge>
                {promotion.application_method?.value !== undefined &&
                  promotion.application_method.currency_code !== undefined && (
                    <span className="font-mono text-2xs tabular text-muted">
                      {promotion.application_method.type === "percentage"
                        ? `${promotion.application_method.value}% off`
                        : `${convertToLocale({
                            amount: +promotion.application_method.value,
                            currency_code:
                              promotion.application_method.currency_code,
                          })} off`}
                    </span>
                  )}
              </span>

              {!promotion.is_automatic && (
                <button
                  type="button"
                  className="pressable rounded p-1 text-muted hover:text-danger"
                  onClick={() => {
                    if (!promotion.code) {
                      return
                    }
                    removePromotionCode(promotion.code)
                  }}
                  data-testid="remove-discount-button"
                >
                  <Trash size={14} />
                  <span className="sr-only">
                    Remove {promotion.code} from the order
                  </span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default DiscountCode
