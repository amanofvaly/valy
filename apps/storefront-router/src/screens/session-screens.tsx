import type { HttpTypes } from "@medusajs/types"
import { PageShell } from "../../app/components/page-shell"
import AccountView from "../../app/components/account-view"
import CheckoutView from "../../app/components/checkout-view"
import CartTemplate from "@modules/cart/templates"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"

export const CartScreen = ({ cart, customer }: { cart: HttpTypes.StoreCart | null; customer: HttpTypes.StoreCustomer | null }) => (
  <PageShell><CartTemplate cart={cart} customer={customer} /></PageShell>
)

export const AccountScreen = ({ customer, orders, regions, page = "overview", countryCode }: {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[]
  regions: HttpTypes.StoreRegion[]
  page?: "overview" | "profile" | "addresses" | "orders"
  countryCode: string
}) => (
  <PageShell>
    <AccountView customer={customer} orders={orders} regions={regions} page={page} countryCode={countryCode} />
  </PageShell>
)

export const CheckoutScreen = ({ data, activeStep }: { data: {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  shippingOptions: HttpTypes.StoreCartShippingOption[]
  paymentProviders: HttpTypes.StorePaymentProvider[]
}; activeStep?: string }) => <CheckoutView {...data} activeStep={activeStep} />

export const OrderScreen = ({ order }: { order: HttpTypes.StoreOrder }) => (
  <PageShell><OrderCompletedTemplate order={order} /></PageShell>
)
