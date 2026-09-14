/**
 * A plus, drawn rather than pulled from an icon set.
 *
 * This is the only icon on the app that is not the brand mark or a provider
 * logo, and bootstrap-icons costs a ~120 KB font plus its stylesheet — or a
 * build step to tree-shake the SVG set — to deliver two strokes. Inline SVG
 * ships the two strokes.
 *
 * `currentColor` so it takes the button's ink in either theme, and no explicit
 * fill on the stroke so it stays a line at any size.
 */
export default function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false">
      <path d="M8 3.25v9.5M3.25 8h9.5" />
    </svg>
  );
}
