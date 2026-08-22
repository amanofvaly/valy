/**
 * The contact form's shape, shared by the page, the client form and the server
 * action.
 *
 * It lives outside `contact-actions.ts` because that file is a `"use server"`
 * module, and such a module may export nothing but async functions — a
 * constant exported from it is a build error, not a lint warning.
 */

export const CONTACT_TOPICS = [
  {
    value: "sales",
    label: "Before you buy",
    hint: "Which machine, how much storage, whether it will do the thing you want.",
  },
  {
    value: "order",
    label: "An order",
    hint: "Something you have already placed, or one you are about to.",
    wantsOrderNumber: true,
  },
  {
    value: "warranty",
    label: "Warranty or a fault",
    hint: "Something is broken, noisy, or not behaving the way it did.",
    wantsOrderNumber: true,
  },
  {
    value: "parts",
    label: "Parts and compatibility",
    hint: "Whether a drive, a card or a stick of memory fits what you have.",
  },
  {
    value: "other",
    label: "Something else",
    hint: "Press, bulk orders, or a question none of the above covers.",
  },
] as const

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["value"]

export const CONTACT_TOPIC_VALUES: string[] = CONTACT_TOPICS.map(
  (topic) => topic.value
)

export const TOPICS_WITH_ORDER_NUMBER: string[] = CONTACT_TOPICS.filter(
  (topic) => "wantsOrderNumber" in topic && topic.wantsOrderNumber
).map((topic) => topic.value)

export const CONTACT_MESSAGE_LIMIT = 4000

export type ContactField = "name" | "email" | "topic" | "message"

export type ContactFormState =
  | { status: "idle" }
  | {
      status: "error"
      /** Shown above the button when the failure is not about one field. */
      formError?: string
      fieldErrors: Partial<Record<ContactField, string>>
    }
  | { status: "sent"; reference: string; email: string }

export const CONTACT_INITIAL_STATE: ContactFormState = { status: "idle" }
