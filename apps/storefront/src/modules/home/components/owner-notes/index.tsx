import SectionHeading from "@modules/home/components/section-heading"

/**
 * Placeholder copy. Replace with real, attributable customer quotes before
 * launch — do not ship invented reviews.
 */
const notes = [
  {
    quote:
      "Eleven years of raw photos moved off four failing external drives in one weekend. The bay-to-serial sheet taped inside the lid is the detail I did not know I wanted.",
    name: "Owner, VLY-C4",
    place: "Pune",
    config: "4 x 12 TB, TrueNAS Scale",
  },
  {
    quote:
      "Three 4K streams to the living room, my parents in Kochi, and my sister's Firestick, all at once. It sits in the TV cabinet and I forget it is there.",
    name: "Owner, VLY-N2",
    place: "Bengaluru",
    config: "2 x 8 TB, Jellyfin",
  },
  {
    quote:
      "Replaced three cloud instances we were renting for staging. It paid for itself in about seven months, and the invoice went straight through accounts.",
    name: "Studio lead, VLY-V8",
    place: "Ahmedabad",
    config: "8 x 16 TB, Proxmox",
  },
]

const OwnerNotes = () => {
  return (
    <section className="border-t border-zinc-200 bg-white py-16 lg:py-24">
      <div className="content-container flex flex-col gap-12">
        <SectionHeading
          eyebrow="From the racks"
          title="What owners run, in their words."
        />

        <ul className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {notes.map((note) => (
            <li
              key={note.name}
              className="flex flex-col gap-6 rounded-large border border-zinc-200 p-6"
            >
              <p className="flex-1 text-base leading-7 text-zinc-800">
                {note.quote}
              </p>
              <div className="flex flex-col gap-1 border-t border-zinc-200 pt-4">
                <span className="text-sm font-medium text-zinc-900">
                  {note.name}, {note.place}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  {note.config}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default OwnerNotes
