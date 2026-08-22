import { ArrowLeft, Envelope, Trash } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Prompt,
  Select,
  StatusBadge,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

/**
 * One message.
 *
 * Opening a message that nobody has read yet moves it from `new` to `open`,
 * the way every inbox works — otherwise the count on the list page never falls
 * and stops meaning anything. Every other status change is explicit.
 *
 * Replies go out of your own mail client rather than through Medusa: this
 * backend has no notification provider configured, and a mailto with the
 * original quoted underneath is honest about that.
 */

const STATUSES = [
  { value: "new", label: "New" },
  { value: "open", label: "Open" },
  { value: "answered", label: "Answered" },
  { value: "archived", label: "Archived" },
]

const STATUS_COLORS: Record<
  string,
  "green" | "red" | "blue" | "orange" | "grey" | "purple"
> = {
  new: "orange",
  open: "blue",
  answered: "green",
  archived: "grey",
}

const TOPIC_LABELS: Record<string, string> = {
  sales: "Before buying",
  order: "An order",
  warranty: "Warranty or fault",
  parts: "Parts and compatibility",
  other: "Something else",
}

type ContactMessage = {
  id: string
  name: string
  email: string
  topic: string
  order_number: string | null
  message: string
  status: string
  note: string | null
  source: string
  created_at: string
  updated_at: string
}

const ContactMessagePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [message, setMessage] = useState<ContactMessage | null>(null)
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(true)
  const [savingNote, setSavingNote] = useState(false)
  const [notFound, setNotFound] = useState(false)

  // The auto-promotion must fire once per message, not once per render.
  const promoted = useRef(false)

  const patch = useCallback(
    async (body: { status?: string; note?: string | null }) => {
      const res = await fetch(`/admin/contact/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error(`Request failed with ${res.status}`)
      }

      const data = await res.json()
      setMessage(data.message)
      return data.message as ContactMessage
    },
    [id]
  )

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/admin/contact/${id}`, {
          credentials: "include",
        })
        if (res.status === 404) {
          if (!cancelled) {
            setNotFound(true)
          }
          return
        }
        const data = await res.json()
        if (cancelled) {
          return
        }

        setMessage(data.message)
        setNote(data.message?.note ?? "")

        if (data.message?.status === "new" && !promoted.current) {
          promoted.current = true
          await patch({ status: "open" })
        }
      } catch {
        if (!cancelled) {
          setNotFound(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [id, patch])

  const changeStatus = async (status: string) => {
    try {
      await patch({ status })
      toast.success(`Marked ${STATUSES.find((s) => s.value === status)?.label.toLowerCase()}`)
    } catch {
      toast.error("Could not change the status")
    }
  }

  const saveNote = async () => {
    setSavingNote(true)
    try {
      await patch({ note: note.trim() || null })
      toast.success("Note saved")
    } catch {
      toast.error("Could not save the note")
    } finally {
      setSavingNote(false)
    }
  }

  const remove = async () => {
    try {
      const res = await fetch(`/admin/contact/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) {
        throw new Error()
      }
      toast.success("Message deleted")
      navigate("/contact")
    } catch {
      toast.error("Could not delete the message")
    }
  }

  if (loading) {
    return (
      <Container className="p-6">
        <Text size="small" className="text-ui-fg-subtle">
          Loading…
        </Text>
      </Container>
    )
  }

  if (notFound || !message) {
    return (
      <Container className="flex flex-col items-start gap-y-3 p-6">
        <Heading level="h2">Message not found</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          It may have been deleted.
        </Text>
        <Button size="small" variant="secondary" onClick={() => navigate("/contact")}>
          Back to Contact
        </Button>
      </Container>
    )
  }

  const received = new Date(message.created_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })

  const replySubject = `Re: your message to Valy${
    message.order_number ? ` (order ${message.order_number})` : ""
  }`
  const replyBody = `Hi ${message.name.split(" ")[0]},\n\n\n\n---\nYou wrote on ${received}:\n\n${message.message
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n")}\n`
  const mailto = `mailto:${message.email}?subject=${encodeURIComponent(
    replySubject
  )}&body=${encodeURIComponent(replyBody)}`

  return (
    <div className="flex flex-col gap-y-3">
      <div>
        <Button
          size="small"
          variant="transparent"
          onClick={() => navigate("/contact")}
        >
          <ArrowLeft /> Contact
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <Container className="flex-1 divide-y p-0">
          <div className="flex flex-col gap-y-3 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Heading level="h2">{message.name}</Heading>
              <StatusBadge color={STATUS_COLORS[message.status] ?? "grey"}>
                {message.status}
              </StatusBadge>
            </div>
            <div className="text-ui-fg-subtle flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <a
                href={`mailto:${message.email}`}
                className="text-ui-fg-interactive hover:underline"
              >
                {message.email}
              </a>
              <span aria-hidden>·</span>
              <span>{TOPIC_LABELS[message.topic] ?? message.topic}</span>
              {message.order_number && (
                <>
                  <span aria-hidden>·</span>
                  <span className="font-mono">Order {message.order_number}</span>
                </>
              )}
              <span aria-hidden>·</span>
              <span>{received}</span>
            </div>
          </div>

          <div className="px-6 py-5">
            <Text className="whitespace-pre-wrap leading-7">
              {message.message}
            </Text>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-6 py-4">
            <Button size="small" variant="primary" asChild>
              <a href={mailto}>
                <Envelope /> Reply by email
              </a>
            </Button>
            {message.status !== "answered" && (
              <Button
                size="small"
                variant="secondary"
                onClick={() => changeStatus("answered")}
              >
                Mark answered
              </Button>
            )}
            {message.status !== "archived" && (
              <Button
                size="small"
                variant="secondary"
                onClick={() => changeStatus("archived")}
              >
                Archive
              </Button>
            )}
          </div>
        </Container>

        <Container className="w-full divide-y p-0 lg:w-[360px] lg:shrink-0">
          <div className="flex flex-col gap-y-2 px-6 py-4">
            <Text size="small" weight="plus">
              Status
            </Text>
            <Select value={message.status} onValueChange={changeStatus}>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {STATUSES.map((option) => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>

          <div className="flex flex-col gap-y-2 px-6 py-4">
            <Text size="small" weight="plus">
              Internal note
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              Only visible here. The sender never sees it.
            </Text>
            <Textarea
              rows={5}
              value={note}
              placeholder="What was done, what is outstanding"
              onChange={(event) => setNote(event.target.value)}
            />
            <div>
              <Button
                size="small"
                variant="secondary"
                isLoading={savingNote}
                disabled={note === (message.note ?? "")}
                onClick={saveNote}
              >
                Save note
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-y-2 px-6 py-4">
            <Text size="small" weight="plus">
              Reference
            </Text>
            <Text size="small" className="text-ui-fg-subtle break-all font-mono">
              {message.id}
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              The sender was shown this after sending.
            </Text>
          </div>

          <div className="px-6 py-4">
            <Prompt>
              <Prompt.Trigger asChild>
                <Button size="small" variant="danger">
                  <Trash /> Delete
                </Button>
              </Prompt.Trigger>
              <Prompt.Content>
                <Prompt.Header>
                  <Prompt.Title>Delete this message?</Prompt.Title>
                  <Prompt.Description>
                    It is removed permanently. Archive it instead if you only
                    want it out of the way.
                  </Prompt.Description>
                </Prompt.Header>
                <Prompt.Footer>
                  <Prompt.Cancel>Cancel</Prompt.Cancel>
                  <Prompt.Action onClick={remove}>Delete</Prompt.Action>
                </Prompt.Footer>
              </Prompt.Content>
            </Prompt>
          </div>
        </Container>
      </div>
    </div>
  )
}

export default ContactMessagePage
