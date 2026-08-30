/**
 * The mark, in whatever colour it is put in.
 *
 * `valy-logo.svg` at the repository root is the brand file and is brand blue;
 * it ships unchanged as the favicon, where a mark is the only thing on screen
 * and colour is how it is found in a row of tabs.
 *
 * This is the same geometry with the fill taken off, so it inherits
 * `currentColor`. In the header that is `text-ink`: the wordmark beside it is
 * the name, and two blue triangles next to a black word would read as two
 * marks rather than one.
 */
export const ValyMark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 900 900"
    className={className}
    fill="currentColor"
    fillRule="evenodd"
    clipRule="evenodd"
    aria-hidden
    focusable="false"
  >
    <g transform="matrix(0.5,0,0,0.75,0,0)">
      <g transform="matrix(3.41463,-2.27642,3.41463,2.27642,-3170.057654,1199.132551)">
        <path d="M683,254L753,394L613,394L683,254Z" />
      </g>
      <g transform="matrix(3.41463,2.27642,-3.41463,2.27642,305.673148,-1913.676463)">
        <path d="M683,254L753,394L613,394L683,254Z" />
      </g>
      <g transform="matrix(-4.182051,1.609672,-2.414508,-2.788034,4370.376175,589.425539)">
        <path d="M683,254L753,394L613,394L683,254Z" />
      </g>
      <g transform="matrix(-4.182051,-1.609672,2.414508,-2.788034,3143.806116,2788.237482)">
        <path d="M683,254L753,394L613,394L683,254Z" />
      </g>
    </g>
  </svg>
)
