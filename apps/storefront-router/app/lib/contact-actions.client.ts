import {
  CONTACT_MESSAGE_LIMIT,
  CONTACT_TOPIC_VALUES,
  type ContactField,
  type ContactFormState,
} from "@lib/data/contact"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function sendContactMessage(_previous: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const read = (key: string) => String(formData.get(key) ?? "").trim()
  const name = read("name")
  const email = read("email")
  const topic = read("topic")
  const orderNumber = read("order_number")
  const message = read("message")
  const company = read("company")
  const fieldErrors: Partial<Record<ContactField, string>> = {}

  if (!name) fieldErrors.name = "We would rather not open with “Dear customer”."
  else if (name.length > 120) fieldErrors.name = "That is longer than a name needs to be."
  if (!email) fieldErrors.email = "Without this there is nowhere to send the answer."
  else if (!emailPattern.test(email)) fieldErrors.email = "That address is missing something. Check it over."
  if (!CONTACT_TOPIC_VALUES.includes(topic)) fieldErrors.topic = "Pick whichever is closest."
  if (!message) fieldErrors.message = "This is the part we actually read."
  else if (message.length < 10) fieldErrors.message = "A sentence or two, so we know what to look at."
  else if (message.length > CONTACT_MESSAGE_LIMIT) fieldErrors.message = `That is past ${CONTACT_MESSAGE_LIMIT.toLocaleString()} characters. Send the short version and we will ask.`
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors }

  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, email, topic, order_number: orderNumber || null, message, company }),
  })
  if (!response.ok) {
    return {
      status: "error",
      fieldErrors: {},
      formError: response.status === 429
        ? "That is a lot of messages in a short time. Give it a few minutes, or write straight to support@valy.in."
        : "The message did not get through. Try again, or send it to support@valy.in and it reaches the same place.",
    }
  }
  const result = await response.json() as { message?: { id?: string | null } }
  return { status: "sent", reference: result.message?.id || "", email }
}
