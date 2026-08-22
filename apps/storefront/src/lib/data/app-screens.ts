/**
 * What each application actually looks like when it is running.
 *
 * The homepage used to introduce twenty-eight applications as twenty-eight
 * logos with a caption each, which is a list of names for software nobody has
 * seen. Every competitor selling a home server — Umbrel, Start9, CasaOS —
 * shows the screen instead, because the screen is the product: a photo library
 * that is a photo library, a camera view with a box drawn round the person at
 * the door, a counter that says eighteen thousand requests were dropped today
 * and nobody noticed.
 *
 * We have no screenshots to ship and will not fake any, so these are drawings
 * of interfaces rather than captures of them: the site's own hairlines, ink and
 * paper, with the application's own colour as the single accent inside its
 * frame. Every label, count and filename below is illustrative — the shape of
 * what the software shows, not a measurement of a real machine.
 *
 * Six shapes cover all twenty-eight, because the software really does fall into
 * six shapes: a wall of pictures, a list of things, one figure that matters, a
 * board of states, a diagram of connections, and a conversation.
 */

/** One line in a `rows` screen. */
export type ScreenRow = {
  label: string
  /** Secondary text on the same line. */
  meta?: string
  /** Right-aligned figure, set in mono. */
  value?: string
  /** 0–1. Draws a hairline progress rule under the label. */
  progress?: number
  /** Renders a checkbox instead of a mark, in the given state. */
  done?: boolean
  /** Colours the leading dot. */
  state?: "on" | "warn" | "off"
}

export type ScreenBody =
  /**
   * Photographs. Real ones, from `public/apps/photos` — the thing a photo
   * library holds is the whole reason anybody runs one, and a grid of tinted
   * rectangles standing in for them was the single worst idea in this section's
   * history.
   */
  | {
      kind: "photos"
      /** How many of the thirty to show. */
      count: number
      /** The bar across the top: what the library is currently filtered to. */
      album: string
      /** Right-hand figure in that bar. */
      count_label: string
    }
  /** Cover art, from `public/apps/posters`, with what each one is. */
  | {
      kind: "covers"
      items: { title: string; meta: string; progress?: number }[]
      /** Marks the first item as the one currently playing. */
      playing?: string
    }
  /** Camera views, from `public/apps/cameras`, with a detection on the first. */
  | {
      kind: "cameras"
      tags: string[]
      detect?: boolean
    }
  /** A photograph of a room, with what the house knows about it over the top. */
  | {
      kind: "room"
      photo: number
      chips: { label: string; value: string; on?: boolean }[]
    }
  /** A list of things the application holds. */
  | {
      kind: "rows"
      rows: ScreenRow[]
      /** Column headings, set in mono above the first row. */
      head?: [string, string]
    }
  /** One figure that matters, with its history under it. */
  | {
      kind: "meter"
      value: string
      unit: string
      caption: string
      /** 0–1 each, oldest first. */
      bars: number[]
      foot: [string, string][]
    }
  /** A board of live states: rooms, sensors, days. */
  | {
      kind: "tiles"
      tiles: { label: string; value: string; on?: boolean }[]
    }
  /** A diagram of what is connected to what. */
  | {
      kind: "graph"
      layout: "hub" | "chain"
      hub: string
      nodes: { label: string; meta: string }[]
    }
  /** Something playing, with what is queued behind it. */
  | {
      kind: "player"
      where: string
      title: string
      chips: string[]
      elapsed: string
      total: string
      progress: number
      queue: { title: string; meta: string }[]
    }
  /** A conversation, because that is the whole interface. */
  | {
      kind: "chat"
      turns: { you: boolean; text: string }[]
    }

export type AppScreen = {
  /** The address it answers on, on your own network. Set in mono. */
  host: string
  /** The strip along the bottom of the frame: what the picture is showing. */
  strip: string
  body: ScreenBody
}

export const APP_SCREENS: Record<string, AppScreen> = {
  /* ---------------------------------------------------------------- files */

  immich: {
    host: "photos.home",
    strip: "4,812 photographs · 61.4 GB · every one of them on the disk in your cupboard",
    body: {
      kind: "photos",
      count: 24,
      album: "August 2026",
      count_label: "4,812 · 61.4 GB",
    },
  },

  nextcloud: {
    host: "files.home",
    strip: "The same folder open on the laptop, the phone and the machine downstairs",
    body: {
      kind: "photos",
      count: 18,
      album: "Household / Phone backup",
      count_label: "38.6 GB · syncing",
    },
  },

  syncthing: {
    host: "sync.home",
    strip: "No cloud in the middle: the machines talk to each other and the folder matches",
    body: {
      kind: "rows",
      head: ["Folder", "state"],
      rows: [
        { label: "Documents", meta: "laptop · phone · machine", value: "Up to date", state: "on" },
        { label: "Camera roll", meta: "phone → machine", value: "Syncing", state: "warn", progress: 0.62 },
        { label: "Work", meta: "laptop · office desktop", value: "Up to date", state: "on" },
        { label: "Music", meta: "machine → phone", value: "Up to date", state: "on" },
      ],
    },
  },

  paperlessngx: {
    host: "paper.home",
    strip: "Feed the scanner once; find the bill by typing three words two years later",
    body: {
      kind: "rows",
      head: ["Document", "added"],
      rows: [
        { label: "Electricity bill", meta: "#utilities · ₹3,412", value: "Aug 2026" },
        { label: "Health insurance policy", meta: "#insurance · renews March", value: "Jul 2026" },
        { label: "Car service invoice", meta: "#vehicle · 41,200 km", value: "Jun 2026" },
        { label: "Rental agreement", meta: "#house · 11 months", value: "Apr 2026" },
        { label: "Laptop warranty card", meta: "#warranty · 3 years", value: "Jan 2026" },
      ],
    },
  },

  duplicati: {
    host: "backup.home",
    strip: "Encrypted on the machine before it leaves, so the far end holds noise it cannot read",
    body: {
      kind: "meter",
      value: "02:14",
      unit: "last night",
      caption: "The second copy left the house while everyone was asleep.",
      bars: [0.82, 0.79, 0.86, 0.81, 0.9, 0.84, 0.77, 0.88, 0.83, 0.91, 0.8, 0.87, 0.85, 0.93],
      foot: [
        ["kept", "1.2 TB"],
        ["encryption", "AES-256"],
        ["restores tested", "14 of 14"],
      ],
    },
  },

  /* ---------------------------------------------------------------- media */

  jellyfin: {
    host: "films.home",
    strip: "Playing on the living room television · 1080p · no transcode, no buffering",
    body: {
      kind: "covers",
      playing: "living room television · 1080p · direct play",
      items: [
        { title: "Saturday's film", meta: "41:12 of 1:52:30", progress: 0.37 },
        { title: "The long documentary", meta: "12 min left", progress: 0.83 },
        { title: "Episode 4", meta: "phone, on the train", progress: 0.28 },
        { title: "The children's one", meta: "not started" },
        { title: "The one nobody finished", meta: "since March", progress: 0.11 },
      ],
    },
  },

  plex: {
    host: "plex.home",
    strip: "Picked up on a phone at exactly the minute the television was paused",
    body: {
      kind: "covers",
      playing: "continue watching",
      items: [
        { title: "Saturday's film", meta: "48 min left", progress: 0.46 },
        { title: "The long documentary", meta: "bedroom, last night", progress: 0.83 },
        { title: "Episode 4", meta: "phone, on the train", progress: 0.28 },
        { title: "The one nobody finished", meta: "started in March", progress: 0.11 },
        { title: "The children's one", meta: "played in the car", progress: 0.4 },
      ],
    },
  },

  audiobookshelf: {
    host: "audio.home",
    strip: "The position follows you from the car to the kitchen without an account in between",
    body: {
      kind: "covers",
      playing: "listening · kitchen speaker",
      items: [
        { title: "The one about ships", meta: "3 h 12 left", progress: 0.77 },
        { title: "A history of the road", meta: "6 h 41 left", progress: 0.26 },
        { title: "Thursday's podcast", meta: "fetched this morning", progress: 0.55 },
        { title: "The children's one", meta: "played in the car", progress: 0.4 },
        { title: "The long one", meta: "not started" },
      ],
    },
  },

  calibreweb: {
    host: "books.home",
    strip: "Send to the reader over the network; nothing passes through anyone's store",
    body: {
      kind: "covers",
      playing: "sent to the reader over the network",
      items: [
        { title: "The one about ships", meta: "EPUB · on the reader" },
        { title: "A history of the road", meta: "EPUB · 41 % read", progress: 0.41 },
        { title: "The maths textbook", meta: "PDF · shared with the house" },
        { title: "Short stories", meta: "EPUB · added last week" },
        { title: "The car manual", meta: "PDF · scanned, converted" },
      ],
    },
  },

  /* ---------------------------------------------------------------- house */

  homeassistant: {
    host: "house.home",
    strip: "Every switch answers to the cupboard, so the lights work when the internet does not",
    body: {
      kind: "room",
      photo: 7,
      chips: [
        { label: "Living room", value: "22.4 °C", on: true },
        { label: "Porch light", value: "On", on: true },
        { label: "Front door", value: "Locked" },
        { label: "Water heater", value: "Off" },
        { label: "Solar", value: "1.4 kW", on: true },
        { label: "Bedroom", value: "24.1 °C", on: true },
      ],
    },
  },

  frigate: {
    host: "cameras.home",
    strip: "Fourteen days kept on your own disk · nothing uploaded, nothing charged monthly",
    body: {
      kind: "cameras",
      detect: true,
      tags: [
        "front door · 19:04 · person",
        "driveway · 18:52 · car",
        "back gate · 17:31 · quiet",
        "garage · 16:08 · quiet",
        "side path · 14:22 · cat",
        "terrace · 11:47 · quiet",
      ],
    },
  },

  zigbee2mqtt: {
    host: "zigbee.home",
    strip: "Sensors from six makers on one network, and none of them phone home",
    body: {
      kind: "rows",
      head: ["Device", "battery"],
      rows: [
        { label: "Front door contact", meta: "signal 214", value: "84 %", state: "on" },
        { label: "Kitchen motion", meta: "signal 187", value: "91 %", state: "on" },
        { label: "Bedroom thermometer", meta: "signal 203", value: "62 %", state: "on" },
        { label: "Water leak, under sink", meta: "signal 156", value: "18 %", state: "warn" },
        { label: "Balcony light switch", meta: "mains powered", value: "—", state: "on" },
      ],
    },
  },

  nodered: {
    host: "flows.home",
    strip: "Drag a line between two boxes and the house has a new rule",
    body: {
      kind: "graph",
      layout: "chain",
      hub: "if nobody home, after sunset",
      nodes: [
        { label: "front door opens", meta: "trigger" },
        { label: "porch light on", meta: "action" },
        { label: "notify the phone", meta: "action" },
      ],
    },
  },

  /* -------------------------------------------------------------- network */

  pihole: {
    host: "dns.home",
    strip: "Every device on the network, including the television and the ones with no ad blocker",
    body: {
      kind: "meter",
      value: "18,431",
      unit: "requests dropped today",
      caption: "Advertising and tracking calls that never left the house. Nobody noticed.",
      bars: [
        0.12, 0.08, 0.05, 0.04, 0.06, 0.14, 0.32, 0.51, 0.64, 0.58, 0.49, 0.55,
        0.61, 0.57, 0.52, 0.6, 0.71, 0.83, 0.94, 0.88, 0.76, 0.62, 0.41, 0.24,
      ],
      foot: [
        ["of all queries", "41.2 %"],
        ["devices covered", "14"],
        ["blocklist", "1.2 M domains"],
      ],
    },
  },

  tailscale: {
    host: "net.home",
    strip: "Your machines find each other directly; nothing is exposed to the open internet",
    body: {
      kind: "graph",
      layout: "hub",
      hub: "valy.local",
      nodes: [
        { label: "phone", meta: "on mobile data" },
        { label: "work laptop", meta: "another city" },
        { label: "parents' house", meta: "shared folder" },
        { label: "television", meta: "living room" },
      ],
    },
  },

  wireguard: {
    host: "vpn.home",
    strip: "A tunnel you hold the keys to, instead of a plan you re-subscribe to every year",
    body: {
      kind: "rows",
      head: ["Peer", "last handshake"],
      rows: [
        { label: "Phone", meta: "12.4 MB up · 210 MB down", value: "12 s", state: "on" },
        { label: "Work laptop", meta: "1.1 GB up · 4.8 GB down", value: "48 s", state: "on" },
        { label: "Travel router", meta: "idle since Tuesday", value: "3 d", state: "off" },
        { label: "Tablet", meta: "84 MB up · 1.2 GB down", value: "2 m", state: "on" },
      ],
    },
  },

  nginxproxymanager: {
    host: "proxy.home",
    strip: "Real names and real certificates, issued to a machine that has no port open to the world",
    body: {
      kind: "rows",
      head: ["Host", "certificate"],
      rows: [
        { label: "photos.home", meta: "→ immich · 2283", value: "89 days", state: "on" },
        { label: "films.home", meta: "→ jellyfin · 8096", value: "89 days", state: "on" },
        { label: "house.home", meta: "→ homeassistant · 8123", value: "89 days", state: "on" },
        { label: "vault.home", meta: "→ vaultwarden · 8080", value: "89 days", state: "on" },
        { label: "status.home", meta: "→ uptime-kuma · 3001", value: "89 days", state: "on" },
      ],
    },
  },

  /* ----------------------------------------------------------- day to day */

  vaultwarden: {
    host: "vault.home",
    strip: "The same vault the Bitwarden apps talk to, with the database sitting in your cupboard",
    body: {
      kind: "rows",
      head: ["Item", "last used"],
      rows: [
        { label: "Bank", meta: "•••••••••••• · two-factor on", value: "today" },
        { label: "Railway booking", meta: "•••••••••• · shared with family", value: "Tuesday" },
        { label: "School portal", meta: "••••••••••••", value: "last week" },
        { label: "Electricity board", meta: "•••••••••", value: "Aug 4" },
        { label: "Wi-Fi, guest network", meta: "•••••••••••••", value: "Jul 28" },
      ],
    },
  },

  vikunja: {
    host: "lists.home",
    strip: "One list the whole house can see, instead of four apps and a fridge magnet",
    body: {
      kind: "rows",
      head: ["The house", "due"],
      rows: [
        { label: "Order the fourth drive", done: true, value: "done" },
        { label: "Renew the domain", meta: "assigned to whoever gets there first", value: "Sep 2" },
        { label: "Book the car service", meta: "assigned to the house", value: "Sep 9" },
        { label: "Sort the loft", meta: "moved four times", value: "someday" },
        { label: "Pay the water bill", done: true, value: "done" },
      ],
    },
  },

  actualbudget: {
    host: "money.home",
    strip: "The ledger stays on the machine; no bank credential is handed to a third party",
    body: {
      kind: "meter",
      value: "₹18,240",
      unit: "left this month",
      caption: "Eleven days to go, and the categories that are running hot are the food ones.",
      bars: [0.28, 0.71, 0.44, 0.62, 0.35, 0.88, 0.51, 0.24, 0.66, 0.4, 0.19, 0.57],
      foot: [
        ["budgeted", "₹92,000"],
        ["spent", "₹73,760"],
        ["accounts", "4, reconciled"],
      ],
    },
  },

  mealie: {
    host: "meals.home",
    strip: "Pick the week, and the shopping list writes itself from the recipes",
    body: {
      kind: "photos",
      count: 12,
      album: "This week's plan",
      count_label: "shopping list ready",
    },
  },

  /* ------------------------------------------------------------------ lab */

  proxmox: {
    host: "pve.home",
    strip: "Machines you can rebuild in a minute, on hardware you already paid for once",
    body: {
      kind: "rows",
      head: ["Guest", "uptime"],
      rows: [
        { label: "nas", meta: "4 vCPU · 8 GB · 24 TB passed through", value: "41 d", state: "on" },
        { label: "apps", meta: "6 vCPU · 12 GB", value: "41 d", state: "on" },
        { label: "home-assistant", meta: "2 vCPU · 4 GB", value: "41 d", state: "on" },
        { label: "test-box", meta: "2 vCPU · 4 GB · snapshot before every change", value: "stopped", state: "off" },
      ],
    },
  },

  docker: {
    host: "docker ps",
    strip: "Every application above is one of these lines, and removing one leaves no trace behind",
    body: {
      kind: "rows",
      head: ["Container", "status"],
      rows: [
        { label: "immich-server", meta: "ghcr.io/immich-app/immich-server", value: "up 41 d", state: "on" },
        { label: "jellyfin", meta: "lscr.io/linuxserver/jellyfin", value: "up 41 d", state: "on" },
        { label: "pihole", meta: "pihole/pihole", value: "up 41 d", state: "on" },
        { label: "vaultwarden", meta: "vaultwarden/server", value: "up 41 d", state: "on" },
        { label: "frigate", meta: "ghcr.io/blakeblackshear/frigate", value: "up 12 d", state: "on" },
      ],
    },
  },

  portainer: {
    host: "stacks.home",
    strip: "Start it, stop it, read its log — without opening a terminal or learning a flag",
    body: {
      kind: "meter",
      value: "28",
      unit: "containers running",
      caption: "Restart any one of them from a button, and watch its log in the next tab.",
      bars: [
        0.31, 0.28, 0.34, 0.29, 0.41, 0.36, 0.3, 0.27, 0.33, 0.44, 0.38, 0.32,
        0.29, 0.35, 0.4, 0.37, 0.31, 0.28,
      ],
      foot: [
        ["images", "31"],
        ["volumes", "22"],
        ["stopped", "0"],
      ],
    },
  },

  gitea: {
    host: "git.home",
    strip: "Private repositories with no seat count, on a disk you can hold",
    body: {
      kind: "rows",
      head: ["Repository", "updated"],
      rows: [
        { label: "house-config", meta: "the whole machine, in text", value: "2 h", state: "on" },
        { label: "photos-scripts", meta: "3 branches", value: "yesterday" },
        { label: "site", meta: "private", value: "Aug 12" },
        { label: "notes", meta: "private · 1,204 commits", value: "Aug 9" },
      ],
    },
  },

  uptimekuma: {
    host: "status.home",
    strip: "It tells you a service is down before anyone in the house has to come and tell you",
    body: {
      kind: "meter",
      value: "99.98",
      unit: "% over thirty days",
      caption: "One restart, eight minutes, at four in the morning. The notification arrived first.",
      bars: [
        1, 1, 1, 1, 1, 1, 1, 1, 0.62, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1,
      ],
      foot: [
        ["monitors", "28"],
        ["down now", "0"],
        ["alerts to", "phone, email"],
      ],
    },
  },

  grafana: {
    host: "metrics.home",
    strip: "Disks, temperature and power over months, so a failure has a shape before it happens",
    body: {
      kind: "meter",
      value: "38",
      unit: "°C array temperature",
      caption: "Twenty-four hours. The evening rise is the film that played downstairs.",
      bars: [
        0.42, 0.4, 0.38, 0.37, 0.36, 0.38, 0.44, 0.52, 0.58, 0.55, 0.51, 0.54,
        0.57, 0.53, 0.5, 0.56, 0.68, 0.79, 0.91, 0.86, 0.72, 0.61, 0.5, 0.45,
      ],
      foot: [
        ["draw", "41 W idle"],
        ["disks", "4, all healthy"],
        ["fan", "780 rpm"],
      ],
    },
  },

  ollama: {
    host: "ask.home",
    strip: "The question, the documents and the answer all stay inside the house",
    body: {
      kind: "chat",
      turns: [
        { you: true, text: "Which month was the car serviced, and what did it cost?" },
        {
          you: false,
          text: "June 2026, ₹8,410, at 41,200 km — from the invoice in your documents folder. The next one is due at 51,000 km.",
        },
        { you: true, text: "Draft a reply asking about the warranty on that." },
      ],
    },
  },
}
