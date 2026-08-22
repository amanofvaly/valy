"use server"

import { sdk } from "@lib/config"
import { FetchError } from "@medusajs/js-sdk"
import {
  CONTACT_MESSAGE_LIMIT,
  CONTACT_TOPIC_VALUES,
  type ContactField,
  type ContactFormState,
} from "./contact"

/**
 * The contact form's one mutation.
 *
 * Validation happens twice on purpose. Here, so the visitor gets the error
 * against the field that caused it without decoding the backend's schema
 * errors; and again in `/store/contact`, which is the real gate — this action
 * is a client of the API, not a substitute for its validation.
 *
 * Nothing here is cached or revalidated. A contact message changes no page.
 */

/*
 * Deliberately permissive. The only thing this needs to catch is a typo the
 * sender can still fix — "something@somewhere.tld" — because the real proof
 * that an address works is that the reply arrives.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function sendContactMessage(
  _previous: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const read = (key: string) => String(formData.get(key) ?? "").trim()

  const name = read("name")
  const email = read("email")
  const topic = read("topic")
  const orderNumber = read("order_number")
  const message = read("message")
  const company = read("company")

  const fieldErrors: Partial<Record<ContactField, string>> = {}

  if (!name) {
    fieldErrors.name = "We would rather not open with “Dear customer”."
  } else if (name.length > 120) {
    fieldErrors.name = "That is longer than a name needs to be."
  }

  if (!email) {
    fieldErrors.email = "Without this there is nowhere to send the answer."
  } else if (!EMAIL.test(email)) {
    fieldErrors.email = "That address is missing something. Check it over."
  }

  if (!CONTACT_TOPIC_VALUES.includes(topic)) {
    fieldErrors.topic = "Pick whichever is closest."
  }

  if (!message) {
    fieldErrors.message = "This is the part we actually read."
  } else if (message.length < 10) {
    fieldErrors.message = "A sentence or two, so we know what to look at."
  } else if (message.length > CONTACT_MESSAGE_LIMIT) {
    fieldErrors.message = `That is past ${CONTACT_MESSAGE_LIMIT.toLocaleString()} characters. Send the short version and we will ask.`
  }

  if (Object.keys(fieldErrors).length) {
    return { status: "error", fieldErrors }
  }

  try {
    const response = await sdk.client.fetch<{
      message: { id: string | null }
    }>("/store/contact", {
      method: "POST",
      body: {
        name,
        email,
        topic,
        order_number: orderNumber || null,
        message,
        company,
      },
    })

    return {
      status: "sent",
      reference: response.message.id ?? "",
      email,
    }
  } catch (error) {
    const status = (error as FetchError)?.status

    if (status === 429) {
      return {
        status: "error",
        fieldErrors: {},
        formError:
          "That is a lot of messages in a short time. Give it a few minutes, or write straight to support@valy.in.",
      }
    }

    return {
      status: "error",
      fieldErrors: {},
      formError:
        "The message did not get through. Try again, or send it to support@valy.in and it reaches the same place.",
    }
  }
}
