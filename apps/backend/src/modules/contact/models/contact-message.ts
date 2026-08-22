import { model } from "@medusajs/framework/utils"

/**
 * One message sent from the storefront's contact page.
 *
 * The row is deliberately self-contained. A message arrives from someone who
 * may not have an account and may be asking about an order placed under a
 * different email, so nothing here links to a customer or an order record —
 * `order_number` is what the sender typed, not a foreign key, and it is stored
 * as typed so a mistyped one is still visible when you go looking for it.
 *
 * `status` is the only field the admin edits on the message itself. `note` is
 * internal and never leaves the dashboard.
 */
export const ContactMessage = model
  .define("contact_message", {
    id: model.id({ prefix: "cmsg" }).primaryKey(),

    name: model.text().searchable(),
    email: model.text().searchable(),

    /**
     * What the sender said the message was about. The five values are the five
     * options on the storefront form; they exist so the inbox can be worked
     * queue by queue rather than top to bottom.
     */
    topic: model
      .enum(["sales", "order", "warranty", "parts", "other"])
      .default("other"),

    /** Present only for the order and warranty topics, and only if given. */
    order_number: model.text().nullable(),

    message: model.text().searchable(),

    /**
     * new       nobody has looked at it
     * open      being dealt with
     * answered  a reply has gone out
     * archived  spam, a duplicate, or closed without a reply
     */
    status: model
      .enum(["new", "open", "answered", "archived"])
      .default("new"),

    /** Internal. Never shown to the sender. */
    note: model.text().nullable(),

    /**
     * Which surface the message came from. Only the storefront form writes
     * today; the column exists so a second channel is distinguishable from the
     * first without a migration.
     */
    source: model.text().default("storefront"),
  })
  .indexes([
    // The inbox is read as "everything new, newest first" far more often than
    // it is read any other way.
    { on: ["status", "created_at"] },
    { on: ["topic"] },
  ])
