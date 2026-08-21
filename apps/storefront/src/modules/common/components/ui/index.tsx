/**
 * The site's primitive layer.
 *
 * `@medusajs/ui` was removed from this project and hand-replaced by a file of
 * stock `bg-black` / `gray-*` components, so the preset's tokens survived while
 * the components they were drawn for did not. This is the replacement: the same
 * export names, so the 78 files importing them do not churn, rebuilt on the
 * token set and on Radix for anything with real interaction behaviour.
 *
 * The split behind this barrel exists for one reason: a server component may
 * render a client component but may not *call a function* out of one. So the
 * class helper and everything presentational live in `primitives.tsx` with no
 * directive, and only the Radix-backed controls are a client boundary. Call
 * sites import from here either way.
 */

export { cn, clx } from "@lib/util/cn"

export {
  Badge,
  buttonVariants,
  Container,
  Divider,
  Eyebrow,
  Heading,
  IconBadge,
  inputClasses,
  Spinner,
  Table,
  Text,
} from "./primitives"

export {
  Button,
  Checkbox,
  IconButton,
  Input,
  Label,
  RadioDot,
  RadioGroup,
} from "./interactive"
