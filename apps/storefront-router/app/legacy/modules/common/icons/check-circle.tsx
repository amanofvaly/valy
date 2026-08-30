import React from "react"

import { IconProps } from "types/icon"

/**
 * A filled disc with the tick knocked out of it, rather than a tick drawn on
 * top of a ring. Solid reads as settled at the small size this is used at, and
 * the knockout means the tick takes the colour of whatever it sits on instead
 * of needing a second colour passed in.
 */
const CheckCircle: React.FC<IconProps> = ({
  size = "20",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20ZM14.7071 7.70711C15.0976 7.31658 15.0976 6.68342 14.7071 6.29289C14.3166 5.90237 13.6834 5.90237 13.2929 6.29289L8.5 11.0858L6.70711 9.29289C6.31658 8.90237 5.68342 8.90237 5.29289 9.29289C4.90237 9.68342 4.90237 10.3166 5.29289 10.7071L7.79289 13.2071C8.18342 13.5976 8.81658 13.5976 9.20711 13.2071L14.7071 7.70711Z"
        fill={color}
      />
    </svg>
  )
}

export default CheckCircle
