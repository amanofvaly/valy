/*
 * `next/font/google`, as a stub. Fonts are loaded with a stylesheet link in the
 * root route instead, so these only need to return the shape callers destructure.
 */
type Font = { variable: string; className: string; style: { fontFamily: string } }
const font = (family: string) => (): Font => ({
  variable: "",
  className: "",
  style: { fontFamily: family },
})
export const Inter = font("Inter")
export const IBM_Plex_Mono = font("IBM Plex Mono")
