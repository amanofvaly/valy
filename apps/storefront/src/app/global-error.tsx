"use client"

/**
 * The last resort: a failure in the root layout itself, which replaces the
 * entire document. It cannot use any of the site's components, fonts or
 * stylesheet — none of them are guaranteed to have loaded — so everything here
 * is inline and self-contained.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: "4rem 1.25rem",
          background: "#ffffff",
          color: "#15181c",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ maxWidth: "34rem", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
            The site failed to load.
          </h1>
          <p style={{ color: "#666c75", lineHeight: 1.7, marginTop: "0.75rem" }}>
            Nothing has been charged and nothing has been lost. Reloading
            usually fixes it.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              height: "2.5rem",
              padding: "0 1rem",
              borderRadius: 4,
              border: "none",
              background: "#15181c",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: "1.5rem",
                color: "#666c75",
                fontSize: "0.8125rem",
              }}
            >
              Reference{" "}
              <span style={{ fontFamily: "ui-monospace, monospace" }}>
                {error.digest}
              </span>
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
