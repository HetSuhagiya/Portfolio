/**
 * Every signature module receives the same props from the Approach section.
 *
 * The four chapters of a case study map to steps 0..3. On desktop the section is pinned and the step
 * follows scroll; on touch and under reduced motion the reader picks the step with buttons.
 * A module must be fully usable at any step and must never depend on hover or drag alone.
 */
export type ModuleProps = {
  step: number;
  steps: number;
  /** True when the section is pinned and scroll drives `step`. */
  pinned: boolean;
  /** Ask the section to move to a step (scrolls when pinned). */
  goTo: (step: number) => void;
};

/** Media query under which the Approach section is pinned. Mirrored in globals.css (.approach). */
export const PIN_QUERY = '(min-width: 1024px) and (min-height: 620px) and (hover: hover) and (prefers-reduced-motion: no-preference)';
