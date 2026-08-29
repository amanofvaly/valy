import { siVisa } from "simple-icons"
import Image from "next/image"

type SimpleIcon = {
  title: string
  path: string
  slug: string
}

const BrandIcon = ({
  icon,
  className,
  viewBox = "0 0 24 24",
}: {
  icon: SimpleIcon
  className?: string
  viewBox?: string
}) => (
  <svg
    viewBox={viewBox}
    aria-label={icon.title}
    className={`h-5 w-auto max-w-12 fill-current ${className ?? ""}`}
  >
    <path d={icon.path} />
  </svg>
)

export const CardBrandMarks = ({
  large = false,
}: {
  large?: boolean
}) => (
  <span
    className={`flex flex-wrap items-center justify-center ${
      large
        ? "gap-7 [&>svg]:!h-6 [&>svg]:!max-w-none [&>span]:!text-lg"
        : "gap-3"
    }`}
    aria-label="Visa, Mastercard and RuPay accepted"
  >
    <BrandIcon
      icon={siVisa}
      className="text-[#1434CB]"
      viewBox="0 8.124 24 7.751"
    />
    <Image
      src="/images/mastercard.svg"
      width={1000}
      height={618}
      alt="Mastercard"
      className={large ? "h-6 w-auto" : "h-5 w-auto"}
    />
    <Image
      src="/images/rupay.svg"
      width={72}
      height={19}
      alt="RuPay"
      className={large ? "h-6 w-auto" : "h-5 w-auto"}
    />
  </span>
)

export const UpiBrandMarks = () => (
  <span
    className="flex flex-wrap items-center gap-3"
    aria-label="Google Pay, PhonePe, BHIM, Paytm and other UPI apps accepted"
  >
    <Image
      src="/images/google-pay.svg"
      width={90}
      height={24}
      alt="Google Pay"
      className="h-4 w-auto"
    />
    <Image
      src="/images/phonepe.svg"
      width={120}
      height={24}
      alt="PhonePe"
      className="h-5 w-auto"
    />
    <Image
      src="/images/bhim.svg"
      width={129}
      height={24}
      alt="BHIM"
      className="h-3 w-auto"
    />
    <Image
      src="/images/paytm.svg"
      width={100}
      height={24}
      alt="Paytm"
      className="h-3 w-auto"
    />
    <Image
      src="/images/upi.svg"
      width={91}
      height={24}
      alt="UPI"
      className="h-4 w-auto"
    />
  </span>
)
