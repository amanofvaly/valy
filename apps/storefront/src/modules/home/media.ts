/**
 * Photography used on the homepage. Draft imagery from Unsplash — swap these
 * for real photos of Valy builds before launch.
 */
const unsplash = (id: string, width: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`

export const homeMedia = {
  rack: unsplash("photo-1558494949-ef010cbdcc31", 1400),
  drive: unsplash("photo-1597852074816-d933c7d2b988", 900),
  livingRoom: unsplash("photo-1614624532983-4ce03382d63d", 900),
  board: unsplash("photo-1518770660439-4636190af475", 900),
  patchPanel: unsplash("photo-1544197150-b99a580bb7a8", 900),
  benchTest: unsplash("photo-1573164713988-8665fc963095", 1200),
}
