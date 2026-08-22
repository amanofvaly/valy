import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Select,
  StatusBadge,
  Table,
  Tabs,
  Text,
} from "@medusajs/ui"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

/**
 * The contact inbox.
 *
 * The page answers one question first — is anything waiting — so the status
 * tabs carry their counts and "New" is where the page opens. Everything else
 * (topic, search, paging) narrows from there.
 */

const PAGE_SIZE = 20

const STATUS_TABS = [
  { value: "new", label: "New" },
  { value: "open", label: "Open" },
  { value: "answered", label: "Answered" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
] as const

const TOPIC_LABELS: Record<string, string> = {
  sales: "Before buying",
  order: "An order",
  warranty: "Warranty or fault",
  parts: "Parts and compatibility",
  other: "Something else",
}

export const STATUS_COLORS: Record<
  string,
  "green" | "red" | "blue" | "orange" | "grey" | "purple"
> = {
  new: "orange",
  open: "blue",
  answered: "green",
  archived: "grey",
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
  created_at: string
}

const formatReceived = (value: string) => {
  const date = new Date(value)
  const now = Date.now()
  const minutes = Math.round((now - date.getTime()) / 60000)

  if (minutes < 1) {
    return "Just now"
  }
  if (minutes < 60) {
    return `${minutes} min ago`
  }
  if (minutes < 60 * 24) {
    return `${Math.round(minutes / 60)} h ago`
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  })
}

const ContactPage = () => {
  const navigate = useNavigate()

  const [status, setStatus] = useState<string>("new")
  const [topic, setTopic] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(0)

  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [count, setCount] = useState(0)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Typing in the search box should not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim())
      setPage(0)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      status,
      topic,
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    })
    if (query) {
      params.set("q", query)
    }

    try {
      const res = await fetch(`/admin/contact?${params.toString()}`, {
        credentials: "include",
      })
      if (!res.ok) {
        throw new Error(`Request failed with ${res.status}`)
      }
      const data = await res.json()
      setMessages(data.messages ?? [])
      setCount(data.count ?? 0)
      setCounts(data.counts ?? {})
    } catch {
      setError("Could not load messages. Check that the backend is running.")
      setMessages([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [status, topic, query, page])

  useEffect(() => {
    load()
  }, [load])

  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const unread = counts.new ?? 0

  const topicOptions = useMemo(
    () => [
      { value: "all", label: "Every topic" },
      ...Object.entries(TOPIC_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    ],
    []
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-y-1 px-6 py-4">
        <div className="flex items-center gap-x-3">
          <Heading level="h2">Contact</Heading>
          {unread > 0 && (
            <Badge size="2xsmall" color="orange">
              {unread} new
            </Badge>
          )}
        </div>
        <Text size="small" className="text-ui-fg-subtle">
          Messages sent from the contact page on the storefront.
        </Text>
      </div>

      <Tabs
        value={status}
        onValueChange={(value) => {
          setStatus(value)
          setPage(0)
        }}
      >
        <div className="flex flex-col gap-3 px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs.List>
            {STATUS_TABS.map((tab) => (
              <Tabs.Trigger key={tab.value} value={tab.value}>
                {tab.label}
                {tab.value !== "all" && counts[tab.value] ? (
                  <span className="text-ui-fg-muted ml-1.5 tabular-nums">
                    {counts[tab.value]}
                  </span>
                ) : null}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <div className="flex items-center gap-x-2">
            <Select
              value={topic}
              onValueChange={(value) => {
                setTopic(value)
                setPage(0)
              }}
            >
              <Select.Trigger className="w-[220px]">
                <Select.Value placeholder="Every topic" />
              </Select.Trigger>
              <Select.Content>
                {topicOptions.map((option) => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>

            <Input
              type="search"
              placeholder="Name, email or text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-[240px]"
            />
          </div>
        </div>
      </Tabs>

      {error && (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-error">
            {error}
          </Text>
        </div>
      )}

      {!error && loading && (
        <div className="px-6 py-10">
          <Text size="small" className="text-ui-fg-subtle">
            Loading messages…
          </Text>
        </div>
      )}

      {!error && !loading && messages.length === 0 && (
        <div className="flex flex-col items-start gap-y-1 px-6 py-12">
          <Text size="small" weight="plus">
            Nothing here
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            {query || topic !== "all"
              ? "No message matches this filter."
              : status === "new"
                ? "No unread messages. Everything that arrived has been picked up."
                : "No messages with this status."}
          </Text>
        </div>
      )}

      {!error && !loading && messages.length > 0 && (
        <>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell className="w-[120px]">
                  Received
                </Table.HeaderCell>
                <Table.HeaderCell className="w-[220px]">From</Table.HeaderCell>
                <Table.HeaderCell className="w-[180px]">Topic</Table.HeaderCell>
                <Table.HeaderCell>Message</Table.HeaderCell>
                <Table.HeaderCell className="w-[130px]">Status</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {messages.map((message) => (
                <Table.Row
                  key={message.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/contact/${message.id}`)}
                >
                  <Table.Cell className="text-ui-fg-subtle whitespace-nowrap">
                    {formatReceived(message.created_at)}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col">
                      <span
                        className={
                          message.status === "new"
                            ? "text-ui-fg-base font-medium"
                            : "text-ui-fg-base"
                        }
                      >
                        {message.name}
                      </span>
                      <span className="text-ui-fg-subtle text-xs">
                        {message.email}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell className="text-ui-fg-subtle">
                    <div className="flex flex-col">
                      <span>{TOPIC_LABELS[message.topic] ?? message.topic}</span>
                      {message.order_number && (
                        <span className="text-ui-fg-muted font-mono text-xs">
                          {message.order_number}
                        </span>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="text-ui-fg-subtle">
                    <span className="line-clamp-1 max-w-[520px]">
                      {message.message}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <StatusBadge color={STATUS_COLORS[message.status] ?? "grey"}>
                      {message.status}
                    </StatusBadge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          <div className="flex items-center justify-between px-6 py-3">
            <Text size="small" className="text-ui-fg-subtle">
              {count} {count === 1 ? "message" : "messages"} · page {page + 1} of{" "}
              {pageCount}
            </Text>
            <div className="flex items-center gap-x-2">
              <Button
                size="small"
                variant="secondary"
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                Previous
              </Button>
              <Button
                size="small"
                variant="secondary"
                disabled={page + 1 >= pageCount}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Contact",
  icon: ChatBubbleLeftRight,
})

export default ContactPage
