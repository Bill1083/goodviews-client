export interface SpotlightStep {
  /** Route to navigate to before spotlighting (no-op if already there). */
  route: string
  /** Matches a `data-tutorial-anchor="..."` attribute on the target element. */
  anchor: string
  /** Short callout text next to the arrow. */
  text: string
  /** Which side of the element the callout sits on. Defaults to 'bottom'. */
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export interface Tutorial {
  /** Stable id, never reused — this is what's appended to seen_tutorials. */
  key: string
  /** ISO date this feature shipped. Accounts created before this date are
   * eligible to see the tutorial pop up on its own; accounts created after
   * it skip it automatically, since the feature was just always there for
   * them — see features/tutorials/TutorialManager.tsx. */
  shippedAt: string
  /** Short label used in the "Features & Tutorials" list in Profile. */
  title: string
  /** The small intro toast shown first, before anything moves. */
  intro: string
  /** One or more real UI elements to walk through in order, each one lit
   * up in place rather than described in a dialog. */
  spotlights: SpotlightStep[]
}

/** Every feature tutorial, oldest first. Adding a new one is just adding an
 * entry here — no database migration, no new column, no new endpoint. Give
 * the element it points at a `data-tutorial-anchor="<anchor>"` attribute. */
export const TUTORIALS: Tutorial[] = [
  {
    key: 'hover_highlight',
    shippedAt: '2026-10-07',
    title: 'Personal Hover Highlight',
    intro: '✨ Films can now light up when you hover over them.',
    spotlights: [
      {
        route: '/settings',
        anchor: 'hover-highlight-toggle',
        text: 'Flip this on to pick your own neon hover colour.',
        placement: 'bottom',
      },
    ],
  },
]
