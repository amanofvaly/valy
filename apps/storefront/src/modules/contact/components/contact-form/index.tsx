"use client"

import {
  CONTACT_INITIAL_STATE,
  CONTACT_MESSAGE_LIMIT,
  CONTACT_TOPICS,
  TOPICS_WITH_ORDER_NUMBER,
} from "@lib/data/contact"
import { sendContactMessage } from "@lib/data/contact-actions"
import { cn } from "@lib/util/cn"
import {
  Button,
  Input,
  Label,
  inputClasses,
} from "@modules/common/components/ui"
import { useActionState, useEffect, useRef, useState } from "react"

/**
 * The contact form.
 *
 * Two things here are doing real work rather than decorating.
 *
 * The topic is a set of radios rather than a select, because the choice is the
 * routing: it decides which queue the message lands in, and a select hides four
 * of the five options behind a press. Picking one of the two topics that
 * involve an order opens the order-number field — the page's one authored
 * movement, and the only reason the field is not always on screen asking three
 * out of five senders for a number they do not have.
 *
 * The other is what happens after sending. The form is replaced by the
 * confirmation rather than sprouting a green bar above it, because the errand
 * is over: what the sender needs now is the reference and the address the reply
 * is coming to, not the fields they just filled in.
 */

const MESSAGE_LIMIT = CONTACT_MESSAGE_LIMIT
const COUNTER_APPEARS_AT = MESSAGE_LIMIT - 600

const ContactForm = () => {
  const [state, formAction, isPending] = useActionState(
    sendContactMessage,
    CONTACT_INITIAL_STATE
  )

  const [topic, setTopic] = useState<string>("sales")
  const [messageLength, setMessageLength] = useState(0)

  const formRef = useRef<HTMLFormElement>(null)
  const confirmationRef = useRef<HTMLDivElement>(null)

  const wantsOrderNumber = TOPICS_WITH_ORDER_NUMBER.includes(topic)
  const fieldErrors = state.status === "error" ? state.fieldErrors : {}
  const formError = state.status === "error" ? state.formError : undefined

  // Move to the first thing that needs attention. A message that failed to send
  // is worth interrupting for; a field error is not, so it only takes focus.
  useEffect(() => {
    if (state.status !== "error") {
      return
    }

    const firstErroredField = Object.keys(state.fieldErrors)[0]
    const target = firstErroredField
      ? formRef.current?.querySelector<HTMLElement>(
          `[name="${firstErroredField}"]`
        )
      : null

    target?.focus()
  }, [state])

  useEffect(() => {
    if (state.status === "sent") {
      confirmationRef.current?.focus()
    }
  }, [state.status])

  if (state.status === "sent") {
    return (
      <div
        ref={confirmationRef}
        tabIndex={-1}
        /*
         * Focus moves here so a keyboard or screen-reader user lands in the
         * confirmation rather than at the top of a page whose form has
         * vanished. The global focus ring is a box-shadow, not an outline,
         * so it is the shadow that has to be suppressed: a red rectangle
         * around a whole panel reads as an error, which is the opposite of
         * what just happened.
         */
        className="animate-screen-in border-t-2 border-ink pt-8 focus:outline-none focus-visible:shadow-none focus-visible:outline-none"
      >
        <p className="flex items-center gap-2.5 text-sm font-medium text-signal">
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full bg-signal"
          />
          Sent
        </p>

        <h3 className="mt-4 max-w-[22ch] text-balance text-2xl font-semibold leading-[1.15] tracking-tight text-ink sm:text-3xl">
          We have received your message.
        </h3>

        <p className="mt-4 max-w-prose text-base leading-7 text-muted">
          A reply goes to{" "}
          <span className="font-medium text-ink">{state.email}</span> within one
          working day. If it has not arrived by then, check the spam folder
          before you write again — and if it is still not there, say so at{" "}
          <a
            href="mailto:support@valy.in"
            className="text-accent underline underline-offset-4 hover:text-accent-strong"
          >
            support@valy.in
          </a>
          .
        </p>

        {state.reference && (
          <dl className="mt-8 border-t border-line">
            <div className="flex flex-col gap-1 border-b border-line py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <dt className="shrink-0 text-xs text-muted">Reference</dt>
              <dd className="break-all font-mono text-xs tabular text-ink">
                {state.reference}
              </dd>
            </div>
          </dl>
        )}

        <p className="mt-4 text-sm leading-6 text-muted">
          Worth keeping if you write again about the same thing. It is how we
          find this message.
        </p>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="border-t-2 border-ink"
    >
      {/*
       * The honeypot. Off-screen rather than `display: none`, out of the tab
       * order, and hidden from assistive technology; a script that fills every
       * input it finds fills this one and the backend drops the submission.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <label htmlFor="contact-company">Company</label>
        <input
          id="contact-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <fieldset className="flex flex-col gap-5 py-8">
        <legend className="sr-only">Who you are</legend>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            name="name"
            label="Your name"
            autoComplete="name"
            maxLength={120}
            error={fieldErrors.name}
            defaultValue=""
          />
          <Input
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            inputMode="email"
            maxLength={200}
            error={fieldErrors.email}
            hint={fieldErrors.email ? undefined : "Where the reply goes."}
            defaultValue=""
          />
        </div>
      </fieldset>

      {/*
       * The rule sits on a wrapper rather than on the fieldset. A `legend`
       * inside a bordered fieldset is laid out *inside* that border and cuts a
       * notch in it, so the hairline above this group would arrive broken.
       */}
      <div className="border-t border-line">
        <fieldset className="py-8">
          <legend className="mb-1 text-sm font-medium text-ink">
            What is this about?
          </legend>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CONTACT_TOPICS.map((option) => {
              const active = topic === option.value

              return (
                <label
                  key={option.value}
                  data-active={active}
                  className={cn(
                    "pressable flex cursor-pointer items-start gap-3 rounded border px-4 py-3.5",
                    "has-[:focus-visible]:shadow-focus",
                    // Five options in two columns leave a hole. The catch-all,
                    // last and least specific, fills the row instead.
                    option.value === "other" && "sm:col-span-2",
                    active
                      ? "border-accent bg-accent-wash"
                      : "border-line bg-paper hover:border-line-strong active:bg-surface"
                  )}
                >
                  <input
                    type="radio"
                    name="topic"
                    value={option.value}
                    checked={active}
                    onChange={() => setTopic(option.value)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full bg-paper",
                      active
                        ? "border-[5px] border-accent"
                        : "border border-line-strong"
                    )}
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-ink">
                      {option.label}
                    </span>
                    <span className="text-xs leading-5 text-muted">
                      {option.hint}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>

          {fieldErrors.topic && (
            <p className="mt-2 text-xs text-danger">{fieldErrors.topic}</p>
          )}

          {/*
           * The reveal. `grid-template-rows` animates where `height: auto` cannot,
           * and the field stays mounted but disabled while it is closed, so it is
           * out of the tab order and out of the submitted form data.
           */}
          <div
            aria-hidden={!wantsOrderNumber}
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
              wantsOrderNumber
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="pt-5">
                <Input
                  name="order_number"
                  label="Order number"
                  disabled={!wantsOrderNumber}
                  maxLength={64}
                  autoComplete="off"
                  hint="On your invoice, and under Your orders. Skip it if you cannot find it."
                  className="font-mono sm:max-w-xs"
                />
              </div>
            </div>
          </div>
        </fieldset>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-line py-8">
        <div className="flex items-baseline justify-between gap-4">
          <Label htmlFor="contact-message">Your message</Label>
          {messageLength > COUNTER_APPEARS_AT && (
            <span
              className={cn(
                "font-mono text-2xs tabular",
                messageLength > MESSAGE_LIMIT ? "text-danger" : "text-muted"
              )}
            >
              {messageLength.toLocaleString()} /{" "}
              {MESSAGE_LIMIT.toLocaleString()}
            </span>
          )}
        </div>
        <textarea
          id="contact-message"
          name="message"
          rows={7}
          maxLength={MESSAGE_LIMIT}
          onChange={(event) => setMessageLength(event.target.value.length)}
          aria-invalid={fieldErrors.message ? true : undefined}
          aria-describedby="contact-message-help"
          placeholder="What you are running now, what you want it to do, and anything that has already gone wrong."
          className={cn(
            inputClasses,
            "h-auto resize-y py-2.5 leading-7",
            fieldErrors.message && "border-danger"
          )}
        />
        <p
          id="contact-message-help"
          className={cn(
            "text-xs",
            fieldErrors.message ? "text-danger" : "text-muted"
          )}
        >
          {fieldErrors.message ??
            "Detail helps. A model number beats a description of one."}
        </p>
      </div>

      <div className="flex flex-col gap-4 border-t border-line py-8">
        {formError && (
          <p
            role="alert"
            className="max-w-prose border-t-2 border-danger pt-4 text-base leading-7 text-ink"
          >
            {formError}
          </p>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Button
            type="submit"
            size="large"
            isLoading={isPending}
            className="sm:w-auto"
            block
          >
            Send message
          </Button>
          <p className="text-sm leading-6 text-muted sm:max-w-sm">
            Answered within one working day, by a person, from{" "}
            <span className="text-ink">support@valy.in</span>.
          </p>
        </div>
      </div>
    </form>
  )
}

export default ContactForm
