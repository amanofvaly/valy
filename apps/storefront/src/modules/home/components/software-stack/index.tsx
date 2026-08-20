import SectionHeading from "@modules/home/components/section-heading"

const software = [
  { name: "Proxmox VE", note: "Hypervisor" },
  { name: "TrueNAS Scale", note: "ZFS storage" },
  { name: "Unraid", note: "Mixed drives" },
  { name: "Jellyfin", note: "Media" },
  { name: "Plex", note: "Media" },
  { name: "Immich", note: "Photos" },
  { name: "Home Assistant", note: "Automation" },
  { name: "Docker + Portainer", note: "Containers" },
  { name: "Nextcloud", note: "Files" },
  { name: "Pi-hole", note: "DNS" },
  { name: "Frigate", note: "Cameras" },
  { name: "Tailscale", note: "Remote access" },
]

const SoftwareStack = () => {
  return (
    <section className="border-t border-zinc-200 bg-zinc-50 py-16 lg:py-24">
      <div className="content-container flex flex-col gap-10">
        <SectionHeading
          eyebrow="Preloaded, not preached"
          title="It arrives running what you already use."
          description="Name the stack when you order and the machine boots into it, with storage pools created and remote access working. Wipe it on day one if you would rather build it yourself."
        />

        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-large border border-zinc-200 bg-zinc-200 sm:grid-cols-3 lg:grid-cols-4">
          {software.map((item) => (
            <li
              key={item.name}
              className="flex flex-col gap-1 bg-white px-5 py-4"
            >
              <span className="text-sm font-medium text-zinc-900">
                {item.name}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                {item.note}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default SoftwareStack
